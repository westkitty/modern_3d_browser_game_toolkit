import { describe, expect, it } from "vitest";
import { createCampaign, resolveTurn, worldToMap } from "../src/demos/09-strategy-globe/state";

describe("demo 09 strategy globe", () => {
  it("resolves turns on pure campaign state", () => {
    const first = createCampaign();
    const second = resolveTurn(first);
    expect(second.turn).toBe(first.turn + 1);
    expect(first.turn).toBe(1);
  });

  it("maps lon/lat with an explicit transform", () => {
    const p = worldToMap(-180, 90, 100);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });
});
