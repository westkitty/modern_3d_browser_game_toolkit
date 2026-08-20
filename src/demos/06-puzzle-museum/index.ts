import * as THREE from "three";
import { el } from "../../shared/dom";
import { createDemandRenderer } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { loadMuseum, ROOMS, STORAGE_KEY, type MuseumSave } from "./puzzles";

export const mount: DemoModule["mount"] = (host, context) => {
  let save: MuseumSave = loadMuseum(window.localStorage.getItem(STORAGE_KEY));
  if (context.reducedMotion) save.reducedMotion = true;
  let roomIndex = 0;

  const persist = (): void => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  };

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const live = el("p", { attrs: { role: "status", "aria-live": "polite" }, text: "Enter the first room." });
  const controls = el("div", { className: "tactics-actions" });
  const panel = el("aside", {
    className: "demo-panel",
    children: [el("h2", { text: "Puzzle museum" }), live, controls]
  });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let demand: ReturnType<typeof createDemandRenderer> | null = null;
  let resize: { disconnect(): void } | null = null;
  const disposables: Array<{ dispose(): void }> = [];
  let yaw = 0;

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
    renderer.setPixelRatio(cappedDevicePixelRatio(2));
    viewport.append(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141821);
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));
    const roomMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, side: THREE.BackSide })
    );
    disposables.push(roomMesh.geometry, roomMesh.material as THREE.Material);
    scene.add(roomMesh);
    for (let i = 0; i < 3; i += 1) {
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x7dd3fc })
      );
      ped.position.set(-1.4 + i * 1.4, -0.7, -1.2);
      disposables.push(ped.geometry, ped.material as THREE.Material);
      scene.add(ped);
    }
    demand = createDemandRenderer(() => {
      if (!renderer || !scene || !camera) return;
      camera.position.set(Math.sin(yaw) * 0.4, 0.2, 4);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    });
    resize = observeElementSize(viewport, (w, h) => {
      renderer?.setSize(w, h, false);
      if (camera) {
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      }
      demand?.request();
    });
  } catch (error) {
    viewport.replaceChildren(
      el("p", {
        text: error instanceof Error ? error.message : "3D gallery unavailable. Puzzles remain solvable in the panel."
      })
    );
  }

  const renderPanel = (): void => {
    const room = ROOMS[roomIndex];
    if (!room) return;
    live.textContent = `${room.title}. ${room.instruction} Completed rooms: ${save.completed.length}/3.`;
    controls.replaceChildren(
      el("p", { text: room.hint }),
      ...room.options.map((option) => {
        const button = el("button", { text: option, attrs: { type: "button" } });
        button.addEventListener("click", () => {
          if (option === room.answer) {
            if (!save.completed.includes(room.id)) save.completed.push(room.id);
            persist();
            context.announce(`${room.title} solved.`);
            roomIndex = Math.min(ROOMS.length - 1, roomIndex + 1);
          } else {
            context.announce("Incorrect. Try another option.");
          }
          renderPanel();
          demand?.request();
        });
        return button;
      }),
      el("button", { text: save.reducedMotion ? "Reduced motion on" : "Enable reduced motion", attrs: { type: "button" } })
    );
    const toggle = controls.querySelector("button:last-of-type");
    toggle?.addEventListener("click", () => {
      save.reducedMotion = !save.reducedMotion;
      persist();
      renderPanel();
    });
  };

  let orbit = 0;
  const idle = window.setInterval(() => {
    if (save.reducedMotion) return;
    yaw += 0.01;
    demand?.request();
    orbit += 1;
  }, 80);

  renderPanel();
  demand?.request();
  context.setStatus({ state: renderer ? "ready" : "unsupported", detail: "Accessible museum." });
  void orbit;

  return {
    dispose() {
      window.clearInterval(idle);
      demand?.dispose();
      resize?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
      for (const item of disposables) item.dispose();
      scene?.clear();
      host.replaceChildren();
    }
  };
};
