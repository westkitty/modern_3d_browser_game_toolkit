import { el } from "../../shared/dom";
import type { DemoHandle, DemoModule } from "../../shared/types";
import { reduce, snapshotGameplay, type TacticsState } from "./game";
import { createPanel } from "./panel";
import {
  STORAGE_KEY,
  loadSave,
  writeSave,
  type CameraPose,
  type Demo01Save
} from "./persist";
import { createBoardView } from "./view";

export const mount: DemoModule["mount"] = (host, context) => {
  const { save, notice } = loadSave(window.localStorage.getItem(STORAGE_KEY));
  let battle: TacticsState = save.battle;
  let camera: CameraPose = save.camera;
  let campaign = save.campaign;
  let persistNotice = notice;

  const shell = el("div", { className: "demo-shell tactics-shell" });
  const viewport = el("div", {
    className: "demo-viewport",
    attrs: { "aria-label": "3D tactics table", tabindex: "0" }
  });
  shell.append(viewport);
  host.replaceChildren(shell);

  let view: ReturnType<typeof createBoardView> | null = null;
  let webglNotice: string | null = null;
  try {
    view = createBoardView(viewport);
    view.setCamera(camera);
  } catch (error) {
    webglNotice = error instanceof Error ? error.message : String(error);
    viewport.replaceChildren(
      el("section", {
        className: "demo-error",
        attrs: { role: "status" },
        children: [
          el("h2", { text: "3D table unavailable" }),
          el("p", { text: webglNotice }),
          el("p", {
            text: "Semantic controls remain the authority for play. This is an explicit unsupported renderer state, not a silent blank canvas."
          })
        ]
      })
    );
  }

  const persist = (): void => {
    const payload: Demo01Save = {
      schemaVersion: 1,
      camera,
      campaign,
      battle: snapshotGameplay(battle)
    };
    writeSave(payload);
  };

  const apply = (next: TacticsState, message?: string): void => {
    const previousPhase = battle.phase;
    battle = next;
    if (message) persistNotice = message;
    if (previousPhase !== "victory" && battle.phase === "victory") {
      campaign = { ...campaign, battlesWon: campaign.battlesWon + 1 };
    }
    view?.render(battle);
    panel.sync(battle, {
      renders: view?.renderCount ?? 0,
      looping: view?.looping ?? false,
      persistNotice: webglNotice ?? persistNotice
    });
    persist();
    context.announce(battle.log[battle.log.length - 1] ?? "Tactics table updated.");
  };

  const panel = createPanel({
    onSelectUnit: (id) => apply(reduce(battle, { type: "select-unit", id })),
    onAction: (action) => apply(reduce(battle, { type: "choose-action", action })),
    onTile: (x, y) => apply(reduce(battle, { type: "choose-tile", x, y })),
    onTarget: (id) => apply(reduce(battle, { type: "choose-target", id })),
    onCancel: () => apply(reduce(battle, { type: "cancel" })),
    onNewBattle: () => {
      campaign = { ...campaign, battlesStarted: campaign.battlesStarted + 1 };
      apply(reduce(battle, { type: "new-battle" }), "New battle started.");
    },
    onOrbit: (dyaw, dpitch) => {
      camera = {
        ...camera,
        yaw: camera.yaw + dyaw,
        pitch: Math.min(1.35, Math.max(0.35, camera.pitch + dpitch))
      };
      view?.setCamera(camera);
      persist();
      panel.sync(battle, {
        renders: view?.renderCount ?? 0,
        looping: view?.looping ?? false,
        persistNotice: webglNotice ?? persistNotice
      });
    }
  });
  shell.append(panel.root);

  const onPointer = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const hit = view?.pick(event.clientX, event.clientY);
    if (!hit) return;
    if (hit.kind === "unit") {
      const unit = battle.units.find((item) => item.id === hit.id);
      if (unit?.side === "player") apply(reduce(battle, { type: "select-unit", id: hit.id }));
      else apply(reduce(battle, { type: "choose-target", id: hit.id }));
      return;
    }
    apply(reduce(battle, { type: "choose-tile", x: hit.x, y: hit.y }));
  };

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let downX = 0;
  let downY = 0;
  const onDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    downX = event.clientX;
    downY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent): void => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    lastX = event.clientX;
    lastY = event.clientY;
    camera = {
      ...camera,
      yaw: camera.yaw + dx * 0.008,
      pitch: Math.min(1.35, Math.max(0.35, camera.pitch + dy * 0.006))
    };
    view?.setCamera(camera);
  };
  const onUp = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    persist();
    const dist = Math.abs(event.clientX - downX) + Math.abs(event.clientY - downY);
    if (dist < 8) onPointer(event);
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "q" || event.key === "Q") {
      event.preventDefault();
      camera = { ...camera, yaw: camera.yaw - 0.18 };
      view?.setCamera(camera);
      persist();
    } else if (event.key === "e" || event.key === "E") {
      event.preventDefault();
      camera = { ...camera, yaw: camera.yaw + 0.18 };
      view?.setCamera(camera);
      persist();
    }
  };

  viewport.addEventListener("pointerdown", onDown);
  viewport.addEventListener("pointermove", onMove);
  viewport.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKey);

  apply(battle, persistNotice);
  context.setStatus(
    webglNotice
      ? { state: "unsupported", detail: webglNotice }
      : { state: "ready", detail: "Event-driven Three.js table. Idle when the camera and board are still." }
  );

  const handle: DemoHandle = {
    dispose() {
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      view?.dispose();
      host.replaceChildren();
    }
  };
  return handle;
};

export { STORAGE_KEY, loadSave };
export { createBattle, reduce } from "./game";
