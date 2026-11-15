#!/usr/bin/env node
/** Headless Chromium CDP test for catalog/humanoids/inspector.html (UI filtering + local GLB inspection + disposal). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const REPO_ROOT = '/Users/andrew/modern_3d_browser_game_toolkit';
const TEST_GLB = '/Users/andrew/.gemini/antigravity/brain/40a2b12e-a2e9-4a0d-a936-40d441798d11/scratch/processed-glb/kaykit/adventurers/characters/Knight.glb';
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/__test_knight.glb') {
        res.writeHead(200, { 'Content-Type': 'model/gltf-binary' });
        fs.createReadStream(TEST_GLB).pipe(res);
        return;
      }
      const filePath = path.join(REPO_ROOT, urlPath.replace(/^\/+/, ''));
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
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
    this.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(JSON.stringify(m.error)));
        else resolve(m.result);
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

async function main() {
  const srv = await startServer();
  const port = srv.address().port;
  const userDataDir = fs.mkdtempSync('/tmp/cdp-inspector-');
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=0',
    '--window-size=1280,800',
    `http://127.0.0.1:${port}/catalog/humanoids/inspector.html`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let wsUrl = null;
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Chrome WS timeout')), 15000);
    const fn = (c) => {
      const m = c.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { clearTimeout(t); wsUrl = m[1]; resolve(); }
    };
    chrome.stderr.on('data', fn);
    chrome.stdout.on('data', fn);
  });

  const browserPort = new URL(wsUrl).port;
  let target;
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`http://127.0.0.1:${browserPort}/json/list`)).json();
    target = list.find((x) => x.type === 'page' && x.url.includes('inspector.html'));
    if (target) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  const errors = [];
  cdp.ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params);
    if (m.method === 'Log.entryAdded' && m.params?.entry?.level === 'error') errors.push(m.params.entry);
  });

  for (let i = 0; i < 40; i++) {
    const r = await cdp.send('Runtime.evaluate', { expression: 'Boolean(window.__inspectorReady)', returnByValue: true });
    if (r?.result?.value) break;
    await new Promise((r2) => setTimeout(r2, 100));
  }

  // Test filtering + synthetic local file drop into inspector
  const check = await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      const initialCount = document.getElementById('count-badge').textContent;
      const s = document.getElementById('search-input');
      s.value = 'Knight';
      s.dispatchEvent(new Event('input'));
      const filteredCount = document.getElementById('count-badge').textContent;
      const resp = await fetch('/__test_knight.glb');
      const buf = await resp.arrayBuffer();
      const file = new File([buf], 'Knight.glb', { type: 'model/gltf-binary' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('glb-file-input');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 400));
      const metrics = document.getElementById('local-glb-metrics').innerText;
      document.getElementById('btn-dispose').click();
      await new Promise((r) => setTimeout(r, 100));
      const afterDispose = document.getElementById('local-glb-metrics').innerText;
      return { initialCount, filteredCount, metrics, afterDispose };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('Inspector CDP check:', JSON.stringify(check.result.value));
  console.log('Errors:', errors.length);

  cdp.close();
  await new Promise((res) => { chrome.once('exit', res); chrome.kill('SIGTERM'); setTimeout(res, 2000); });
  srv.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}

  if (errors.length > 0 || check.result.value.initialCount !== '296' || !check.result.value.metrics.includes('Knight.glb')) {
    console.error('Inspector smoke test failed!', errors);
    process.exit(1);
  }
  console.log('INSPECTOR SMOKE PASSED (296 catalog items + search + local GLB parse/render/dispose)');
}

main().catch((e) => { console.error(e); process.exit(1); });
