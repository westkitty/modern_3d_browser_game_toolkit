import { describe, expect, it } from "vitest";
import { createFixedStepLoop } from "../src/shared/loop";
import { sampleGamepadAxes, scaledRadialDeadzone } from "../src/shared/deadzone";
import { createCourse, interpolate, snapTeleport, stepCourse } from "../src/demos/03-character-course/sim";

describe("demo 03 character course", () => {
  it("caps catch-up after an injected long frame", () => {
    let steps = 0;
    const loop = createFixedStepLoop({
      stepSeconds: 1 / 60,
      maxSteps: 5,
      simulate: () => {
        steps += 1;
      },
      render: () => undefined
    });
    expect(loop.injectFrame(4).steps).toBe(5);
    expect(steps).toBe(5);
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

  it("applies gravity and can leave the spawn pad", () => {
    const state = createCourse();
    for (let i = 0; i < 10; i += 1) stepCourse(state, 1 / 60, { x: 1, y: 0, jump: false });
    expect(state.player.current.x).not.toBe(state.spawn.x);
  });
});
