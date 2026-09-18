import * as THREE from "three";
import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { createResourceScope, resourceSnapshot } from "../../shared/resources";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { hashPairs, spawnAgents, type Agent } from "./broadphase";
import {
  PERFORMANCE_SCENARIOS,
  SampleWindow,
  kinematicCollisionWork,
  streamedZoneChurn,
  type PerformanceScenario
} from "./performance";

export const mount: DemoModule["mount"] = (host, context) => {
  const scope = createResourceScope();
  scope.own("runtime");
  scope.own("scene");

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const live = el("pre", { className: "panel-log" });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "Performance reference lab" }),
      el("p", { text: "Comparative browser-observable measurements only. No device-independent FPS guarantee." }),
      live
    ]
  });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  let scenarioIndex = 0;
  let scenario: PerformanceScenario = PERFORMANCE_SCENARIOS[scenarioIndex]!;
  const scenarioButton = el("button", { text: "Next scenario", attrs: { type: "button" } });
  const resetButton = el("button", { text: "Reset samples", attrs: { type: "button" } });
  panel.append(scenarioButton, resetButton);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    context.setStatus({ state: "unsupported", detail });
    return { dispose() { scope.dispose(); host.replaceChildren(); } };
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
  scope.own("geometry", () => geo.dispose());
  scope.own("material", () => mat.dispose());

  const instanced = new THREE.InstancedMesh(geo, mat, 400);
  scene.add(instanced);
  const dummy = new THREE.Object3D();
  let agents: Agent[] = spawnAgents(160, "clustered");
  let frame = 0;
  let activeZones = 0;
  let contacts = 0;

  const frameSamples = new SampleWindow();
  const updateSamples = new SampleWindow();
  const renderSamples = new SampleWindow();
  const churnScopes: ReturnType<typeof createResourceScope>[] = [];

  const clearChurn = (): void => {
    while (churnScopes.length) churnScopes.pop()?.dispose();
  };

  const resetSamples = (): void => {
    frameSamples.clear();
    updateSamples.clear();
    renderSamples.clear();
  };

  const selectNext = (): void => {
    scenarioIndex = (scenarioIndex + 1) % PERFORMANCE_SCENARIOS.length;
    scenario = PERFORMANCE_SCENARIOS[scenarioIndex]!;
    frame = 0;
    activeZones = 0;
    contacts = 0;
    clearChurn();
    resetSamples();
  };

  scope.listen(scenarioButton, "click", selectNext);
  scope.listen(resetButton, "click", resetSamples);

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const loop = createFixedStepLoop({
    stepSeconds: 1 / 60,
    maxSteps: 5,
    simulate: (dt) => {
      const started = performance.now();
      frame += 1;

      if (scenario === "baseline") {
        activeZones = 0;
        contacts = 0;
      } else if (scenario === "movement") {
        contacts = kinematicCollisionWork(1200);
      } else if (scenario === "streaming") {
        activeZones = streamedZoneChurn(frame, 128);
      } else if (scenario === "resource-churn") {
        if (frame % 45 === 1) {
          clearChurn();
          for (let i = 0; i < 18; i += 1) {
            const churn = createResourceScope();
            const g = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const m = new THREE.MeshBasicMaterial();
            churn.own("geometry", () => g.dispose());
            churn.own("material", () => m.dispose());
            churnScopes.push(churn);
          }
        }
      } else if (scenario === "crowd") {
        for (const agent of agents) {
          agent.x += agent.vx * dt;
          agent.z += agent.vz * dt;
          if (Math.abs(agent.x) > 10) agent.vx *= -1;
          if (Math.abs(agent.z) > 10) agent.vz *= -1;
        }
        activeZones = hashPairs(agents, 2).candidates;
      }

      updateSamples.push(performance.now() - started);
    },
    render: (_alpha, frameSeconds) => {
      frameSamples.push(frameSeconds * 1000);

      instanced.visible = scenario === "crowd";
      if (instanced.visible) {
        agents.forEach((agent, index) => {
          dummy.position.set(agent.x, 0.35, agent.z);
          dummy.updateMatrix();
          instanced.setMatrixAt(index, dummy.matrix);
        });
        instanced.count = agents.length;
        instanced.instanceMatrix.needsUpdate = true;
      } else {
        instanced.count = 0;
      }

      const renderStart = performance.now();
      renderer.render(scene, camera);
      renderSamples.push(performance.now() - renderStart);

      const frameStats = frameSamples.summary();
      const updateStats = updateSamples.summary();
      const renderStats = renderSamples.summary();
      const owned = resourceSnapshot();
      const info = renderer.info;
      const detail =
        scenario === "movement" ? `contacts ${contacts}` :
        scenario === "streaming" ? `active synthetic zones ${activeZones}` :
        scenario === "resource-churn" ? `temporary ownership scopes ${churnScopes.length}` :
        scenario === "crowd" ? `crowd agents ${agents.length} · broadphase candidates ${activeZones}` :
        "idle scene";

      live.textContent =
        `scenario ${scenario} · samples ${frameStats.count}\n` +
        `${detail}\n` +
        `frame mean ${frameStats.mean.toFixed(2)}ms p95 ${frameStats.p95.toFixed(2)}ms max ${frameStats.max.toFixed(2)}ms\n` +
        `update mean ${updateStats.mean.toFixed(3)}ms · render-call mean ${renderStats.mean.toFixed(3)}ms\n` +
        `draw calls ${info.render.calls} · triangles ${info.render.triangles} · renderer memory geo ${info.memory.geometries} tex ${info.memory.textures}\n` +
        `owned runtime ${owned.runtime} scenes ${owned.scene} geo ${owned.geometry} mat ${owned.material} listeners ${owned.listener}\n` +
        "Raw comparative measurements only; no cross-device pass threshold.";
    }
  });

  loop.start();
  context.setStatus({ state: "ready", detail: "Five reproducible comparative performance scenarios." });

  return {
    dispose() {
      loop.stop();
      resize.disconnect();
      clearChurn();
      instanced.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      scope.dispose();
      host.replaceChildren();
    }
  };
};
