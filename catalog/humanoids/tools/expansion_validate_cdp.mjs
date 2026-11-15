#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, spawn } from 'node:child_process';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const PROCESSED_ROOT = path.resolve(process.env.PROCESSED_ROOT || '/tmp/expansion-out/processed-glb');
const QA_OUT = path.resolve(process.env.QA_OUT || '/tmp/expansion-out/visual-qa');
const REPORT_PATH = path.resolve(process.env.REPORT_PATH || path.join(QA_OUT, 'expansion_webgl2_report.json'));
const MAX_SHOTS_PER_SOURCE = Number(process.env.MAX_SHOTS_PER_SOURCE || '10');
const FILTER_PREFIX = process.env.SOURCE_FILTER || '';

fs.mkdirSync(QA_OUT, { recursive: true });
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
};

function findBrowser() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(macChrome)) return macChrome;
  for (const cmd of ['google-chrome', 'chromium', 'chromium-browser']) {
    try {
      const p = execSync(`command -v ${cmd}`, { encoding: 'utf8' }).trim();
      if (p) return p;
    } catch {
      // continue
    }
  }
  throw new Error('No Chromium/Chrome binary found');
}

function listGlbs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listGlbs(full));
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.glb')) out.push(full);
  }
  return out.sort();
}

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const filePath = urlPath.startsWith('/__processed_glb/')
        ? path.join(PROCESSED_ROOT, urlPath.slice('/__processed_glb/'.length))
        : path.join(REPO_ROOT, urlPath.replace(/^\/+/, ''));
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found: ' + urlPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', rej);
    });
    this.onEvent = null;
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (this.onEvent) {
        this.onEvent(msg);
      }
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return await new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.ws.close(); }
}

const server = await startServer();
const { port } = server.address();
const browserBin = findBrowser();
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exp-cdp-'));
const chrome = spawn(browserBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--remote-allow-origins=*',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let stderrBuf = '';
chrome.stderr.on('data', (d) => { stderrBuf += d.toString(); });
chrome.stdout.on('data', (d) => { stderrBuf += d.toString(); });

let debugPort = null;
for (let i = 0; i < 100; i++) {
  const m = stderrBuf.match(/ws:\/\/127\.0\.0\.1:(\d+)\/devtools/);
  if (m) { debugPort = Number(m[1]); break; }
  await new Promise((r) => setTimeout(r, 100));
}
if (!debugPort) {
  chrome.kill();
  server.close();
  throw new Error(`Chromium failed to expose DevTools port: ${stderrBuf}`);
}

const pageTarget = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/catalog/humanoids/tools/validate_multisource.html`)}`, { method: 'PUT' }).then((r) => r.json());
const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
const consoleErrors = [];
const pageExceptions = [];
cdp.onEvent = (msg) => {
  if (msg.method === 'Runtime.exceptionThrown') {
    pageExceptions.push(msg.params.exceptionDetails?.text || 'exception');
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args?.map((a) => a.value ?? a.description).join(' ') || 'console.error');
  }
};

await cdp.send('Runtime.enable');
await cdp.send('Page.enable');

for (let i = 0; i < 100; i++) {
  const r = await cdp.send('Runtime.evaluate', { expression: 'Boolean(window.__validatorReady)', returnByValue: true });
  if (r.result?.value) break;
  await new Promise((r2) => setTimeout(r2, 100));
}

const allGlbs = listGlbs(PROCESSED_ROOT).filter((f) => {
  const rel = path.relative(PROCESSED_ROOT, f);
  return !FILTER_PREFIX || rel.startsWith(FILTER_PREFIX);
});

const bySourceShotCount = new Map();
const firstBySource = new Map();
const results = [];
const failures = [];

for (const glbPath of allGlbs) {
  const rel = path.relative(PROCESSED_ROOT, glbPath);
  const srcKey = rel.split(path.sep)[0];
  if (!firstBySource.has(srcKey)) firstBySource.set(srcKey, rel);

  const cfg = {
    id: rel.replace(/\.glb$/i, ''),
    modelUrl: `/__processed_glb/${rel.split(path.sep).map(encodeURIComponent).join('/')}`,
    sampleTime: 0.25,
  };
  const evalRes = await cdp.send('Runtime.evaluate', {
    expression: `window.__runCase(${JSON.stringify(cfg)})`,
    awaitPromise: true,
    returnByValue: true,
  });

  if (evalRes.exceptionDetails) {
    failures.push({ rel, error: evalRes.exceptionDetails.text || JSON.stringify(evalRes.exceptionDetails) });
    continue;
  }
  const val = evalRes.result?.value;
  if (!val || !val.ok || !val.isWebGL2 || val.glError !== 0 || !(val.coveragePositiveZ?.ratio > 0.001) || !(val.coverageNegativeZ?.ratio > 0.001)) {
    failures.push({
      rel,
      error: 'render_or_coverage_check_failed',
      isWebGL2: val?.isWebGL2,
      glError: val?.glError,
      covPos: val?.coveragePositiveZ?.ratio,
      covNeg: val?.coverageNegativeZ?.ratio,
    });
  }

  const prevShots = bySourceShotCount.get(srcKey) || 0;
  let shotPosRel = null;
  let shotNegRel = null;
  if (prevShots < MAX_SHOTS_PER_SOURCE && val?.pngPos && val?.pngNeg) {
    bySourceShotCount.set(srcKey, prevShots + 1);
    const safeStem = rel.replace(/\.glb$/i, '').replace(/[/\\]/g, '__');
    const p1 = path.join(QA_OUT, `${safeStem}__posZ.png`);
    const p2 = path.join(QA_OUT, `${safeStem}__negZ.png`);
    fs.writeFileSync(p1, Buffer.from(val.pngPos.split(',')[1], 'base64'));
    fs.writeFileSync(p2, Buffer.from(val.pngNeg.split(',')[1], 'base64'));
    shotPosRel = path.relative(QA_OUT, p1);
    shotNegRel = path.relative(QA_OUT, p2);
  }

  results.push({
    rel,
    source_key: srcKey,
    isWebGL2: val?.isWebGL2,
    glError: val?.glError,
    stats: val?.stats,
    activeClipName: val?.activeClipName,
    coveragePositiveZ: val?.coveragePositiveZ,
    coverageNegativeZ: val?.coverageNegativeZ,
    screenshots: shotPosRel ? [shotPosRel, shotNegRel] : [],
  });
}

// 5-cycle GPU disposal leak check for one representative per source pack
const disposalTests = [];
for (const [srcKey, rel] of firstBySource.entries()) {
  const modelUrl = `/__processed_glb/${rel.split(path.sep).map(encodeURIComponent).join('/')}`;
  const evalRes = await cdp.send('Runtime.evaluate', {
    expression: `window.__runDisposalCycle(${JSON.stringify(modelUrl)}, 5)`,
    awaitPromise: true,
    returnByValue: true,
  });
  const snaps = evalRes.result?.value || [];
  const last = snaps[snaps.length - 1]?.after || { geometries: -1, textures: -1 };
  const pass = snaps.length === 5 && last.geometries === 0 && last.textures === 0;
  disposalTests.push({ srcKey, rel, pass, afterCycle5: last });
  if (!pass) failures.push({ rel, error: `disposal_leak:${JSON.stringify(last)}` });
}

cdp.close();
chrome.kill();
server.close();
fs.rmSync(userDataDir, { recursive: true, force: true });

const report = {
  generated_utc: new Date().toISOString(),
  total_glbs_tested: allGlbs.length,
  passed_count: results.length - failures.length,
  failed_count: failures.length,
  console_errors: consoleErrors,
  page_exceptions: pageExceptions,
  disposal_tests: disposalTests,
  failures,
  results,
};
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  total_glbs_tested: allGlbs.length,
  failures: failures.length,
  console_errors: consoleErrors.length,
  page_exceptions: pageExceptions.length,
  disposal_all_zero: disposalTests.every((d) => d.pass),
}));
if (failures.length > 0 || consoleErrors.length > 0 || pageExceptions.length > 0 || allGlbs.length === 0) {
  process.exit(1);
}
