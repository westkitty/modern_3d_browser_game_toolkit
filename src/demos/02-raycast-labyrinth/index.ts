import { el } from "../../shared/dom";
import { createFrameLoop } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoHandle, DemoModule } from "../../shared/types";
import { createLabyrinthAudio } from "./audio";
import {
  canvasLocalPoint,
  resizeCanvas2d,
  type CanvasRestoreState
} from "./canvasState";
import { drawLabyrinth } from "./draw";
import {
  createWorld,
  rotatePlayer,
  spawnPlayer,
  tryMove,
  type LabyrinthWorld,
  type Player
} from "./map";
import { castFrame } from "./raycast";

const MOVE = 2.4;
const TURN = 1.8;
const MAX_DT = 0.05;

export const mount: DemoModule["mount"] = (host, context) => {
  const world: LabyrinthWorld = createWorld();
  let player: Player = spawnPlayer();
  const keys = new Set<string>();
  const audio = createLabyrinthAudio();

  const shell = el("div", { className: "demo-shell labyrinth-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "First-person Canvas 2D ray-cast labyrinth");
  viewport.append(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    host.replaceChildren(
      el("section", {
        className: "demo-error",
        attrs: { role: "alert" },
        children: [
          el("h2", { text: "Canvas 2D unavailable" }),
          el("p", { text: "This demonstration requires CanvasRenderingContext2D." })
        ]
      })
    );
    context.setStatus({ state: "unsupported", detail: "CanvasRenderingContext2D missing" });
    return {
      dispose() {
        host.replaceChildren();
      }
    };
  }

  let cssWidth = 640;
  let cssHeight = 400;
  let canvasState: CanvasRestoreState = resizeCanvas2d(
    canvas,
    ctx,
    cssWidth,
    cssHeight,
    cappedDevicePixelRatio(2)
  );

  const panel = el("aside", {
    className: "demo-panel",
    attrs: { "aria-label": "Labyrinth controls" },
    children: [
      el("h2", { text: "Ray-cast labyrinth" }),
      el("p", {
        text: "Primary renderer is CanvasRenderingContext2D column casting. No Three.js. No WebGL."
      }),
      el("p", {
        attrs: { id: "labyrinth-status" },
        text: "Find three orbs. Touch buttons or WASD/arrows."
      }),
      el("div", {
        className: "tactics-camera",
        attrs: { role: "group", "aria-label": "Movement" },
        children: ["Forward", "Back", "Left", "Right"].map((label) => {
          const button = el("button", { text: label, attrs: { type: "button" } });
          const code =
            label === "Forward" ? "KeyW" : label === "Back" ? "KeyS" : label === "Left" ? "KeyA" : "KeyD";
          button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            keys.add(code);
            void audio.unlock();
          });
          button.addEventListener("pointerup", () => keys.delete(code));
          button.addEventListener("pointerleave", () => keys.delete(code));
          return button;
        })
      })
    ]
  });
  const status = panel.querySelector("#labyrinth-status") as HTMLParagraphElement;
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  const resize = observeElementSize(viewport, (width, height) => {
    cssWidth = Math.max(160, width);
    cssHeight = Math.max(120, height);
    canvasState = resizeCanvas2d(
      canvas,
      ctx,
      cssWidth,
      cssHeight,
      cappedDevicePixelRatio(2)
    );
  });

  const collect = (): void => {
    for (const sprite of world.sprites) {
      if (sprite.collected || sprite.kind !== "orb") continue;
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      if (dx * dx + dy * dy < 0.35) {
        sprite.collected = true;
        audio.chime();
        context.announce(`${sprite.id} collected.`);
      }
    }
  };

  const loop = createFrameLoop((dt) => {
    const step = Math.min(dt, MAX_DT);
    if (keys.has("ArrowLeft") || keys.has("KeyA")) player = rotatePlayer(player, -TURN * step);
    if (keys.has("ArrowRight") || keys.has("KeyD")) player = rotatePlayer(player, TURN * step);
    const forward = (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0) - (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0);
    if (forward !== 0) {
      player = tryMove(
        world,
        player,
        player.dirX * MOVE * step * forward,
        player.dirY * MOVE * step * forward
      );
    }
    collect();
    const remaining = world.sprites.filter((item) => item.kind === "orb" && !item.collected).length;
    const frame = castFrame(world, player, Math.floor(cssWidth), Math.floor(cssHeight));
    drawLabyrinth(
      ctx,
      frame,
      cssWidth,
      cssHeight,
      canvasState,
      `Canvas 2D · orbs ${3 - remaining}/3 · audio ${audio.unlocked ? "on" : "locked"}`
    );
    status.textContent = `Orbs remaining: ${remaining}. Depth buffer occludes sprites behind walls.`;
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    keys.add(event.code);
    void audio.unlock();
  };
  const onKeyUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };
  const onBlur = (): void => {
    keys.clear();
  };
  const onPointer = (event: PointerEvent): void => {
    void audio.unlock();
    const { u } = canvasLocalPoint(canvas, event.clientX, event.clientY);
    if (event.buttons !== 1) return;
    if (u < 0.35) player = rotatePlayer(player, -TURN * 0.04);
    else if (u > 0.65) player = rotatePlayer(player, TURN * 0.04);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onPointer);
  document.addEventListener("visibilitychange", onBlur);

  loop.start();
  context.setStatus({
    state: "ready",
    detail: "CanvasRenderingContext2D ray caster. Three.js is not imported."
  });

  const handle: DemoHandle = {
    dispose() {
      loop.stop();
      resize.disconnect();
      audio.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onBlur);
      host.replaceChildren();
    }
  };
  return handle;
};
