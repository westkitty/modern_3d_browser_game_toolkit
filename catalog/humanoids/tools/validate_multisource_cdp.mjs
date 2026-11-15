#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const REPO_ROOT = '/Users/andrew/modern_3d_browser_game_toolkit';
const PROCESSED_ROOT = '/Users/andrew/.gemini/antigravity/brain/40a2b12e-a2e9-4a0d-a936-40d441798d11/scratch/processed-glb';
const ROCKETBOX_SAMPLE_ROOT = '/Users/andrew/.gemini/antigravity/brain/40a2b12e-a2e9-4a0d-a936-40d441798d11/scratch/rocketbox_sample';
const QA_OUT = '/Users/andrew/.gemini/antigravity/brain/40a2b12e-a2e9-4a0d-a936-40d441798d11/scratch/visual-qa';
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

fs.mkdirSync(QA_OUT, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath;
      if (urlPath.startsWith('/__processed_glb/')) {
        filePath = path.join(PROCESSED_ROOT, urlPath.slice('/__processed_glb/'.length));
      } else if (urlPath.startsWith('/__rocketbox_sample/')) {
        filePath = path.join(ROCKETBOX_SAMPLE_ROOT, urlPath.slice('/__rocketbox_sample/'.length));
      } else {
        filePath = path.join(REPO_ROOT, urlPath.replace(/^\/+/, ''));
      }
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
    this.events = [];
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', rej);
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else {
        this.events.push(msg);
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

const UAL_TO_UMW = {
  Hips: 'pelvis',
  Abdomen: 'spine_01',
  Torso: 'spine_02',
  Chest: 'spine_03',
  Neck: 'neck_01',
  Head: 'Head',
  'Shoulder.L': 'clavicle_l',
  'UpperArm.L': 'upperarm_l',
  'LowerArm.L': 'lowerarm_l',
  'Wrist.L': 'hand_l',
  'Shoulder.R': 'clavicle_r',
  'UpperArm.R': 'upperarm_r',
  'LowerArm.R': 'lowerarm_r',
  'Wrist.R': 'hand_r',
  'UpperLeg.L': 'thigh_l',
  'LowerLeg.L': 'calf_l',
  'Foot.L': 'foot_l',
  'UpperLeg.R': 'thigh_r',
  'LowerLeg.R': 'calf_r',
  'Foot.R': 'foot_r',
};

const UAL_TO_ROCKETBOX = {
  'Bip01 Pelvis': 'pelvis',
  'Bip01 Spine': 'spine_01',
  'Bip01 Spine1': 'spine_02',
  'Bip01 Spine2': 'spine_03',
  'Bip01 Neck': 'neck_01',
  'Bip01 Head': 'Head',
  'Bip01 L Clavicle': 'clavicle_l',
  'Bip01 L UpperArm': 'upperarm_l',
  'Bip01 L Forearm': 'lowerarm_l',
  'Bip01 L Hand': 'hand_l',
  'Bip01 R Clavicle': 'clavicle_r',
  'Bip01 R UpperArm': 'upperarm_r',
  'Bip01 R Forearm': 'lowerarm_r',
  'Bip01 R Hand': 'hand_r',
  'Bip01 L Thigh': 'thigh_l',
  'Bip01 L Calf': 'calf_l',
  'Bip01 L Foot': 'foot_l',
  'Bip01 R Thigh': 'thigh_r',
  'Bip01 R Calf': 'calf_r',
  'Bip01 R Foot': 'foot_r',
};

const UAL_TO_KAYKIT = {
  hips: 'pelvis',
  spine: 'spine_01',
  chest: 'spine_03',
  head: 'Head',
  'upperarm.l': 'upperarm_l',
  'lowerarm.l': 'lowerarm_l',
  'hand.l': 'hand_l',
  'upperarm.r': 'upperarm_r',
  'lowerarm.r': 'lowerarm_r',
  'hand.r': 'hand_r',
  'upperleg.l': 'thigh_l',
  'lowerleg.l': 'calf_l',
  'foot.l': 'foot_l',
  'upperleg.r': 'thigh_r',
  'lowerleg.r': 'calf_r',
  'foot.r': 'foot_r',
};

const CASES = [
  {
    id: '01_kaykit_knight_melee_sword',
    modelUrl: '/__processed_glb/kaykit/adventurers/characters/Knight.glb',
    animUrl: '/__processed_glb/kaykit/character-animations/rig-medium/Rig_Medium_CombatMelee.glb',
    clipName: 'Melee_1H_Attack_Chop',
    attachAccessory: {
      bone: 'handslot.r',
      url: '/__processed_glb/kaykit/adventurers/accessories/sword_1handed.glb',
    },
    sampleTime: 0.35,
  },
  {
    id: '02_kaykit_barbarian_movement',
    modelUrl: '/__processed_glb/kaykit/adventurers/characters/Barbarian.glb',
    animUrl: '/__processed_glb/kaykit/character-animations/rig-medium/Rig_Medium_MovementBasic.glb',
    clipName: 'Running_A',
    sampleTime: 0.28,
  },
  {
    id: '03_kaykit_skeleton_warrior_special',
    modelUrl: '/__processed_glb/kaykit/skeletons/characters/Skeleton_Warrior.glb',
    animUrl: '/__processed_glb/kaykit/character-animations/rig-medium/Rig_Medium_Special.glb',
    clipName: 'Skeleton_Inactive_Standing_Pose',
    attachAccessory: {
      bone: 'handslot.r',
      url: '/__processed_glb/kaykit/skeletons/accessories/Skeleton_Blade.glb',
    },
    sampleTime: 0.25,
  },
  {
    id: '04_kaykit_skeleton_mage',
    modelUrl: '/__processed_glb/kaykit/skeletons/characters/Skeleton_Mage.glb',
    animUrl: '/__processed_glb/kaykit/skeletons/animations/Rig_Medium_General.glb',
    clipName: 'Idle_A',
    sampleTime: 0.2,
  },
  {
    id: '05_kaykit_mannequin_medium',
    modelUrl: '/__processed_glb/kaykit/character-animations/characters/Mannequin_Medium.glb',
    animUrl: '/__processed_glb/kaykit/character-animations/rig-medium/Rig_Medium_MovementAdvanced.glb',
    sampleTime: 0.3,
  },
  {
    id: '06_kaykit_mannequin_large_rig_large',
    modelUrl: '/__processed_glb/kaykit/character-animations/characters/Mannequin_Large.glb',
    animUrl: '/__processed_glb/kaykit/character-animations/rig-large/Rig_Large_CombatMelee.glb',
    sampleTime: 0.3,
  },
  {
    id: '07_quaternius_ubc_female_ual1_hair',
    modelUrl: '/__processed_glb/quaternius/universal-base-characters-standard/characters/Superhero_Female_FullBody.glb',
    extraParts: ['/__processed_glb/quaternius/universal-base-characters-standard/hairstyles-rigged-head/Hair_Buns.glb'],
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Jog_Fwd_Loop',
    sampleTime: 0.35,
  },
  {
    id: '08_quaternius_ubc_male_ual2',
    modelUrl: '/__processed_glb/quaternius/universal-base-characters-standard/characters/Superhero_Male_FullBody.glb',
    animUrl: '/__processed_glb/quaternius/ual2-standard/animations/UAL2_Standard.glb',
    clipName: 'Idle_Talking_Loop',
    sampleTime: 0.35,
  },
  {
    id: '09_quaternius_modular_outfit_female_ranger',
    modelUrl: '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/outfits/Female_Ranger.glb',
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Idle_Loop',
    sampleTime: 0.35,
  },
  {
    id: '10_quaternius_modular_assembled_ranger',
    modelUrl: '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Body.glb',
    extraParts: [
      '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Arms.glb',
      '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Legs.glb',
      '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Feet_Boots.glb',
      '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Head_Hood.glb',
      '/__processed_glb/quaternius/modular-character-outfits-fantasy-standard/modular-parts/Male_Ranger_Acc_Pauldron.glb',
    ],
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Jog_Fwd_Loop',
    sampleTime: 0.35,
  },
  {
    id: '11_quaternius_ual2_mannequin_f',
    modelUrl: '/__processed_glb/quaternius/ual2-standard/characters/Mannequin_F.glb',
    animUrl: '/__processed_glb/quaternius/ual2-standard/animations/UAL2_Standard.glb',
    sampleTime: 0.35,
  },
  {
    id: '12_quaternius_umw_witch_embedded',
    modelUrl: '/__processed_glb/quaternius/ultimate-modular-women/characters/Witch.glb',
    clipName: 'Run',
    sampleTime: 0.3,
  },
  {
    id: '13_quaternius_umw_modular_assembled',
    modelUrl: '/__processed_glb/quaternius/ultimate-modular-women/modular-parts/Adventurer/Adventurer_Body.glb',
    extraParts: [
      '/__processed_glb/quaternius/ultimate-modular-women/modular-parts/Adventurer/Adventurer_Head.glb',
      '/__processed_glb/quaternius/ultimate-modular-women/modular-parts/Adventurer/Adventurer_Legs.glb',
      '/__processed_glb/quaternius/ultimate-modular-women/modular-parts/Adventurer/Adventurer_Feet.glb',
      '/__processed_glb/quaternius/ultimate-modular-women/modular-parts/Adventurer/Adventurer_Backpack.glb',
    ],
    animUrl: '/__processed_glb/quaternius/ultimate-modular-women/animations/UMW_Animations.glb',
    clipName: 'Idle_Sword',
    sampleTime: 0.3,
  },
  {
    id: '14_quaternius_rpg_wizard_embedded',
    modelUrl: '/__processed_glb/quaternius/rpg-characters/characters/Wizard.glb',
    clipName: 'Walk',
    sampleTime: 0.3,
  },
  {
    id: '15_retarget_ual1_to_umw_adventurer',
    modelUrl: '/__processed_glb/quaternius/ultimate-modular-women/characters/Adventurer.glb',
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Jog_Fwd_Loop',
    retargetFrom: 'quaternius-universal-65',
    retargetNames: UAL_TO_UMW,
    retargetHip: 'Hips',
    sampleTime: 0.35,
  },
  {
    id: '16_retarget_ual1_to_rocketbox_male01',
    modelUrl: '/__rocketbox_sample/Male_Adult_01.glb',
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Jog_Fwd_Loop',
    retargetFrom: 'quaternius-universal-65',
    retargetNames: UAL_TO_ROCKETBOX,
    retargetHip: 'Bip01 Pelvis',
    useRestOffsets: true,
    rotationTracksOnly: true,
    sampleTime: 0.35,
  },
  {
    id: '17_retarget_ual1_to_kaykit_knight',
    modelUrl: '/__processed_glb/kaykit/adventurers/characters/Knight.glb',
    animUrl: '/__processed_glb/quaternius/ual1-standard/animations/UAL1_Standard.glb',
    clipName: 'Jog_Fwd_Loop',
    retargetFrom: 'quaternius-universal-65',
    retargetNames: UAL_TO_KAYKIT,
    retargetHip: 'hips',
    useRestOffsets: true,
    rotationTracksOnly: true,
    sampleTime: 0.35,
  },
];

async function main() {
  const srv = await startServer();
  const port = srv.address().port;
  const userDataDir = fs.mkdtempSync('/tmp/cdp-humanoid-qa-');
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
    '--window-size=768,768',
    `http://127.0.0.1:${port}/catalog/humanoids/tools/validate_multisource.html`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let wsUrl = null;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Chrome DevTools WS')), 15000);
    const onData = (chunk) => {
      const m = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        wsUrl = m[1];
        resolve();
      }
    };
    chrome.stderr.on('data', onData);
    chrome.stdout.on('data', onData);
  });

  const browserPort = new URL(wsUrl).port;
  let pageTarget;
  for (let i = 0; i < 40; i++) {
    const targets = await (await fetch(`http://127.0.0.1:${browserPort}/json/list`)).json();
    pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('validate_multisource.html'));
    if (pageTarget) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!pageTarget) throw new Error('Target page not found');

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const runtimeErrors = [];
  cdp.ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') runtimeErrors.push(m.params);
    if (m.method === 'Log.entryAdded' && m.params?.entry?.level === 'error') runtimeErrors.push(m.params.entry);
  });

  for (let i = 0; i < 50; i++) {
    const r = await cdp.send('Runtime.evaluate', { expression: 'Boolean(window.__validatorReady)', returnByValue: true });
    if (r?.result?.value) break;
    await new Promise((r2) => setTimeout(r2, 100));
  }

  const results = [];
  for (const cfg of CASES) {
    const expr = `window.__runCase(${JSON.stringify(cfg)})`;
    const evalRes = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (evalRes.exceptionDetails) {
      throw new Error(`Case ${cfg.id} threw: ${JSON.stringify(evalRes.exceptionDetails)}`);
    }
    const v = evalRes.result.value;
    const posBuf = Buffer.from(v.pngPos.replace(/^data:image\/png;base64,/, ''), 'base64');
    const negBuf = Buffer.from(v.pngNeg.replace(/^data:image\/png;base64,/, ''), 'base64');
    const posFile = `${cfg.id}_posZ.png`;
    const negFile = `${cfg.id}_negZ.png`;
    fs.writeFileSync(path.join(QA_OUT, posFile), posBuf);
    fs.writeFileSync(path.join(QA_OUT, negFile), negBuf);
    delete v.pngPos;
    delete v.pngNeg;
    v.pngFiles = [posFile, negFile];
    results.push(v);
    console.log(`[PASS] ${cfg.id} tris=${v.stats.triangles} bones=${v.stats.boneCount} covZ=(${v.coveragePositiveZ.ratio}, ${v.coverageNegativeZ.ratio}) clip=${v.activeClipName}`);
  }

  const disposalRes = await cdp.send('Runtime.evaluate', {
    expression: `window.__runDisposalCycle('/__processed_glb/quaternius/universal-base-characters-standard/characters/Superhero_Female_FullBody.glb', 5)`,
    awaitPromise: true,
    returnByValue: true,
  });
  const disposalSnapshots = disposalRes.result.value;
  console.log('5-cycle disposal memory:', JSON.stringify(disposalSnapshots));

  const report = {
    generatedUtc: new Date().toISOString(),
    totalCases: results.length,
    runtimeErrors,
    disposalSnapshots,
    results,
  };
  fs.writeFileSync(path.join(QA_OUT, 'VALIDATION_REPORT.json'), JSON.stringify(report, null, 2));

  cdp.close();
  await new Promise((res) => {
    chrome.once('exit', res);
    chrome.kill('SIGTERM');
    setTimeout(res, 2000);
  });
  srv.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {}

  const failedCov = results.filter((r) => r.coveragePositiveZ.ratio < 0.02 || r.coverageNegativeZ.ratio < 0.02);
  const firstAfter = disposalSnapshots[0].after;
  const lastAfter = disposalSnapshots[disposalSnapshots.length - 1].after;
  const leakDeltaGeo = lastAfter.geometries - firstAfter.geometries;
  const leakDeltaTex = lastAfter.textures - firstAfter.textures;
  if (runtimeErrors.length > 0 || failedCov.length > 0 || leakDeltaGeo > 0 || leakDeltaTex > 0) {
    console.error('Validation failed!', { runtimeErrors: runtimeErrors.length, failedCov: failedCov.map((x) => x.id), leakDeltaGeo, leakDeltaTex });
    process.exit(1);
  }
  console.log(`ALL ${results.length} CASES PASSED | leaksDelta: geo=${leakDeltaGeo} tex=${leakDeltaTex} | finalBaseline: geo=${lastAfter.geometries} tex=${lastAfter.textures}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
