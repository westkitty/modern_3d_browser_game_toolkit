import { sampleGamepadAxes, scaledRadialDeadzone } from "../../shared/deadzone";
import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { createResourceScope, resourceSnapshot } from "../../shared/resources";
import type { DemoHandle, DemoModule } from "../../shared/types";
import { createCourse, stepCourse } from "./sim";
import { consumeJump, consumeLook, createTouchInputState, normalizeStick, resetTouchState } from "./touch";
import { createCourseView } from "./view";

export const mount: DemoModule["mount"] = (host, context) => {
  const scope = createResourceScope();
  const keys = new Set<string>();
  const touch = createTouchInputState();
  let jumpEdge = false;
  let yaw = 0;
  let pitch = 0;
  let inputMode = "keyboard";
  const state = createCourse();

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport fps-viewport", attrs: { tabindex: "0" } });
  const status = el("pre", { className: "panel-log", attrs: { id: "course-status" } });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "First-person fixed-step course" }),
      el("p", { text: "Click the view for pointer lock. WASD moves, mouse looks, Space jumps. Touch controls appear on coarse pointers." }),
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
    viewport.replaceChildren(el("section", {
      className: "demo-error",
      children: [el("h2", { text: "3D course unavailable" }), el("p", { text: detail })]
    }));
    context.setStatus({ state: "unsupported", detail });
  }

  const clearInput = (): void => {
    keys.clear();
    jumpEdge = false;
    resetTouchState(touch);
  };

  const readInput = (): { x: number; y: number; jump: boolean; yaw: number } => {
    const keyboardX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const keyboardY = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    const keyboard = scaledRadialDeadzone(keyboardX, keyboardY, 0.2);
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? [...navigator.getGamepads()] : [];
    const gamepad = sampleGamepadAxes(pads);
    const touchActive = Math.hypot(touch.moveX, touch.moveY) > 0.01;
    const x = touchActive ? touch.moveX : gamepad.x || keyboard.x;
    const y = touchActive ? touch.moveY : gamepad.y || keyboard.y;
    const jump = jumpEdge || gamepad.jump || consumeJump(touch);
    jumpEdge = false;
    return { x, y, jump, yaw };
  };

  const onDown = (event: KeyboardEvent): void => {
    keys.add(event.code);
    inputMode = "keyboard/mouse";
    if (event.code === "Space") {
      event.preventDefault();
      jumpEdge = true;
    }
  };
  const onUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };
  const onBlur = (): void => clearInput();
  const onVisibility = (): void => { if (document.hidden) clearInput(); };
  const onPointerLock = (): void => {
    if (document.pointerLockElement !== view?.canvas) clearInput();
  };
  const onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== view?.canvas) return;
    yaw -= event.movementX * 0.0022;
    pitch -= event.movementY * 0.0022;
    pitch = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, pitch));
    view?.setLook(yaw, pitch);
    inputMode = "keyboard/mouse";
  };
  const onCanvasClick = (): void => {
    if (document.pointerLockElement !== view?.canvas) void view?.canvas.requestPointerLock?.();
  };

  scope.listen(window, "keydown", onDown as EventListener);
  scope.listen(window, "keyup", onUp as EventListener);
  scope.listen(window, "blur", onBlur);
  scope.listen(document, "visibilitychange", onVisibility);
  scope.listen(document, "pointerlockchange", onPointerLock);
  scope.listen(document, "mousemove", onMouseMove as EventListener);
  if (view) scope.listen(view.canvas, "click", onCanvasClick);

  const coarse = window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  if (coarse) {
    const controls = el("div", { className: "touch-controls", attrs: { "aria-label": "Touch game controls" } });
    const movePad = el("div", { className: "touch-pad touch-move", attrs: { "aria-label": "Movement stick" } });
    const knob = el("div", { className: "touch-knob" });
    movePad.append(knob);
    const lookPad = el("div", { className: "touch-pad touch-look", attrs: { "aria-label": "Look area" } });
    const jump = el("button", { className: "touch-jump", text: "Jump", attrs: { type: "button" } });
    controls.append(movePad, lookPad, jump);
    viewport.append(controls);

    let movePointer: number | null = null;
    let lookPointer: number | null = null;
    let moveOrigin = { x: 0, y: 0 };
    let lookLast = { x: 0, y: 0 };

    const moveDown = (event: PointerEvent): void => {
      event.preventDefault();
      movePointer = event.pointerId;
      moveOrigin = { x: event.clientX, y: event.clientY };
      movePad.setPointerCapture(event.pointerId);
      inputMode = "touch";
    };
    const moveMove = (event: PointerEvent): void => {
      if (event.pointerId !== movePointer) return;
      event.preventDefault();
      const dx = event.clientX - moveOrigin.x;
      const dy = event.clientY - moveOrigin.y;
      const normalized = normalizeStick(dx, dy);
      touch.moveX = normalized.x;
      touch.moveY = normalized.y;
      knob.style.transform = `translate(${normalized.x * 34}px, ${normalized.y * 34}px)`;
    };
    const moveEnd = (event: PointerEvent): void => {
      if (event.pointerId !== movePointer) return;
      movePointer = null;
      touch.moveX = 0;
      touch.moveY = 0;
      knob.style.transform = "translate(0, 0)";
    };
    const lookDown = (event: PointerEvent): void => {
      event.preventDefault();
      lookPointer = event.pointerId;
      lookLast = { x: event.clientX, y: event.clientY };
      lookPad.setPointerCapture(event.pointerId);
      inputMode = "touch";
    };
    const lookMove = (event: PointerEvent): void => {
      if (event.pointerId !== lookPointer) return;
      event.preventDefault();
      touch.lookX += event.clientX - lookLast.x;
      touch.lookY += event.clientY - lookLast.y;
      lookLast = { x: event.clientX, y: event.clientY };
    };
    const lookEnd = (event: PointerEvent): void => {
      if (event.pointerId === lookPointer) lookPointer = null;
    };
    const jumpDown = (event: PointerEvent): void => {
      event.preventDefault();
      touch.jumpQueued = true;
      inputMode = "touch";
    };

    scope.listen(movePad, "pointerdown", moveDown as EventListener);
    scope.listen(movePad, "pointermove", moveMove as EventListener);
    scope.listen(movePad, "pointerup", moveEnd as EventListener);
    scope.listen(movePad, "pointercancel", moveEnd as EventListener);
    scope.listen(lookPad, "pointerdown", lookDown as EventListener);
    scope.listen(lookPad, "pointermove", lookMove as EventListener);
    scope.listen(lookPad, "pointerup", lookEnd as EventListener);
    scope.listen(lookPad, "pointercancel", lookEnd as EventListener);
    scope.listen(jump, "pointerdown", jumpDown as EventListener);
  }

  const loop = createFixedStepLoop({
    stepSeconds: 1 / 60,
    maxSteps: 5,
    simulate: (dt) => {
      const look = consumeLook(touch);
      if (look.x || look.y) {
        yaw -= look.x * 0.004;
        pitch -= look.y * 0.004;
        pitch = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, pitch));
        view?.setLook(yaw, pitch);
      }
      stepCourse(state, dt, readInput());
    },
    render: (alpha) => {
      view?.sync(state, alpha);
      const metrics = view?.getRendererMetrics();
      const owned = resourceSnapshot();
      status.textContent =
        `input ${inputMode} · ${state.grounded ? "grounded" : "airborne"} · speed ${Math.hypot(state.velocity.x, state.velocity.z).toFixed(2)}\n` +
        `yaw ${yaw.toFixed(2)} pitch ${pitch.toFixed(2)} · respawns ${state.respawns}\n` +
        `owned runtime ${owned.runtime} scenes ${owned.scene} geo ${owned.geometry} mat ${owned.material} listeners ${owned.listener}\n` +
        (metrics ? `renderer calls ${metrics.calls} triangles ${metrics.triangles} memory geo ${metrics.geometries} tex ${metrics.textures}` : "renderer unavailable");
    }
  });

  loop.start();
  context.setStatus({ state: view ? "ready" : "unsupported", detail: "First-person fixed-step kinematic collision reference." });

  return {
    dispose() {
      if (document.pointerLockElement === view?.canvas) document.exitPointerLock?.();
      loop.stop();
      view?.dispose();
      scope.dispose();
      host.replaceChildren();
    }
  } satisfies DemoHandle;
};
