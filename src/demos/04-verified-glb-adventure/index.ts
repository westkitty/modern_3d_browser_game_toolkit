import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { el } from "../../shared/dom";
import { createFrameLoop } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoHandle, DemoModule } from "../../shared/types";
import { loadAdventure, writeAdventure } from "./save";
import {
  parseManifest,
  validateAssets,
  type AssetManifest,
  type ManifestAsset
} from "./validate";

export const mount: DemoModule["mount"] = async (host, context) => {
  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const log = el("pre", { className: "panel-log", text: "Validating manifest…" });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "Verified GLB adventure" }),
      el("p", { text: "Runtime binds only to manifest facts emitted from generated files." }),
      log
    ]
  });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  const fail = (message: string): DemoHandle => {
    log.textContent = message;
    context.setStatus({ state: "error", detail: message });
    return {
      dispose() {
        host.replaceChildren();
      }
    };
  };

  let manifestJson: unknown;
  try {
    const response = await fetch("/assets/demos/04-verified-glb-adventure/manifest.json");
    if (!response.ok) return fail("Manifest fetch failed.");
    manifestJson = await response.json();
  } catch {
    return fail("Manifest was missing or unreadable.");
  }

  let manifest: AssetManifest;
  try {
    manifest = parseManifest(manifestJson);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Bad manifest.");
  }

  const result = await validateAssets(manifest, async (uri) => {
    const response = await fetch(`/${uri}`);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  });

  if (!result.ok) {
    return fail(result.issues.map((issue) => `${issue.id}: ${issue.message}`).join("\n"));
  }

  const { save, notice } = await loadAdventure();
  log.textContent = `${notice}\nValidated ${Object.keys(result.facts).length} assets.`;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "WebGL unavailable.");
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  camera.position.set(6, 5, 8);
  camera.lookAt(0, 0.5, 0);
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.1));

  const loader = new GLTFLoader();
  const mixers: THREE.AnimationMixer[] = [];
  const resources: Array<{ dispose(): void }> = [];

  const loadVerified = async (asset: ManifestAsset): Promise<THREE.Group> => {
    const gltf = await loader.loadAsync(`/${asset.uri}`);
    const names = gltf.animations.map((clip) => clip.name);
    for (const clip of asset.animations) {
      if (!names.includes(clip)) throw new Error(`Verified clip ${clip} missing at runtime.`);
    }
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const clipName = asset.animations[0];
      const clip = gltf.animations.find((item) => item.name === clipName);
      if (clip) mixer.clipAction(clip).play();
      mixers.push(mixer);
    }
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) resources.push(mesh.geometry);
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => resources.push(item));
      else if (material) resources.push(material);
    });
    scene.add(gltf.scene);
    return gltf.scene;
  };

  const player = await loadVerified(result.facts.player!);
  const environment = await loadVerified(result.facts.environment!);
  const prop = await loadVerified(result.facts.prop!);
  const npc = await loadVerified(result.facts.npc!);
  environment.position.set(0, -0.2, 0);
  player.position.set(save.x, 0.7, save.z);
  prop.position.set(2.2, 0.5, -1.4);
  npc.position.set(-2.4, 0.7, -1.2);
  if (save.collected) prop.visible = false;

  const keys = new Set<string>();
  const onDown = (event: KeyboardEvent): void => {
    keys.add(event.code);
  };
  const onUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const loop = createFrameLoop((dt) => {
    const x = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    const z = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
    player.position.x += x * 2.2 * dt;
    player.position.z += z * 2.2 * dt;
    if (!save.collected && player.position.distanceTo(prop.position) < 1.1) {
      save.collected = true;
      prop.visible = false;
      log.textContent += "\nCrystal collected.";
    }
    if (!save.spoken && player.position.distanceTo(npc.position) < 1.4) {
      save.spoken = true;
      log.textContent += `\nNPC clip playing: ${result.facts.npc?.animations[0]}`;
    }
    for (const mixer of mixers) mixer.update(dt);
    renderer.render(scene, camera);
  });
  loop.start();
  context.setStatus({ state: "ready", detail: "Assets validated from generated manifest." });

  const persistTimer = window.setInterval(() => {
    save.x = player.position.x;
    save.z = player.position.z;
    void writeAdventure(save);
  }, 800);

  return {
    dispose() {
      window.clearInterval(persistTimer);
      loop.stop();
      resize.disconnect();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      renderer.dispose();
      renderer.domElement.remove();
      for (const resource of resources) resource.dispose();
      scene.clear();
      host.replaceChildren();
    }
  };
};
