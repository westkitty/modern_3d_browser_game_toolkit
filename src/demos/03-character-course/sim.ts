export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

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

export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.2;

const GRAVITY = -20;
const JUMP = 8.2;
const SPEED = 6;

export function vec(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function copy(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

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

function aabb(
  cx: number,
  cy: number,
  cz: number,
  hx: number,
  hy: number,
  hz: number,
  px: number,
  py: number,
  pz: number,
  pr: number,
  ph: number
): { x: number; y: number; z: number } | null {
  const closestX = Math.min(cx + hx, Math.max(cx - hx, px));
  const closestY = Math.min(cy + hy, Math.max(cy - hy, py));
  const closestZ = Math.min(cz + hz, Math.max(cz - hz, pz));
  const dx = px - closestX;
  const dy = py - closestY;
  const dz = pz - closestZ;
  if (dx * dx + dz * dz > pr * pr) return null;
  if (py - ph / 2 > cy + hy || py + ph / 2 < cy - hy) return null;
  return { x: dx, y: dy, z: dz };
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

export function stepCourse(
  state: CourseState,
  dt: number,
  input: { x: number; y: number; jump: boolean }
): CourseState {
  state.elapsed += dt;
  for (const body of [...state.platforms, ...state.hazards, state.player]) {
    body.previous = copy(body.current);
  }

  const mover = state.platforms.find((item) => item.id === "pad-move");
  if (mover) {
    mover.current.z = Math.sin(state.elapsed * 0.8) * 2.4;
  }

  if (state.platformId) {
    const platform = state.platforms.find((item) => item.id === state.platformId);
    if (platform) {
      state.player.current.x += platform.current.x - platform.previous.x;
      state.player.current.y += platform.current.y - platform.previous.y;
      state.player.current.z += platform.current.z - platform.previous.z;
    }
  }

  state.velocity.x = input.x * SPEED;
  state.velocity.z = input.y * SPEED;
  state.velocity.y += GRAVITY * dt;
  if (state.grounded && input.jump) {
    state.velocity.y = JUMP;
    state.grounded = false;
    state.platformId = null;
  }

  state.player.current.x += state.velocity.x * dt;
  state.player.current.y += state.velocity.y * dt;
  state.player.current.z += state.velocity.z * dt;

  state.grounded = false;
  state.platformId = null;
  const boxes: Array<{ body: Body; hx: number; hy: number; hz: number }> = [
    ...state.platforms.map((body) => ({ body, hx: 1.6, hy: 0.18, hz: 1.6 })),
    { body: state.hazards[0]!, hx: 0.35, hy: 1.1, hz: 1.4 }
  ];
  for (const box of boxes) {
    const hit = aabb(
      box.body.current.x,
      box.body.current.y,
      box.body.current.z,
      box.hx,
      box.hy,
      box.hz,
      state.player.current.x,
      state.player.current.y,
      state.player.current.z,
      PLAYER_RADIUS,
      PLAYER_HEIGHT
    );
    if (!hit) continue;
    if (box.body.kind === "hazard") {
      respawn(state);
      return state;
    }
    if (hit.y > 0 && state.velocity.y <= 0) {
      state.player.current.y = box.body.current.y + box.hy + PLAYER_HEIGHT / 2;
      state.velocity.y = 0;
      state.grounded = true;
      state.platformId = box.body.id;
    } else {
      const push = Math.hypot(hit.x, hit.z) || 1;
      state.player.current.x += (hit.x / push) * 0.08;
      state.player.current.z += (hit.z / push) * 0.08;
    }
  }

  const goal = state.hazards.find((item) => item.kind === "goal");
  if (
    goal &&
    Math.hypot(state.player.current.x - goal.current.x, state.player.current.z - goal.current.z) < 0.9 &&
    Math.abs(state.player.current.y - goal.current.y) < 1.4
  ) {
    state.finished = true;
  }

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

export function cameraObstruction(
  from: Vec3,
  to: Vec3,
  obstacles: Array<{ x: number; z: number; hx: number; hz: number }>
): Vec3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  let t = 1;
  for (const box of obstacles) {
    const minX = box.x - box.hx;
    const maxX = box.x + box.hx;
    const minZ = box.z - box.hz;
    const maxZ = box.z + box.hz;
    if (dx !== 0) {
      const tx1 = (minX - from.x) / dx;
      const tx2 = (maxX - from.x) / dx;
      const tz1 = dz === 0 ? Number.NEGATIVE_INFINITY : (minZ - from.z) / dz;
      const tz2 = dz === 0 ? Number.POSITIVE_INFINITY : (maxZ - from.z) / dz;
      const tmin = Math.max(Math.min(tx1, tx2), Math.min(tz1, tz2));
      const tmax = Math.min(Math.max(tx1, tx2), Math.max(tz1, tz2));
      if (tmax >= tmin && tmin > 0.05 && tmin < t) t = tmin * 0.92;
    }
  }
  return vec(from.x + dx * t, to.y, from.z + dz * t);
}
