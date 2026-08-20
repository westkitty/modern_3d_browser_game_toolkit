import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { migrateAdventureSave } from "../src/demos/04-verified-glb-adventure/save";
import {
  parseGlbJson,
  parseManifest,
  validateAssets
} from "../src/demos/04-verified-glb-adventure/validate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = join(root, "public/assets/demos/04-verified-glb-adventure");

describe("demo 04 verified GLB pipeline", () => {
  it("validates generated files against the emitted manifest", async () => {
    const manifest = parseManifest(
      JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8"))
    );
    const result = await validateAssets(manifest, async (uri) => {
      const file = join(root, "public", uri);
      try {
        return new Uint8Array(readFileSync(file));
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
    const manifest = parseManifest(
      JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8"))
    );
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

  it("migrates schema 1 saves", () => {
    const next = migrateAdventureSave({ schemaVersion: 1, pos: { x: 3, z: 4 }, collected: true });
    expect(next.schemaVersion).toBe(2);
    expect(next.x).toBe(3);
    expect(next.spoken).toBe(false);
  });
});
