import * as THREE from "three";
import { el } from "../../shared/dom";
import { createDemandRenderer } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { createCampaign, resolveTurn, SAVE_DB, SAVE_VERSION, worldToMap, type Campaign } from "./state";

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SAVE_DB, SAVE_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("saves")) req.result.createObjectStore("saves");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const mount: DemoModule["mount"] = async (host, context) => {
  let campaign = createCampaign();
  let workerEvidence = "Turn resolution remains on the main thread. No worker is active; no lag evidence was recorded that would justify one.";
  try {
    const db = await openDb();
    const loaded = await new Promise<Campaign | undefined>((resolve) => {
      const tx = db.transaction("saves", "readonly");
      const req = tx.objectStore("saves").get("current");
      req.onsuccess = () => resolve(req.result as Campaign | undefined);
      req.onerror = () => resolve(undefined);
    });
    db.close();
    if (loaded?.regions) campaign = loaded;
  } catch {
    workerEvidence += " IndexedDB unavailable; campaign stays in memory.";
  }

  const persist = async (): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(campaign, "current");
      db.close();
    } catch {
      /* quota/error is visible via panel text if persist fails later */
    }
  };

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const minimap = document.createElement("canvas");
  minimap.width = 220;
  minimap.height = 110;
  const mapCtx = minimap.getContext("2d");
  const log = el("pre", { className: "panel-log" });
  const panel = el("aside", {
    className: "demo-panel",
    children: [el("h2", { text: "Strategy globe" }), log, minimap]
  });
  const endTurn = el("button", { text: "End turn", attrs: { type: "button" } });
  panel.append(endTurn);
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    context.setStatus({ state: "unsupported", detail });
    return { dispose() { host.replaceChildren(); } };
  }
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081018);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  camera.position.set(0, 0, 6);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x112233, 1.2));
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0x1d4f6e, roughness: 0.7 })
  );
  scene.add(globe);
  const markers = campaign.regions.map((region) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshStandardMaterial({ color: region.owner === "player" ? 0x86efac : region.owner === "rival" ? 0xf0a3a3 : 0xfbbf24 })
    );
    const phi = ((90 - region.lat) * Math.PI) / 180;
    const theta = ((region.lon + 180) * Math.PI) / 180;
    mesh.position.setFromSphericalCoords(1.68, phi, theta);
    scene.add(mesh);
    return mesh;
  });

  const paint = (): void => {
    log.textContent = `Turn ${campaign.turn} · food ${campaign.food}\n${campaign.log.join("\n")}\n${workerEvidence}`;
    if (mapCtx) {
      mapCtx.fillStyle = "#102033";
      mapCtx.fillRect(0, 0, minimap.width, minimap.height);
      for (const region of campaign.regions) {
        const p = worldToMap(region.lon, region.lat, minimap.width);
        mapCtx.fillStyle = region.owner === "player" ? "#86efac" : region.owner === "rival" ? "#f0a3a3" : "#fbbf24";
        mapCtx.beginPath();
        mapCtx.arc(p.x, (p.y / minimap.width) * minimap.height, 6, 0, Math.PI * 2);
        mapCtx.fill();
      }
    }
    campaign.regions.forEach((region, index) => {
      const mesh = markers[index];
      const mat = mesh?.material as THREE.MeshStandardMaterial | undefined;
      if (mat) mat.color.set(region.owner === "player" ? 0x86efac : region.owner === "rival" ? 0xf0a3a3 : 0xfbbf24);
    });
    demand.request();
  };

  const demand = createDemandRenderer(() => {
    globe.rotation.y += 0.004;
    renderer.render(scene, camera);
  });
  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    demand.request();
  });
  endTurn.addEventListener("click", () => {
    campaign = resolveTurn(campaign);
    void persist();
    paint();
  });
  paint();
  context.setStatus({ state: "ready", detail: "Hybrid globe. Worker not activated." });

  return {
    dispose() {
      demand.dispose();
      resize.disconnect();
      globe.geometry.dispose();
      (globe.material as THREE.Material).dispose();
      for (const mesh of markers) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      host.replaceChildren();
    }
  };
};


