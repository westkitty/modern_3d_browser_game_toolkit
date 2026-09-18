import { describe, expect, it } from "vitest";
import { createFixedStepLoop } from "../src/shared/loop";
import { sampleGamepadAxes, scaledRadialDeadzone } from "../src/shared/deadzone";
import { createCourse, interpolate, snapTeleport, stepCourse } from "../src/demos/03-character-course/sim";
import { consumeJump, consumeLook, createTouchInputState, normalizeStick, resetTouchState } from "../src/demos/03-character-course/touch";

describe("demo 03 production movement reference", () => {
  it("caps catch-up after an injected long frame", () => {
    let steps = 0;
    const loop = createFixedStepLoop({
      stepSeconds: 1 / 60,
      maxSteps: 5,
      simulate: () => { steps += 1; },
      render: () => undefined
    });
    expect(loop.injectFrame(4).steps).toBe(5);
    expect(steps).toBe(5);
  });

  it("produces deterministic movement under identical fixed deltas", () => {
    const a = createCourse();
    const b = createCourse();
    for (let i = 0; i < 120; i += 1) {
      const input = { x: i < 80 ? 0.8 : 0, y: -0.35, jump: i === 20, yaw: 0.4 };
      stepCourse(a, 1 / 60, input);
      stepCourse(b, 1 / 60, input);
    }
    expect(a.player.current).toEqual(b.player.current);
    expect(a.velocity).toEqual(b.velocity);
    expect(a.grounded).toBe(b.grounded);
  });

  it("settles onto the spawn platform and preserves grounded state", () => {
    const state = createCourse();
    for (let i = 0; i < 90; i += 1) stepCourse(state, 1 / 60, { x: 0, y: 0, jump: false, yaw: 0 });
    expect(state.grounded).toBe(true);
    expect(state.platformId).toBe("pad-start");
    expect(state.velocity.y).toBe(0);
  });

  it("accelerates instead of teleporting velocity to top speed", () => {
    const state = createCourse();
    stepCourse(state, 1 / 60, { x: 1, y: 0, jump: false, yaw: 0 });
    expect(Math.abs(state.velocity.x)).toBeGreaterThan(0);
    expect(Math.abs(state.velocity.x)).toBeLessThan(6);
  });

  it("snaps teleport history instead of interpolating across the map", () => {
    const state = createCourse();
    state.player.previous = { x: -6, y: 1, z: 0 };
    state.player.current = { x: 8, y: 1, z: 0 };
    snapTeleport(state.player, state.spawn);
    const mid = interpolate(state.player.previous, state.player.current, 0.5);
    expect(mid.x).toBeCloseTo(state.spawn.x);
    expect(mid.z).toBeCloseTo(state.spawn.z);
  });

  it("returns neutral input when no gamepad is connected", () => {
    expect(sampleGamepadAxes([null, null])).toEqual({ x: 0, y: 0, jump: false });
    const stick = scaledRadialDeadzone(0.05, 0.05, 0.18);
    expect(stick.x).toBe(0);
    expect(stick.y).toBe(0);
  });

  it("normalizes and clears touch input without sticky state", () => {
    const state = createTouchInputState();
    const stick = normalizeStick(200, 0);
    expect(stick.x).toBe(1);
    state.moveX = stick.x;
    state.lookX = 12;
    state.lookY = -4;
    state.jumpQueued = true;
    expect(consumeLook(state)).toEqual({ x: 12, y: -4 });
    expect(consumeJump(state)).toBe(true);
    resetTouchState(state);
    expect(state).toEqual({ moveX: 0, moveY: 0, lookX: 0, lookY: 0, jumpQueued: false });
  });
});
