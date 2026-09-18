export interface Vec3 { x: number; y: number; z: number; }

export interface Body {
  id: string;
  previous: Vec3;
  current: Vec3;
  kind: "player" | "platform" | "hazard" | "goal";
}

export interface CourseState {
  player: Body;
  velocity: Vec3;
  grounded: boolean;
  platformId: string | null;
  platforms: Body[];
  hazards: Body[];
  spawn: Vec3;
  elapsed: number;
  respawns: number;
  finished: boolean;
}

export interface CourseInput {
  x: number;
  y: number;
  jump: boolean;
  yaw?: number;
}

export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.2;
export const STEP_HEIGHT = 0.42;
const GRAVITY = -20;
const JUMP = 8.2;
const SPEED = 6;
const GROUND_ACCEL = 28;
const AIR_ACCEL = 10;
const BRAKE = 34;

export function vec(x: number, y: number, z: number): Vec3 { return { x, y, z }; }
function copy(v: Vec3): Vec3 { return { x: v.x, y: v.y, z: v.z }; }

export function createCourse(): CourseState {
  const spawn = vec(-6, 1.2, 0);
  return {
    player: { id: "player", kind: "player", previous: copy(spawn), current: copy(spawn) },
    velocity: vec(0, 0, 0),
    grounded: false,
    platformId: null,
    spawn,
    elapsed: 0,
    respawns: 0,
    finished: false,
    platforms: [
      { id: "pad-start", kind: "platform", previous: vec(-6, 0, 0), current: vec(-6, 0, 0) },
      { id: "pad-mid", kind: "platform", previous: vec(0, 0.2, 0), current: vec(0, 0.2, 0) },
      { id: "pad-move", kind: "platform", previous: vec(3.5, 1.2, -2), current: vec(3.5, 1.2, -2) },
      { id: "pad-goal", kind: "platform", previous: vec(8, 1.6, 0), current: vec(8, 1.6, 0) }
    ],
    hazards: [
      { id: "wall-a", kind: "hazard", previous: vec(-2, 1, 0), current: vec(-2, 1, 0) },
      { id: "goal", kind: "goal", previous: vec(8, 2.4, 0), current: vec(8, 2.4, 0) }
    ]
  };
}

export function interpolate(previous: Vec3, current: Vec3, alpha: number): Vec3 {
  return {
    x: previous.x + (current.x - previous.x) * alpha,
    y: previous.y + (current.y - previous.y) * alpha,
    z: previous.z + (current.z - previous.z) * alpha
  };
}

export function snapTeleport(body: Body, to: Vec3): void {
  body.previous = copy(to);
  body.current = copy(to);
}

function approach(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(target, value + amount);
  if (value > target) return Math.max(target, value - amount);
  return value;
}

interface Box { body: Body; hx: number; hy: number; hz: number; }

function overlaps(box: Box, p: Vec3): boolean {
  const half = PLAYER_HEIGHT / 2;
  return (
    p.x + PLAYER_RADIUS > box.body.current.x - box.hx &&
    p.x - PLAYER_RADIUS < box.body.current.x + box.hx &&
    p.y + half > box.body.current.y - box.hy &&
    p.y - half < box.body.current.y + box.hy &&
    p.z + PLAYER_RADIUS > box.body.current.z - box.hz &&
    p.z - PLAYER_RADIUS < box.body.current.z + box.hz
  );
}

function resolveHorizontal(state: CourseState, box: Box): void {
  if (!overlaps(box, state.player.current)) return;
  const feet = state.player.current.y - PLAYER_HEIGHT / 2;
  const top = box.body.current.y + box.hy;
  if (box.body.kind === "platform" && top >= feet - 0.03 && top - feet <= STEP_HEIGHT) {
    state.player.current.y = top + PLAYER_HEIGHT / 2;
    state.velocity.y = 0;
    state.grounded = true;
    state.platformId = box.body.id;
    return;
  }
  const left = Math.abs((box.body.current.x - box.hx) - (state.player.current.x + PLAYER_RADIUS));
  const right = Math.abs((box.body.current.x + box.hx) - (state.player.current.x - PLAYER_RADIUS));
  const front = Math.abs((box.body.current.z - box.hz) - (state.player.current.z + PLAYER_RADIUS));
  const back = Math.abs((box.body.current.z + box.hz) - (state.player.current.z - PLAYER_RADIUS));
  const min = Math.min(left, right, front, back);
  if (min === left) state.player.current.x = box.body.current.x - box.hx - PLAYER_RADIUS;
  else if (min === right) state.player.current.x = box.body.current.x + box.hx + PLAYER_RADIUS;
  else if (min === front) state.player.current.z = box.body.current.z - box.hz - PLAYER_RADIUS;
  else state.player.current.z = box.body.current.z + box.hz + PLAYER_RADIUS;
}

function resolveVertical(state: CourseState, box: Box, previousY: number): void {
  if (!overlaps(box, state.player.current)) return;
  const half = PLAYER_HEIGHT / 2;
  const top = box.body.current.y + box.hy;
  const bottom = box.body.current.y - box.hy;
  const previousFeet = previousY - half;
  const previousHead = previousY + half;
  if (state.velocity.y <= 0 && previousFeet >= top - 0.08) {
    state.player.current.y = top + half;
    state.velocity.y = 0;
    state.grounded = box.body.kind === "platform";
    state.platformId = box.body.kind === "platform" ? box.body.id : null;
  } else if (state.velocity.y > 0 && previousHead <= bottom + 0.08) {
    state.player.current.y = bottom - half;
    state.velocity.y = 0;
  }
}

export function stepCourse(state: CourseState, dt: number, input: CourseInput): CourseState {
  state.elapsed += dt;
  for (const body of [...state.platforms, ...state.hazards, state.player]) body.previous = copy(body.current);

  const mover = state.platforms.find((item) => item.id === "pad-move");
  if (mover) mover.current.z = Math.sin(state.elapsed * 0.8) * 2.4;

  if (state.platformId) {
    const platform = state.platforms.find((item) => item.id === state.platformId);
    if (platform) {
      state.player.current.x += platform.current.x - platform.previous.x;
      state.player.current.y += platform.current.y - platform.previous.y;
      state.player.current.z += platform.current.z - platform.previous.z;
    }
  }

  const yaw = input.yaw ?? 0;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  const wishX = input.x * cos - input.y * sin;
  const wishZ = input.x * sin + input.y * cos;
  const magnitude = Math.min(1, Math.hypot(wishX, wishZ));
  const targetX = magnitude ? (wishX / magnitude) * SPEED * magnitude : 0;
  const targetZ = magnitude ? (wishZ / magnitude) * SPEED * magnitude : 0;
  const accel = state.grounded ? (magnitude ? GROUND_ACCEL : BRAKE) : AIR_ACCEL;
  state.velocity.x = approach(state.velocity.x, targetX, accel * dt);
  state.velocity.z = approach(state.velocity.z, targetZ, accel * dt);

  if (state.grounded && input.jump) {
    state.velocity.y = JUMP;
    state.grounded = false;
    state.platformId = null;
  }
  state.velocity.y += GRAVITY * dt;

  const boxes: Box[] = [
    ...state.platforms.map((body) => ({ body, hx: 1.6, hy: 0.18, hz: 1.6 })),
    { body: state.hazards[0]!, hx: 0.35, hy: 1.1, hz: 1.4 }
  ];

  const previousY = state.player.current.y;
  state.player.current.x += state.velocity.x * dt;
  for (const box of boxes) {
    if (box.body.kind === "hazard" && overlaps(box, state.player.current)) {
      respawn(state);
      return state;
    }
    resolveHorizontal(state, box);
  }

  state.player.current.z += state.velocity.z * dt;
  for (const box of boxes) {
    if (box.body.kind === "hazard" && overlaps(box, state.player.current)) {
      respawn(state);
      return state;
    }
    resolveHorizontal(state, box);
  }

  state.player.current.y += state.velocity.y * dt;
  state.grounded = false;
  state.platformId = null;
  for (const box of boxes) resolveVertical(state, box, previousY);

  const goal = state.hazards.find((item) => item.kind === "goal");
  if (
    goal &&
    Math.hypot(state.player.current.x - goal.current.x, state.player.current.z - goal.current.z) < 0.9 &&
    Math.abs(state.player.current.y - goal.current.y) < 1.4
  ) state.finished = true;

  if (state.player.current.y < -6) respawn(state);
  return state;
}

function respawn(state: CourseState): void {
  snapTeleport(state.player, state.spawn);
  state.velocity = vec(0, 0, 0);
  state.grounded = false;
  state.platformId = null;
  state.respawns += 1;
  state.finished = false;
}
