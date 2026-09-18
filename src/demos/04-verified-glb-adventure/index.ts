import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { createResourceScope, resourceSnapshot, type ResourceScope } from "../../shared/resources";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoHandle, DemoModule } from "../../shared/types";
import {
  ADVENTURE_SAVE_VERSION,
  clearAdventureSave,
  defaultAdventureSave,
  loadAdventure,
  writeAdventure,
  type AdventureSave
} from "./save";
import { ZoneStreamer, type StreamZone } from "./streaming";
import { parseManifest, validateAssets, type AssetManifest, type ManifestAsset } from "./validate";

interface OwnedAsset {
  group: THREE.Group;
  scope: ResourceScope;
  fallbackReason: string | null;
}

function ownSceneResources(group: THREE.Object3D, scope: ResourceScope): void {
  const seenGeometry = new Set<THREE.BufferGeometry>();
  const seenMaterial = new Set<THREE.Material>();
  const seenTexture = new Set<THREE.Texture>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry && !seenGeometry.has(mesh.geometry)) {
      seenGeometry.add(mesh.geometry);
      scope.own("geometry", () => mesh.geometry.dispose());
    }
    const list = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of list) {
      if (!seenMaterial.has(material)) {
        seenMaterial.add(material);
        scope.own("material", () => material.dispose());
      }
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && !seenTexture.has(value)) {
          seenTexture.add(value);
          scope.own("texture", () => value.dispose());
        }
      }
    }
  });
}

export const mount: DemoModule["mount"] = async (host, context) => {
  const scope = createResourceScope();
  scope.own("runtime");
  scope.own("scene");

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const log = el("pre", { className: "panel-log", text: "Validating manifest…" });
  const saveStatus = el("p", { className: "panel-log", attrs: { "aria-live": "polite" } });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "Verified GLB adventure" }),
      el("p", { text: "Manifest authority + versioned persistence + bounded local zone streaming." }),
      log,
      saveStatus
    ]
  });
  const saveButton = el("button", { text: "Save", attrs: { type: "button" } });
  const loadButton = el("button", { text: "Load", attrs: { type: "button" } });
  const clearButton = el("button", { text: "Clear save", attrs: { type: "button" } });
  panel.append(saveButton, loadButton, clearButton);
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  const fail = (message: string): DemoHandle => {
    log.textContent = message;
    context.setStatus({ state: "error", detail: message });
    scope.dispose();
    return { dispose() { host.replaceChildren(); } };
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
  if (!result.ok) return fail(result.issues.map((issue) => `${issue.id}: ${issue.message}`).join("\n"));

  let { save, notice } = await loadAdventure();
  saveStatus.textContent = notice;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "WebGL unavailable.");
  }

  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.1));
  const loader = new GLTFLoader();
  const mixers: THREE.AnimationMixer[] = [];

  const loadOwnedAsset = async (asset: ManifestAsset, streamed = false): Promise<OwnedAsset> => {
    const assetScope = createResourceScope();
    if (streamed) assetScope.own("streamedZone");
    try {
      const gltf = await loader.loadAsync(`/${asset.uri}`);
      const names = gltf.animations.map((clip) => clip.name);
      for (const clip of asset.animations) {
        if (!names.includes(clip)) throw new Error(`Verified clip ${clip} missing at runtime.`);
      }
      if (!streamed && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        const clip = gltf.animations.find((item) => item.name === asset.animations[0]);
        if (clip) mixer.clipAction(clip).play();
        mixers.push(mixer);
      }
      ownSceneResources(gltf.scene, assetScope);
      return { group: gltf.scene, scope: assetScope, fallbackReason: null };
    } catch (error) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff6b6b, wireframe: true });
      assetScope.own("geometry", () => geometry.dispose());
      assetScope.own("material", () => material.dispose());
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geometry, material));
      return {
        group,
        scope: assetScope,
        fallbackReason: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const playerAsset = await loadOwnedAsset(result.facts.player!);
  const npcAsset = await loadOwnedAsset(result.facts.npc!);
  const player = playerAsset.group;
  const npc = npcAsset.group;
  scene.add(player, npc);
  player.position.set(save.player.x, 0.7, save.player.z);
  player.rotation.y = save.player.yaw;
  npc.position.set(-2.4, 0.7, -1.2);

  const zones: Array<StreamZone & { assetId: "environment" | "prop" }> = [
    { id: "central-environment", assetId: "environment", x: 0, z: 0, loadRadius: 7, retainRadius: 10 },
    { id: "east-crystal", assetId: "prop", x: 7, z: -1.4, loadRadius: 4.5, retainRadius: 7 }
  ];

  const zoneFallbacks = new Map<string, string>();
  const streamer = new ZoneStreamer<OwnedAsset>({
    zones,
    concurrency: 1,
    load: async (zone) => {
      const definition = zones.find((item) => item.id === zone.id)!;
      const owned = await loadOwnedAsset(result.facts[definition.assetId]!, true);
      owned.group.position.set(definition.x, definition.assetId === "environment" ? -0.2 : 0.5, definition.z);
      return owned;
    },
    activate: (zone, owned) => {
      scene.add(owned.group);
      if (owned.fallbackReason) zoneFallbacks.set(zone.id, owned.fallbackReason);
      else zoneFallbacks.delete(zone.id);
      if (!save.activatedZones.includes(zone.id)) save.activatedZones.push(zone.id);
    },
    deactivate: (zone, owned) => {
      zoneFallbacks.delete(zone.id);
      scene.remove(owned.group);
    },
    dispose: (_zone, owned) => {
      scene.remove(owned.group);
      owned.scope.dispose();
    }
  });

  const keys = new Set<string>();
  const clearInput = (): void => keys.clear();
  scope.listen(window, "keydown", ((event: Event) => {
    keys.add((event as KeyboardEvent).code);
  }) as EventListener);
  scope.listen(window, "keyup", ((event: Event) => {
    keys.delete((event as KeyboardEvent).code);
  }) as EventListener);
  scope.listen(window, "blur", clearInput);
  scope.listen(document, "visibilitychange", () => { if (document.hidden) clearInput(); });

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const applySave = (next: AdventureSave): void => {
    save = next;
    player.position.set(save.player.x, 0.7, save.player.z);
    player.rotation.y = save.player.yaw;
    streamer.update(player.position.x, player.position.z);
  };
  const snapshotSave = (): AdventureSave => ({
    ...save,
    schemaVersion: ADVENTURE_SAVE_VERSION,
    player: {
      x: player.position.x,
      z: player.position.z,
      yaw: player.rotation.y,
      pitch: 0
    },
    activatedZones: [...save.activatedZones]
  });

  const doSave = async (): Promise<void> => {
    try {
      save = snapshotSave();
      await writeAdventure(save);
      saveStatus.textContent = `Saved schema v${ADVENTURE_SAVE_VERSION}.`;
    } catch (error) {
      saveStatus.textContent = `Save failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  };
  const doLoad = async (): Promise<void> => {
    const loaded = await loadAdventure();
    applySave(loaded.save);
    saveStatus.textContent = loaded.notice;
  };
  const doClear = async (): Promise<void> => {
    try {
      await clearAdventureSave();
      applySave(defaultAdventureSave());
      saveStatus.textContent = "Save cleared. Defaults restored.";
    } catch (error) {
      saveStatus.textContent = `Clear failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  scope.listen(saveButton, "click", () => { void doSave(); });
  scope.listen(loadButton, "click", () => { void doLoad(); });
  scope.listen(clearButton, "click", () => { void doClear(); });

  let velocityX = 0;
  let velocityZ = 0;
  const loop = createFixedStepLoop({
    stepSeconds: 1 / 60,
    maxSteps: 5,
    simulate: (dt) => {
      const x = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
      const z = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
      const targetX = x * 2.8;
      const targetZ = z * 2.8;
      const amount = 12 * dt;
      velocityX += Math.max(-amount, Math.min(amount, targetX - velocityX));
      velocityZ += Math.max(-amount, Math.min(amount, targetZ - velocityZ));
      player.position.x += velocityX * dt;
      player.position.z += velocityZ * dt;
      if (Math.hypot(velocityX, velocityZ) > 0.1) player.rotation.y = Math.atan2(velocityX, velocityZ);
      streamer.update(player.position.x, player.position.z);
      if (!save.spoken && player.position.distanceTo(npc.position) < 1.4) save.spoken = true;
      for (const mixer of mixers) mixer.update(dt);
    },
    render: () => {
      const behind = new THREE.Vector3(0, 3.5, 6).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
      camera.position.copy(player.position).add(behind);
      camera.lookAt(player.position.x, player.position.y + 0.8, player.position.z);
      renderer.render(scene, camera);
      const states = streamer.snapshot();
      const owned = resourceSnapshot();
      const fallbacks = states
        .map((state) => {
          const definition = zones.find((zone) => zone.id === state.id);
          return `${definition?.id ?? state.id}=${state.state}${state.error ? `(${state.error})` : ""}`;
        })
        .join(", ");
      const fallbackText = zoneFallbacks.size
        ? ` fallback ${[...zoneFallbacks.entries()].map(([id, reason]) => `${id}: ${reason}`).join(" | ")}`
        : "";
      log.textContent =
        `save v${ADVENTURE_SAVE_VERSION} · seed ${save.seed}\n` +
        `zones ${fallbacks}${fallbackText}\n` +
        `owned runtime ${owned.runtime} scenes ${owned.scene} geo ${owned.geometry} mat ${owned.material} tex ${owned.texture} listeners ${owned.listener} streamed ${owned.streamedZone}\n` +
        `renderer calls ${renderer.info.render.calls} triangles ${renderer.info.render.triangles} memory geo ${renderer.info.memory.geometries} tex ${renderer.info.memory.textures}\n` +
        "Streaming policy: load -> own -> activate -> deactivate -> dispose.";
    }
  });

  streamer.update(player.position.x, player.position.z);
  loop.start();
  context.setStatus({ state: "ready", detail: "Verified assets, schema-v3 save/load and bounded local zone streaming." });

  return {
    dispose() {
      loop.stop();
      resize.disconnect();
      streamer.dispose();
      playerAsset.scope.dispose();
      npcAsset.scope.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      scope.dispose();
      host.replaceChildren();
    }
  };
};
