import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultAdventureSave, migrateAdventureSave } from "../src/demos/04-verified-glb-adventure/save";
import { desiredZoneIds, ZoneStreamer } from "../src/demos/04-verified-glb-adventure/streaming";
import { parseGlbJson, parseManifest, validateAssets } from "../src/demos/04-verified-glb-adventure/validate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = join(root, "public/assets/demos/04-verified-glb-adventure");

describe("demo 04 verified GLB pipeline", () => {
  it("validates generated files against the emitted manifest", async () => {
    const manifest = parseManifest(JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8")));
    const result = await validateAssets(manifest, async (uri) => {
      try {
        return new Uint8Array(readFileSync(join(root, "public", uri)));
      } catch {
        return null;
      }
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.facts.player?.animations).toContain("Walk");
      expect(result.facts.npc?.animations).toContain("Wave");
      expect(result.facts.player?.nodes).toContain("Player");
    }
  });

  it("fails visibly when a required asset is missing", async () => {
    const manifest = parseManifest(JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8")));
    const result = await validateAssets(manifest, async (uri) => {
      if (uri.endsWith("player.glb")) return null;
      return new Uint8Array(readFileSync(join(root, "public", uri)));
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.code === "missing" && issue.id === "player")).toBe(true);
    }
  });

  it("reads actual GLB node and clip names rather than guessing", () => {
    const bytes = new Uint8Array(readFileSync(join(assetDir, "npc.glb")));
    const parsed = parseGlbJson(bytes);
    expect(parsed.nodes).toEqual(["Npc"]);
    expect(parsed.animations).toEqual(["Wave"]);
  });
});

describe("demo 04 versioned save contract", () => {
  it("round-trips valid schema v3 data through validation", () => {
    const save = defaultAdventureSave();
    save.player = { x: 4.25, z: -2, yaw: 1.1, pitch: 0.25 };
    save.seed = 77;
    save.collected = true;
    save.activatedZones = ["central-environment"];
    expect(migrateAdventureSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it("refuses malformed and unsupported save payloads", () => {
    expect(() => migrateAdventureSave(null)).toThrow(/Empty save/);
    expect(() => migrateAdventureSave({ schemaVersion: 99 })).toThrow(/Unsupported save schema/);
    expect(() => migrateAdventureSave({
      schemaVersion: 3,
      player: { x: 1e9, z: 0, yaw: 0, pitch: 0 },
      seed: 1,
      activatedZones: []
    })).toThrow(/outside supported bounds/);
  });

  it("migrates schema 1 and schema 2 fixtures", () => {
    const v1 = migrateAdventureSave({ schemaVersion: 1, pos: { x: 3, z: 4 }, collected: true });
    expect(v1.schemaVersion).toBe(3);
    expect(v1.player.x).toBe(3);
    expect(v1.spoken).toBe(false);

    const v2 = migrateAdventureSave({ schemaVersion: 2, x: -2, z: 5, collected: false, spoken: true });
    expect(v2.schemaVersion).toBe(3);
    expect(v2.player.z).toBe(5);
    expect(v2.spoken).toBe(true);
  });
});

describe("demo 04 streamed-zone lifecycle", () => {
  const zones = [
    { id: "a", x: 0, z: 0, loadRadius: 3, retainRadius: 5 },
    { id: "b", x: 10, z: 0, loadRadius: 3, retainRadius: 5 }
  ];

  it("uses deterministic activation rules", () => {
    expect(desiredZoneIds(zones, 0, 0)).toEqual(["a"]);
    expect(desiredZoneIds(zones, 10, 0)).toEqual(["b"]);
    expect(desiredZoneIds(zones, 5, 0)).toEqual([]);
  });

  it("rejects a stale async load after the player leaves its retention boundary", async () => {
    let resolveLoad!: (value: { id: string }) => void;
    const pending = new Promise<{ id: string }>((resolve) => { resolveLoad = resolve; });
    const activated: string[] = [];
    const disposed: string[] = [];
    const streamer = new ZoneStreamer({
      zones: [zones[0]!],
      concurrency: 1,
      load: () => pending,
      activate: (zone) => activated.push(zone.id),
      deactivate: () => undefined,
      dispose: (zone) => disposed.push(zone.id)
    });

    streamer.update(0, 0);
    expect(streamer.snapshot()[0]?.state).toBe("loading");
    streamer.update(20, 0);
    resolveLoad({ id: "asset" });
    await pending;
    await Promise.resolve();
    await Promise.resolve();

    expect(activated).toEqual([]);
    expect(disposed).toEqual(["a"]);
    expect(streamer.snapshot()[0]?.state).toBe("idle");
    streamer.dispose();
  });

  it("deactivates and disposes an active zone outside retention", async () => {
    const events: string[] = [];
    const streamer = new ZoneStreamer({
      zones: [zones[0]!],
      load: async () => ({ id: "asset" }),
      activate: (zone) => events.push(`activate:${zone.id}`),
      deactivate: (zone) => events.push(`deactivate:${zone.id}`),
      dispose: (zone) => events.push(`dispose:${zone.id}`)
    });
    streamer.update(0, 0);
    await Promise.resolve();
    await Promise.resolve();
    expect(streamer.snapshot()[0]?.state).toBe("active");
    streamer.update(20, 0);
    expect(events).toEqual(["activate:a", "deactivate:a", "dispose:a"]);
    expect(streamer.snapshot()[0]?.state).toBe("idle");
    streamer.dispose();
  });
});
