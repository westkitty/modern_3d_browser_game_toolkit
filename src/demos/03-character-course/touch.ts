export interface TouchInputState {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jumpQueued: boolean;
}

export function createTouchInputState(): TouchInputState {
  return { moveX: 0, moveY: 0, lookX: 0, lookY: 0, jumpQueued: false };
}

export function clampStick(x: number, y: number, radius = 52): { x: number; y: number } {
  const length = Math.hypot(x, y);
  if (length <= radius || length === 0) return { x, y };
  const scale = radius / length;
  return { x: x * scale, y: y * scale };
}

export function normalizeStick(x: number, y: number, radius = 52): { x: number; y: number } {
  const clamped = clampStick(x, y, radius);
  return {
    x: Math.max(-1, Math.min(1, clamped.x / radius)),
    y: Math.max(-1, Math.min(1, clamped.y / radius))
  };
}

export function consumeLook(state: TouchInputState): { x: number; y: number } {
  const result = { x: state.lookX, y: state.lookY };
  state.lookX = 0;
  state.lookY = 0;
  return result;
}

export function consumeJump(state: TouchInputState): boolean {
  const queued = state.jumpQueued;
  state.jumpQueued = false;
  return queued;
}

export function resetTouchState(state: TouchInputState): void {
  state.moveX = 0;
  state.moveY = 0;
  state.lookX = 0;
  state.lookY = 0;
  state.jumpQueued = false;
}
