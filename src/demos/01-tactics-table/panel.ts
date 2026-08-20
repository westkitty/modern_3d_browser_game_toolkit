import { el } from "../../shared/dom";
import {
  attackTargets,
  living,
  reachableTiles,
  type TacticsAction,
  type TacticsState,
  type Unit
} from "./game";

export interface PanelApi {
  root: HTMLElement;
  sync(state: TacticsState, extras: { renders: number; looping: boolean; persistNotice: string }): void;
}

export function createPanel(handlers: {
  onSelectUnit: (id: string) => void;
  onAction: (action: TacticsAction) => void;
  onTile: (x: number, y: number) => void;
  onTarget: (id: string) => void;
  onCancel: () => void;
  onNewBattle: () => void;
  onOrbit: (dyaw: number, dpitch: number) => void;
}): PanelApi {
  const root = el("aside", {
    className: "demo-panel tactics-panel",
    attrs: { "aria-label": "Tactics controls" }
  });

  const sync = (
    state: TacticsState,
    extras: { renders: number; looping: boolean; persistNotice: string }
  ): void => {
    const selected = state.units.find((item) => item.id === state.selectedUnitId);
    const ready = living(state, "player");
    root.replaceChildren(
      el("h2", { text: "Table controls" }),
      el("p", { text: extras.persistNotice }),
      el("p", {
        text: `Turn ${state.turn} · ${state.phase.replace("-", " ")} · frames ${extras.renders}${
          extras.looping ? " (render pending)" : " (idle)"
        }`
      }),
      unitList(ready, selected, state, handlers.onSelectUnit),
      actions(state, selected, handlers),
      targets(state, selected, handlers),
      cameraControls(handlers.onOrbit),
      el("h3", { text: "Combat log" }),
      el("div", {
        className: "panel-log",
        attrs: { role: "log", "aria-live": "polite" },
        text: state.log.join("\n")
      }),
      el("button", {
        className: "launch",
        text: "New battle",
        attrs: { type: "button" }
      })
    );
    const newBattle = root.querySelector("button:last-of-type");
    newBattle?.addEventListener("click", handlers.onNewBattle);
  };

  return { root, sync };
}

function unitList(
  units: Unit[],
  selected: Unit | undefined,
  state: TacticsState,
  onSelect: (id: string) => void
): HTMLElement {
  const list = el("ul", { className: "tactics-units", attrs: { role: "listbox", "aria-label": "Friendly units" } });
  for (const unit of units) {
    const option = el("li", { children: [] });
    const button = el("button", {
      className: unit.id === selected?.id ? "is-selected" : "",
      text: `${unit.name}  ${unit.hp}/${unit.maxHp}  ${unit.acted ? "acted" : "ready"}  (${unit.x},${unit.y})`,
      attrs: {
        type: "button",
        role: "option",
        "aria-selected": unit.id === selected?.id ? "true" : "false",
        ...(unit.acted || state.phase === "enemy" ? { disabled: "true" } : {})
      }
    });
    button.addEventListener("click", () => onSelect(unit.id));
    option.append(button);
    list.append(option);
  }
  return el("section", {
    children: [el("h3", { text: "Units" }), list]
  });
}

function actions(
  state: TacticsState,
  selected: Unit | undefined,
  handlers: {
    onAction: (action: TacticsAction) => void;
    onCancel: () => void;
  }
): HTMLElement {
  const group = el("div", { className: "tactics-actions", attrs: { role: "group", "aria-label": "Actions" } });
  for (const action of ["move", "attack", "wait"] as const) {
    const button = el("button", {
      text: action,
      attrs: {
        type: "button",
        ...(!selected || state.phase !== "select-action" ? { disabled: "true" } : {})
      }
    });
    button.addEventListener("click", () => handlers.onAction(action));
    group.append(button);
  }
  const cancel = el("button", {
    text: "Cancel",
    attrs: {
      type: "button",
      ...(state.phase === "select-unit" ? { disabled: "true" } : {})
    }
  });
  cancel.addEventListener("click", handlers.onCancel);
  group.append(cancel);
  return el("section", { children: [el("h3", { text: "Actions" }), group] });
}

function targets(
  state: TacticsState,
  selected: Unit | undefined,
  handlers: {
    onTile: (x: number, y: number) => void;
    onTarget: (id: string) => void;
  }
): HTMLElement {
  const section = el("section", { children: [el("h3", { text: "Keyboard targets" })] });
  if (!selected) {
    section.append(el("p", { text: "Select a friendly unit to act." }));
    return section;
  }
  if (state.phase === "select-tile") {
    const list = el("ul", { attrs: { "aria-label": "Reachable tiles" } });
    for (const tile of reachableTiles(state, selected)) {
      const button = el("button", {
        text: `Move to ${tile.x},${tile.y}`,
        attrs: { type: "button" }
      });
      button.addEventListener("click", () => handlers.onTile(tile.x, tile.y));
      list.append(el("li", { children: [button] }));
    }
    section.append(list);
    return section;
  }
  if (state.phase === "select-target") {
    const list = el("ul", { attrs: { "aria-label": "Attack targets" } });
    const foes = attackTargets(state, selected);
    if (foes.length === 0) section.append(el("p", { text: "No enemy in range." }));
    for (const foe of foes) {
      const button = el("button", {
        text: `Attack ${foe.name} at ${foe.x},${foe.y} (${foe.hp} HP)`,
        attrs: { type: "button" }
      });
      button.addEventListener("click", () => handlers.onTarget(foe.id));
      list.append(el("li", { children: [button] }));
    }
    section.append(list);
    return section;
  }
  section.append(el("p", { text: "Choose Move, Attack, or Wait." }));
  return section;
}

function cameraControls(onOrbit: (dyaw: number, dpitch: number) => void): HTMLElement {
  const group = el("div", { className: "tactics-camera", attrs: { role: "group", "aria-label": "Camera" } });
  const buttons: Array<[string, number, number]> = [
    ["Orbit left", -0.18, 0],
    ["Orbit right", 0.18, 0],
    ["Tilt up", 0, -0.1],
    ["Tilt down", 0, 0.1]
  ];
  for (const [label, yaw, pitch] of buttons) {
    const button = el("button", { text: label, attrs: { type: "button" } });
    button.addEventListener("click", () => onOrbit(yaw, pitch));
    group.append(button);
  }
  return el("section", {
    children: [
      el("h3", { text: "Board view" }),
      el("p", { text: "Camera never writes gameplay coordinates." }),
      group
    ]
  });
}
