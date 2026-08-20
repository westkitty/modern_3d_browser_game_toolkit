import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { sampleGamepadAxes, scaledRadialDeadzone } from "../../shared/deadzone";
import type { DemoHandle, DemoModule } from "../../shared/types";
import { createCourse, stepCourse } from "./sim";
import { createCourseView } from "./view";

export const mount: DemoModule["mount"] = (host, context) => {
  const keys = new Set<string>();
  let jumpEdge = false;
  const state = createCourse();
  let audio: AudioContext | null = null;
  const unlockAudio = (): void => {
    if (audio) return;
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audio = new Ctor();
    void audio.resume();
  };

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport", attrs: { tabindex: "0" } });
  const status = el("p", { attrs: { id: "course-status" }, text: "WASD/arrows, space to jump, optional gamepad." });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "Fixed-step course" }),
      el("p", { text: "Simulation is 60 Hz with a 5-step catch-up cap. Visuals interpolate. Respawn snaps history." }),
      status
    ]
  });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  let view: ReturnType<typeof createCourseView> | null = null;
  try {
    view = createCourseView(viewport);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    viewport.replaceChildren(
      el("section", {
        className: "demo-error",
        children: [el("h2", { text: "3D course unavailable" }), el("p", { text: detail })]
      })
    );
    context.setStatus({ state: "unsupported", detail });
  }

  const readInput = (): { x: number; y: number; jump: boolean } => {
    let x = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    let y = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    const keyboard = scaledRadialDeadzone(x, y, 0.2);
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? [...navigator.getGamepads()] : [];
    const gamepad = sampleGamepadAxes(pads);
    const jump = jumpEdge || gamepad.jump;
    jumpEdge = false;
    return {
      x: gamepad.x || keyboard.x,
      y: gamepad.y || keyboard.y,
      jump
    };
  };

  const loop = createFixedStepLoop({
    stepSeconds: 1 / 60,
    maxSteps: 5,
    simulate: (dt) => {
      stepCourse(state, dt, readInput());
    },
    render: (alpha) => {
      view?.sync(state, alpha);
      status.textContent = `respawns ${state.respawns} · grounded ${state.grounded ? "yes" : "no"} · ${
        state.finished ? "goal reached" : "reach the gold marker"
      }`;
    }
  });

  const onDown = (event: KeyboardEvent): void => {
    keys.add(event.code);
    unlockAudio();
    if (event.code === "Space") {
      event.preventDefault();
      jumpEdge = true;
      if (audio) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = 240;
        gain.gain.value = 0.04;
        osc.connect(gain).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.08);
      }
    }
  };
  const onUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };
  const onBlur = (): void => keys.clear();

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);
  loop.start();
  context.setStatus({
    state: view ? "ready" : "unsupported",
    detail: "Fixed-step interpolated Three.js course."
  });

  return {
    dispose() {
      loop.stop();
      void audio?.close();
      view?.dispose();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      host.replaceChildren();
    }
  } satisfies DemoHandle;
};
