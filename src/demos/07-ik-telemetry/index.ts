import * as THREE from "three";
import { el } from "../../shared/dom";
import { createFrameLoop } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { twoBoneIk } from "./ik";
import { createPlate, writePlate } from "./telemetry";

const RIG = {
  bones: ["Root", "Femur", "Tibia"],
  lengths: { Femur: 1.1, Tibia: 1.0 }
};

export const mount: DemoModule["mount"] = (host, context) => {
  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const live = el("pre", { className: "panel-log", text: "IK lab" });
  const poses = ["reachable", "unreachable", "folded", "near-zero", "mirrored"] as const;
  let poseIndex = 0;
  const panel = el("aside", { className: "demo-panel", children: [el("h2", { text: "IK telemetry" }), live] });
  for (const pose of poses) {
    const button = el("button", { text: pose, attrs: { type: "button" } });
    button.addEventListener("click", () => {
      poseIndex = poses.indexOf(pose);
    });
    panel.append(button);
  }
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  const expected = RIG.bones;
  if (expected.join(",") !== "Root,Femur,Tibia") {
    context.setStatus({ state: "error", detail: "Rig contract mismatch." });
    return { dispose() { host.replaceChildren(); } };
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    context.setStatus({ state: "unsupported", detail });
    live.textContent = detail;
    return { dispose() { host.replaceChildren(); } };
  }
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151d);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
  camera.position.set(3, 2, 6);
  camera.lookAt(0, 0.5, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));

  const boneGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 8);
  const boneMat = new THREE.MeshStandardMaterial({ color: 0x86efac });
  const femur = new THREE.Mesh(boneGeo, boneMat);
  const tibia = new THREE.Mesh(boneGeo, boneMat);
  scene.add(femur, tibia);

  const plate = createPlate();
  const texture = new THREE.CanvasTexture(plate.canvas);
  texture.needsUpdate = true;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: texture }));
  sign.position.set(1.6, 1.4, 0);
  scene.add(sign);

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const targets: Record<(typeof poses)[number], { x: number; y: number; sign: number }> = {
    reachable: { x: 1.2, y: 0.2, sign: 1 },
    unreachable: { x: 4, y: 2, sign: 1 },
    folded: { x: 0.15, y: 0.05, sign: 1 },
    "near-zero": { x: 0.01, y: 0, sign: 1 },
    mirrored: { x: 1.2, y: 0.2, sign: -1 }
  };

  const loop = createFrameLoop(() => {
    const pose = poses[poseIndex] ?? "reachable";
    const target = targets[pose];
    const ik = twoBoneIk({ x: 0, y: 1.6 }, target, RIG.lengths.Femur, RIG.lengths.Tibia, target.sign);
    femur.position.set((ik.a.x + ik.b.x) / 2, (ik.a.y + ik.b.y) / 2, 0);
    tibia.position.set((ik.b.x + ik.end.x) / 2, (ik.b.y + ik.end.y) / 2, 0);
    const text = `${pose} reach:${ik.reachable ? "yes" : "no"} A:${ik.angleA.toFixed(2)} B:${ik.angleB.toFixed(2)}`;
    if (writePlate(plate, text)) texture.needsUpdate = true;
    live.textContent = text;
    renderer.render(scene, camera);
  });
  loop.start();
  context.setStatus({ state: "ready", detail: "IK + CanvasTexture. Uploads only on change." });

  return {
    dispose() {
      loop.stop();
      resize.disconnect();
      texture.dispose();
      boneGeo.dispose();
      boneMat.dispose();
      (sign.material as THREE.Material).dispose();
      (sign.geometry as THREE.BufferGeometry).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      host.replaceChildren();
    }
  };
};
