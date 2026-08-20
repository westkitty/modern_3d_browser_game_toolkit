import * as THREE from "three";
import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { hashPairs, naivePairs, spawnAgents, type Agent } from "./broadphase";

export const mount: DemoModule["mount"] = (host, context) => {
  let count = 80;
  let instancing = false;
  let broadphase = false;
  let mode: "uniform" | "clustered" = "uniform";
  let cell = 2;
  let agents: Agent[] = spawnAgents(count, mode);
  const metrics = { simMs: 0, candidates: 0, draws: 0, scenario: "baseline naive" };

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const chart = document.createElement("canvas");
  chart.width = 280;
  chart.height = 80;
  const chartCtx = chart.getContext("2d");
  const live = el("pre", { className: "panel-log" });
  const panel = el("aside", { className: "demo-panel", children: [el("h2", { text: "Crowd lab" }), live, chart] });
  const toggle = (label: string, onClick: () => void): void => {
    const button = el("button", { text: label, attrs: { type: "button" } });
    button.addEventListener("click", onClick);
    panel.append(button);
  };
  toggle("Toggle instancing", () => {
    instancing = !instancing;
  });
  toggle("Toggle broadphase", () => {
    broadphase = !broadphase;
  });
  toggle("Uniform / clustered", () => {
    mode = mode === "uniform" ? "clustered" : "uniform";
    agents = spawnAgents(count, mode);
  });
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
  scene.background = new THREE.Color(0x0e141c);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  camera.position.set(0, 22, 22);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));
  const geo = new THREE.BoxGeometry(0.35, 0.7, 0.35);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc });
  const instanced = new THREE.InstancedMesh(geo, mat, 400);
  const singles: THREE.Mesh[] = [];
  const dummy = new THREE.Object3D();
  scene.add(instanced);

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const loop = createFixedStepLoop({
    simulate: (dt) => {
      const t0 = performance.now();
      for (const agent of agents) {
        agent.x += agent.vx * dt;
        agent.z += agent.vz * dt;
        if (Math.abs(agent.x) > 10) agent.vx *= -1;
        if (Math.abs(agent.z) > 10) agent.vz *= -1;
      }
      metrics.candidates = broadphase ? hashPairs(agents, cell).candidates : naivePairs(agents);
      metrics.simMs = performance.now() - t0;
      metrics.scenario = `${mode} n=${agents.length} instancing=${instancing ? "on" : "off"} broadphase=${broadphase ? "on" : "off"} cell=${cell}`;
    },
    render: () => {
      instanced.visible = instancing;
      if (instancing) {
        for (const mesh of singles) mesh.visible = false;
        agents.forEach((agent, index) => {
          dummy.position.set(agent.x, 0.35, agent.z);
          dummy.updateMatrix();
          instanced.setMatrixAt(index, dummy.matrix);
        });
        instanced.count = agents.length;
        instanced.instanceMatrix.needsUpdate = true;
        metrics.draws = 1;
      } else {
        while (singles.length < agents.length) {
          const mesh = new THREE.Mesh(geo, mat);
          singles.push(mesh);
          scene.add(mesh);
        }
        singles.forEach((mesh, index) => {
          const agent = agents[index];
          mesh.visible = Boolean(agent);
          if (agent) mesh.position.set(agent.x, 0.35, agent.z);
        });
        metrics.draws = agents.length;
      }
      renderer.render(scene, camera);
      live.textContent = `${metrics.scenario}\nsim ${metrics.simMs.toFixed(2)}ms · candidates ${metrics.candidates} · draws ${metrics.draws}\nNo universal performance claim is made.`;
      if (chartCtx) {
        chartCtx.fillStyle = "#0b1220";
        chartCtx.fillRect(0, 0, chart.width, chart.height);
        chartCtx.fillStyle = "#7dd3fc";
        chartCtx.fillRect(8, 40 - Math.min(36, metrics.simMs * 4), 40, Math.min(36, metrics.simMs * 4));
        chartCtx.fillStyle = "#fbbf24";
        chartCtx.fillRect(70, 70 - Math.min(60, metrics.candidates / 80), 40, Math.min(60, metrics.candidates / 80));
      }
    }
  });
  loop.start();
  context.setStatus({ state: "ready", detail: "Instancing and broadphase start OFF." });

  return {
    dispose() {
      loop.stop();
      resize.disconnect();
      geo.dispose();
      mat.dispose();
      instanced.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      host.replaceChildren();
    }
  };
};
