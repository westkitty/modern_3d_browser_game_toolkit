import { describe, expect, it } from "vitest";
import { hashPairs, naivePairs, spawnAgents } from "../src/demos/08-crowd-lab/broadphase";
import { PERFORMANCE_SCENARIOS, SampleWindow, kinematicCollisionWork, streamedZoneChurn } from "../src/demos/08-crowd-lab/performance";

describe("demo 08 crowd lab", () => {
  it("keeps naive pair counts independent of clustered hashing", () => {
    const uniform = spawnAgents(40, "uniform");
    const clustered = spawnAgents(40, "clustered");
    expect(naivePairs(uniform)).toBe(naivePairs(clustered));
    expect(hashPairs(clustered, 2).candidates).toBeLessThan(naivePairs(clustered));
  });

  it("exposes all five required comparative scenarios", () => {
    expect(PERFORMANCE_SCENARIOS).toEqual([
      "baseline",
      "movement",
      "streaming",
      "resource-churn",
      "crowd"
    ]);
  });

  it("keeps synthetic movement and streaming workloads deterministic", () => {
    expect(kinematicCollisionWork(1200)).toBe(kinematicCollisionWork(1200));
    expect(streamedZoneChurn(80, 128)).toBe(streamedZoneChurn(80, 128));
  });

  it("reports raw sample statistics without invented thresholds", () => {
    const samples = new SampleWindow(5);
    [1, 2, 3, 4, 10].forEach((value) => samples.push(value));
    const summary = samples.summary();
    expect(summary.count).toBe(5);
    expect(summary.mean).toBe(4);
    expect(summary.max).toBe(10);
    expect(summary.p95).toBe(10);
  });
});
