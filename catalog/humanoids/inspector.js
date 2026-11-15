import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  fetchHumanoidCatalog,
  filterClipToRoot,
  disposeHumanoidAsset,
} from './lib/humanoid-library.js';

const els = {
  countBadge: document.getElementById('count-badge'),
  search: document.getElementById('search-input'),
  sourceFilter: document.getElementById('filter-source'),
  typeFilter: document.getElementById('filter-type'),
  skeletonFilter: document.getElementById('filter-skeleton'),
  qaFilter: document.getElementById('filter-qa'),
  list: document.getElementById('catalog-list'),
  fileInput: document.getElementById('glb-file-input'),
  clipSelect: document.getElementById('clip-select'),
  playPause: document.getElementById('btn-play-pause'),
  toggleSkel: document.getElementById('btn-skeleton'),
  resetCam: document.getElementById('btn-reset-cam'),
  disposeBtn: document.getElementById('btn-dispose'),
  canvas: document.getElementById('viewport'),
  localMetrics: document.getElementById('local-glb-metrics'),
  catalogDetail: document.getElementById('catalog-detail'),
  compatDetail: document.getElementById('compat-detail'),
  dropBanner: document.getElementById('drop-banner'),
};

let api = null;
let selectedId = null;

// --- Three.js Viewport Setup ---
const renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1016);
scene.add(new THREE.HemisphereLight(0xf6f8ff, 0x262e3d, 1.35));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xaad0ff, 0.7);
rimLight.position.set(-3, 2.5, -3.5);
scene.add(rimLight);
const grid = new THREE.GridHelper(8, 16, 0x3b485e, 0x222a38);
scene.add(grid);

const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 150);
camera.position.set(1.6, 1.5, 2.8);
const controls = new OrbitControls(camera, els.canvas);
controls.target.set(0, 0.9, 0);
controls.update();

let loadedGroup = null;
let skeletonHelper = null;
let showSkeleton = false;
let mixer = null;
let currentClips = [];
let playing = true;
const clock = new THREE.Clock();

function resizeViewport() {
  const rect = els.canvas.parentElement.getBoundingClientRect();
  const w = Math.max(200, Math.floor(rect.width));
  const h = Math.max(200, Math.floor(rect.height - 46));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeViewport);
resizeViewport();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (mixer && playing) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();

function frameObject(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const radius = Math.max(size.length() * 0.85, 1.2);
  controls.target.copy(center);
  camera.position.set(center.x + radius * 0.65, center.y + size.y * 0.25, center.z + radius * 1.15);
  controls.update();
}

function disposeCurrentModel() {
  if (mixer) {
    mixer.stopAllAction();
    mixer = null;
  }
  if (skeletonHelper) {
    scene.remove(skeletonHelper);
    skeletonHelper.dispose();
    skeletonHelper = null;
  }
  if (loadedGroup) {
    scene.remove(loadedGroup);
    disposeHumanoidAsset(loadedGroup);
    loadedGroup = null;
  }
  currentClips = [];
  els.clipSelect.innerHTML = '<option value="">No Clips Loaded</option>';
  els.clipSelect.disabled = true;
  els.playPause.disabled = true;
  renderer.renderLists.dispose();
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setKV(container, rows) {
  container.innerHTML = rows
    .map(([k, v]) => `<span class="k">${escHtml(k)}</span><span class="v">${escHtml(v ?? '—')}</span>`)
    .join('');
}

async function inspectLocalBuffer(arrayBuffer, filename) {
  disposeCurrentModel();
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(arrayBuffer, '');
  loadedGroup = gltf.scene;
  scene.add(loadedGroup);

  let meshCount = 0;
  let triCount = 0;
  const boneNames = [];
  loadedGroup.traverse((o) => {
    if (o.isMesh && o.geometry) {
      meshCount++;
      const g = o.geometry;
      const idx = g.index ? g.index.count : g.attributes.position?.count || 0;
      triCount += Math.floor(idx / 3);
    }
    if (o.isBone) boneNames.push(o.name);
  });

  const box = new THREE.Box3().setFromObject(loadedGroup);
  const size = new THREE.Vector3();
  box.getSize(size);

  currentClips = gltf.animations || [];
  if (currentClips.length > 0) {
    els.clipSelect.innerHTML = currentClips
      .map((c, i) => `<option value="${i}">${c.name || `Clip_${i}`} (${c.duration.toFixed(2)}s)</option>`)
      .join('');
    els.clipSelect.disabled = false;
    els.playPause.disabled = false;
    playClipIndex(0);
  }

  skeletonHelper = new THREE.SkeletonHelper(loadedGroup);
  skeletonHelper.visible = showSkeleton;
  scene.add(skeletonHelper);

  frameObject(loadedGroup);
  els.dropBanner.textContent = `Inspecting local file: ${filename} (${currentClips.length} clips, WebGL2=${renderer.capabilities.isWebGL2})`;
  setKV(els.localMetrics, [
    ['Filename', filename],
    ['Meshes / Tris', `${meshCount} / ${triCount.toLocaleString()}`],
    ['Bones', boneNames.length],
    ['Dimensions (m)', size.toArray().map((n) => n.toFixed(3)).join(' × ')],
    ['Clips', currentClips.length],
    ['GPU Mem', `geo=${renderer.info.memory.geometries}, tex=${renderer.info.memory.textures}`],
  ]);
}

function playClipIndex(idx) {
  if (!loadedGroup || !currentClips[idx]) return;
  if (mixer) mixer.stopAllAction();
  const { clip } = filterClipToRoot(THREE, currentClips[idx], loadedGroup);
  mixer = new THREE.AnimationMixer(loadedGroup);
  mixer.clipAction(clip).play();
  playing = true;
  els.playPause.textContent = 'Pause';
}

els.clipSelect.addEventListener('change', (e) => playClipIndex(Number(e.target.value)));
els.playPause.addEventListener('click', () => {
  playing = !playing;
  els.playPause.textContent = playing ? 'Pause' : 'Play';
});
els.toggleSkel.addEventListener('click', () => {
  showSkeleton = !showSkeleton;
  if (skeletonHelper) skeletonHelper.visible = showSkeleton;
  els.toggleSkel.textContent = `Skeleton: ${showSkeleton ? 'On' : 'Off'}`;
});
els.resetCam.addEventListener('click', () => {
  if (loadedGroup) frameObject(loadedGroup);
  else {
    camera.position.set(1.6, 1.5, 2.8);
    controls.target.set(0, 0.9, 0);
    controls.update();
  }
});
els.disposeBtn.addEventListener('click', () => {
  disposeCurrentModel();
  setKV(els.localMetrics, [
    ['Status', 'Disposed'],
    ['GPU Mem', `geo=${renderer.info.memory.geometries}, tex=${renderer.info.memory.textures}`],
  ]);
});

els.fileInput.addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  await inspectLocalBuffer(buf, f.name);
});

els.canvas.addEventListener('dragover', (e) => e.preventDefault());
els.canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  const buf = await f.arrayBuffer();
  await inspectLocalBuffer(buf, f.name);
});

// --- Catalog Browser Setup ---
function renderList() {
  if (!api) return;
  const results = api.search({
    query: els.search.value,
    sourceId: els.sourceFilter.value || undefined,
    assetType: els.typeFilter.value || undefined,
    skeletonFamily: els.skeletonFilter.value || undefined,
    qaStatus: els.qaFilter.value || undefined,
  });
  els.countBadge.textContent = String(results.length);
  els.list.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const r of results.slice(0, 250)) {
    const div = document.createElement('div');
    div.className = `item${r.asset_id === selectedId ? ' active' : ''}`;
    div.innerHTML = `
      <div class="item-title">${r.display_name}</div>
      <div class="item-sub">
        <span class="pill">${r.source_id}</span>
        <span class="pill">${r.asset_type}</span>
        ${r.skeleton_family ? `<span class="pill">${r.skeleton_family}</span>` : ''}
        <span class="pill ${r.qa_status === 'BROWSER_SMOKE_PASSED' ? 'ok' : 'warn'}">${r.qa_status}</span>
      </div>
    `;
    div.addEventListener('click', () => selectAsset(r.asset_id));
    frag.appendChild(div);
  }
  if (results.length > 250) {
    const more = document.createElement('div');
    more.style.cssText = 'color: var(--muted); padding: 8px; text-align: center; font-size: 11px;';
    more.textContent = `Showing first 250 of ${results.length} matches. Narrow filters to inspect further.`;
    frag.appendChild(more);
  }
  els.list.appendChild(frag);
}

function selectAsset(assetId) {
  selectedId = assetId;
  renderList();
  const rec = api.getById(assetId);
  if (!rec) return;
  setKV(els.catalogDetail, [
    ['Asset ID', rec.asset_id],
    ['Source Pack', rec.source?.name || rec.source_id],
    ['License', rec.license_id],
    ['Skeleton Family', rec.skeleton_family || 'unrigged'],
    ['Joints', rec.joint_count ?? '—'],
    ['Triangles', rec.triangle_count ?? '—'],
    ['Dimensions (m)', rec.dimensions_m ? rec.dimensions_m.join(' × ') : 'see asset GLB'],
    ['Animations', rec.animation_count],
    ['QA Status', rec.qa_status],
    ['Visual Approval', rec.visual_approval],
    ['GLB File', rec.processed_glb_basename],
    ['GLB SHA-256', rec.processed_glb_sha256?.slice(0, 20) + '...'],
    ['Private Path', rec.private_locator],
  ]);

  const compatAnims = rec.skeleton_family ? api.getCompatibleAnimations(rec) : [];
  const ualCompat = rec.skeleton_family ? api.getCompatibility('quaternius-universal-65', rec) : null;
  const kkCompat = rec.skeleton_family ? api.getCompatibility('kaykit-rig-medium', rec) : null;
  const restoreCmd = `rclone copy --drive-root-folder-id <GPT_FOLDER_ID> "gdrive:${rec.private_locator}" ./local_glbs/`;

  els.compatDetail.innerHTML = `
    <div><strong>Direct Animation Packs (${compatAnims.length}):</strong> ${compatAnims.slice(0, 6).map((a) => a.processed_glb_basename).join(', ') || 'None / embedded clips only'}</div>
    <div style="margin-top:6px;"><strong>From Universal-65:</strong> ${ualCompat ? `${ualCompat.status} (compatible=${ualCompat.compatible})` : 'n/a'}</div>
    <div><strong>From KayKit Rig_Medium:</strong> ${kkCompat ? `${kkCompat.status} (compatible=${kkCompat.compatible})` : 'n/a'}</div>
    <p class="section-title" style="margin-top:10px;">Private Retrieval Procedure</p>
    <code class="blk">${restoreCmd}</code>
  `;
}

async function init() {
  try {
    api = await fetchHumanoidCatalog('.');
    const records = api.search();
    const sources = [...new Set(records.map((r) => r.source_id))].sort();
    const types = [...new Set(records.map((r) => r.asset_type))].sort();
    const skeletons = [...new Set(records.map((r) => r.skeleton_family).filter(Boolean))].sort();
    const qas = [...new Set(records.map((r) => r.qa_status))].sort();

    for (const s of sources) els.sourceFilter.add(new Option(s, s));
    for (const t of types) els.typeFilter.add(new Option(t, t));
    for (const sk of skeletons) els.skeletonFilter.add(new Option(sk, sk));
    for (const q of qas) els.qaFilter.add(new Option(q, q));

    [els.search, els.sourceFilter, els.typeFilter, els.skeletonFilter, els.qaFilter].forEach((el) => {
      el.addEventListener('input', renderList);
      el.addEventListener('change', renderList);
    });

    renderList();
    if (records.length > 0) selectAsset(records[0].asset_id);
    window.__inspectorReady = true;
  } catch (err) {
    setKV(els.catalogDetail, [['Load Error', err.message]]);
  }
}

init();
