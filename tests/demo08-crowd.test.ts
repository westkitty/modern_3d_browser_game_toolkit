import { describe, expect, it } from "vitest";
import { hashPairs, naivePairs, spawnAgents } from "../src/demos/08-crowd-lab/broadphase";

describe("demo 08 crowd lab", () => {
  it("keeps naive pair counts independent of clustered hashing", () => {
    const uniform = spawnAgents(40, "uniform");
    const clustered = spawnAgents(40, "clustered");
    expect(naivePairs(uniform)).toBe(naivePairs(clustered));
    expect(hashPairs(clustered, 2).candidates).toBeLessThan(naivePairs(clustered));
  });
});
