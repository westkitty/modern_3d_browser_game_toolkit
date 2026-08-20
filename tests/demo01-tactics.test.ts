import { describe, expect, it } from "vitest";
import {
  createBattle,
  reachableTiles,
  reduce,
  snapshotGameplay,
  unitById
} from "../src/demos/01-tactics-table/game";
import { STORAGE_KEY, loadSave, writeSave } from "../src/demos/01-tactics-table/persist";

describe("demo 01 tactics table", () => {
  it("completes a unit action from commands only (keyboard-equivalent)", () => {
    let state = createBattle();
    const before = snapshotGameplay(state);
    state = reduce(state, { type: "select-unit", id: "p-ranger" });
    state = reduce(state, { type: "choose-action", action: "move" });
    const ranger = unitById(state, "p-ranger");
    expect(ranger).toBeTruthy();
    const tile = reachableTiles(state, ranger!).find((item) => item.x !== ranger!.x || item.y !== ranger!.y);
    expect(tile).toBeTruthy();
    state = reduce(state, { type: "choose-tile", x: tile!.x, y: tile!.y });
    const moved = unitById(state, "p-ranger")!;
    expect(moved.x).toBe(tile!.x);
    expect(moved.y).toBe(tile!.y);
    expect(moved.acted).toBe(true);
    expect(state.units.map((unit) => ({ id: unit.id, x: unit.x, y: unit.y }))).not.toEqual(
      before.units.map((unit) => ({ id: unit.id, x: unit.x, y: unit.y }))
    );
  });

  it("finishes a player round without pointer commands", () => {
    let state = createBattle();
    for (const id of ["p-ranger", "p-guardian", "p-operative"]) {
      state = reduce(state, { type: "select-unit", id });
      state = reduce(state, { type: "choose-action", action: "wait" });
    }
    expect(state.turn).toBe(2);
    expect(state.phase).toBe("select-unit");
    expect(state.log.some((line) => line.includes("Enemy phase"))).toBe(true);
  });

  it("keeps gameplay snapshots independent of camera pose", () => {
    const state = createBattle();
    const snap = snapshotGameplay(state);
    expect(snap).not.toHaveProperty("yaw");
    expect(JSON.stringify(snap)).toBe(JSON.stringify(state));
    expect("camera" in state).toBe(false);
  });

  it("round-trips a versioned localStorage envelope", () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      }
    } as unknown as Storage;
    const battle = createBattle();
    writeSave(
      {
        schemaVersion: 1,
        camera: { yaw: 1.2, pitch: 0.8, distance: 11 },
        campaign: { battlesStarted: 4, battlesWon: 2 },
        battle
      },
      storage
    );
    const loaded = loadSave(storage.getItem(STORAGE_KEY));
    expect(loaded.save.campaign.battlesWon).toBe(2);
    expect(loaded.save.camera.yaw).toBeCloseTo(1.2);
    expect(loaded.save.battle.units).toHaveLength(battle.units.length);
  });

  it("resets unreadable saves instead of inventing a board", () => {
    const { save, notice } = loadSave("{not json");
    expect(notice).toMatch(/unreadable/i);
    expect(save.schemaVersion).toBe(1);
    expect(save.battle.units.length).toBeGreaterThan(0);
  });
});
