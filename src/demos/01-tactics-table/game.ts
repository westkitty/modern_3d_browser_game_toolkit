export type Side = "player" | "enemy";
export type Phase =
  | "select-unit"
  | "select-action"
  | "select-tile"
  | "select-target"
  | "enemy"
  | "victory"
  | "defeat";
export type TacticsAction = "move" | "attack" | "wait";

export interface Unit {
  id: string;
  name: string;
  side: Side;
  hp: number;
  maxHp: number;
  move: number;
  range: number;
  damage: number;
  x: number;
  y: number;
  acted: boolean;
}

export interface TacticsState {
  width: number;
  height: number;
  turn: number;
  phase: Phase;
  selectedUnitId: string | null;
  pendingAction: TacticsAction | null;
  units: Unit[];
  log: string[];
}

export type TacticsCommand =
  | { type: "select-unit"; id: string }
  | { type: "choose-action"; action: TacticsAction }
  | { type: "choose-tile"; x: number; y: number }
  | { type: "choose-target"; id: string }
  | { type: "cancel" }
  | { type: "new-battle" };

const LOG_LIMIT = 24;

export function createBattle(): TacticsState {
  return {
    width: 7,
    height: 6,
    turn: 1,
    phase: "select-unit",
    selectedUnitId: null,
    pendingAction: null,
    units: [
      unit("p-ranger", "Ranger", "player", 6, 4, 3, 2, 1, 5),
      unit("p-guardian", "Guardian", "player", 10, 2, 1, 3, 3, 5),
      unit("p-operative", "Operative", "player", 7, 3, 1, 2, 5, 4),
      unit("e-raider", "Raider", "enemy", 6, 3, 1, 2, 2, 0),
      unit("e-marksman", "Marksman", "enemy", 5, 3, 3, 2, 4, 0),
      unit("e-overseer", "Overseer", "enemy", 9, 2, 1, 3, 5, 1)
    ],
    log: ["Battle 1. Select a unit, then an action. Keyboard is sufficient."]
  };
}

function unit(
  id: string,
  name: string,
  side: Side,
  hp: number,
  move: number,
  range: number,
  damage: number,
  x: number,
  y: number
): Unit {
  return { id, name, side, hp, maxHp: hp, move, range, damage, x, y, acted: false };
}

export function cloneState(state: TacticsState): TacticsState {
  return {
    ...state,
    units: state.units.map((item) => ({ ...item })),
    log: [...state.log]
  };
}

export function unitById(state: TacticsState, id: string): Unit | undefined {
  return state.units.find((item) => item.id === id);
}

export function living(state: TacticsState, side?: Side): Unit[] {
  return state.units.filter((item) => item.hp > 0 && (side ? item.side === side : true));
}

export function occupantAt(state: TacticsState, x: number, y: number): Unit | undefined {
  return living(state).find((item) => item.x === x && item.y === y);
}

export function inBounds(state: TacticsState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function reachableTiles(state: TacticsState, actor: Unit): Array<{ x: number; y: number }> {
  const found: Array<{ x: number; y: number }> = [];
  const visited = new Set<string>([`${actor.x},${actor.y}`]);
  const queue: Array<{ x: number; y: number; d: number }> = [{ x: actor.x, y: actor.y, d: 0 }];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  while (queue.length) {
    const node = queue.shift();
    if (!node) break;
    if (node.d > 0) found.push({ x: node.x, y: node.y });
    if (node.d === actor.move) continue;
    for (const [dx, dy] of dirs) {
      const x = node.x + (dx ?? 0);
      const y = node.y + (dy ?? 0);
      const key = `${x},${y}`;
      if (visited.has(key) || !inBounds(state, x, y)) continue;
      const blocker = occupantAt(state, x, y);
      if (blocker && blocker.id !== actor.id) continue;
      visited.add(key);
      queue.push({ x, y, d: node.d + 1 });
    }
  }
  return found;
}

export function attackTargets(state: TacticsState, actor: Unit): Unit[] {
  const foe: Side = actor.side === "player" ? "enemy" : "player";
  return living(state, foe).filter(
    (item) => manhattan(actor.x, actor.y, item.x, item.y) <= actor.range
  );
}

function pushLog(state: TacticsState, line: string): void {
  state.log = [...state.log, line].slice(-LOG_LIMIT);
}

function outcome(state: TacticsState): TacticsState {
  if (living(state, "enemy").length === 0) {
    state.phase = "victory";
    pushLog(state, "All hostiles down. Table secured.");
  } else if (living(state, "player").length === 0) {
    state.phase = "defeat";
    pushLog(state, "Friendly force eliminated.");
  }
  return state;
}

function readyPlayerUnits(state: TacticsState): Unit[] {
  return living(state, "player").filter((item) => !item.acted);
}

function finishActor(state: TacticsState, actor: Unit): TacticsState {
  actor.acted = true;
  state.selectedUnitId = null;
  state.pendingAction = null;
  outcome(state);
  if (state.phase === "victory" || state.phase === "defeat") return state;
  if (readyPlayerUnits(state).length === 0) {
    return resolveEnemyPhase(state);
  }
  state.phase = "select-unit";
  return state;
}

function resolveEnemyPhase(state: TacticsState): TacticsState {
  state.phase = "enemy";
  pushLog(state, `Enemy phase, turn ${state.turn}.`);
  for (const enemy of living(state, "enemy")) {
    const targets = attackTargets(state, enemy);
    if (targets.length > 0) {
      const target = targets[0];
      if (!target) continue;
      target.hp = Math.max(0, target.hp - enemy.damage);
      pushLog(state, `${enemy.name} strikes ${target.name} for ${enemy.damage}.`);
      continue;
    }
    const closest = living(state, "player")
      .slice()
      .sort(
        (a, b) =>
          manhattan(enemy.x, enemy.y, a.x, a.y) - manhattan(enemy.x, enemy.y, b.x, b.y)
      )[0];
    if (!closest) continue;
    const tiles = reachableTiles(state, enemy).sort(
      (a, b) =>
        manhattan(a.x, a.y, closest.x, closest.y) - manhattan(b.x, b.y, closest.x, closest.y)
    );
    const step = tiles[0];
    if (step && manhattan(step.x, step.y, closest.x, closest.y) < manhattan(enemy.x, enemy.y, closest.x, closest.y)) {
      enemy.x = step.x;
      enemy.y = step.y;
      pushLog(state, `${enemy.name} advances to ${step.x},${step.y}.`);
    }
  }
  const over =
    living(state, "enemy").length === 0 || living(state, "player").length === 0;
  outcome(state);
  if (over) return state;
  state.turn += 1;
  for (const item of state.units) item.acted = false;
  state.phase = "select-unit";
  pushLog(state, `Player phase, turn ${state.turn}.`);
  return state;
}

export function reduce(state: TacticsState, command: TacticsCommand): TacticsState {
  const next = cloneState(state);
  if (command.type === "new-battle") return createBattle();
  if (next.phase === "victory" || next.phase === "defeat") return next;

  if (command.type === "cancel") {
    next.pendingAction = null;
    next.phase = next.selectedUnitId ? "select-action" : "select-unit";
    return next;
  }

  if (command.type === "select-unit") {
    const selected = unitById(next, command.id);
    if (!selected || selected.side !== "player" || selected.hp <= 0 || selected.acted) {
      return next;
    }
    next.selectedUnitId = selected.id;
    next.pendingAction = null;
    next.phase = "select-action";
    pushLog(next, `${selected.name} selected.`);
    return next;
  }

  const actor = next.selectedUnitId ? unitById(next, next.selectedUnitId) : undefined;

  if (command.type === "choose-action") {
    if (!actor || next.phase !== "select-action") return next;
    if (command.action === "wait") {
      pushLog(next, `${actor.name} waits.`);
      return finishActor(next, actor);
    }
    next.pendingAction = command.action;
    next.phase = command.action === "move" ? "select-tile" : "select-target";
    pushLog(next, `${actor.name} prepares to ${command.action}.`);
    return next;
  }

  if (command.type === "choose-tile") {
    if (!actor || next.pendingAction !== "move" || next.phase !== "select-tile") return next;
    const legal = reachableTiles(next, actor).some(
      (tile) => tile.x === command.x && tile.y === command.y
    );
    if (!legal) return next;
    actor.x = command.x;
    actor.y = command.y;
    pushLog(next, `${actor.name} moves to ${command.x},${command.y}.`);
    return finishActor(next, actor);
  }

  if (command.type === "choose-target") {
    if (!actor || next.pendingAction !== "attack" || next.phase !== "select-target") return next;
    const target = attackTargets(next, actor).find((item) => item.id === command.id);
    if (!target) return next;
    target.hp = Math.max(0, target.hp - actor.damage);
    pushLog(next, `${actor.name} hits ${target.name} for ${actor.damage}.`);
    return finishActor(next, actor);
  }

  return next;
}

export function snapshotGameplay(state: TacticsState): TacticsState {
  return cloneState(state);
}
