import { describe, expect, it } from "vitest";
import { createFixedStepLoop } from "../src/shared/loop";

describe("fixed-step catch-up cap", () => {
  it("refuses unbounded catch-up after an injected long frame", () => {
    let simulated = 0;
    const loop = createFixedStepLoop({
      stepSeconds: 1 / 60,
      maxSteps: 5,
      maxFrameSeconds: 0.25,
      simulate: () => {
        simulated += 1;
      },
      render: () => undefined
    });

    const result = loop.injectFrame(2);
    expect(result.steps).toBeLessThanOrEqual(5);
    expect(simulated).toBeLessThanOrEqual(5);
    expect(result.remainder).toBe(0);
  });
});
