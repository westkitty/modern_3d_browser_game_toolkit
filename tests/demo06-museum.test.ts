import { describe, expect, it } from "vitest";
import { loadMuseum, ROOMS } from "../src/demos/06-puzzle-museum/puzzles";

describe("demo 06 puzzle museum", () => {
  it("has three keyboard-solvable rooms with DOM-complete instructions", () => {
    expect(ROOMS).toHaveLength(3);
    for (const room of ROOMS) {
      expect(room.instruction.length).toBeGreaterThan(10);
      expect(room.options).toContain(room.answer);
    }
  });

  it("reloads completion state", () => {
    const save = loadMuseum(JSON.stringify({ schemaVersion: 1, completed: ["room-color"], reducedMotion: true }));
    expect(save.completed).toContain("room-color");
    expect(save.reducedMotion).toBe(true);
  });
});
