import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { restoreCanvas2d } from "../src/demos/02-raycast-labyrinth/canvasState";
import { createWorld, spawnPlayer, tryMove } from "../src/demos/02-raycast-labyrinth/map";
import { castFrame, visibleBillboards } from "../src/demos/02-raycast-labyrinth/raycast";

const demoRoot = join(dirname(fileURLToPath(import.meta.url)), "../src/demos/02-raycast-labyrinth");

describe("demo 02 canvas raycast", () => {
  it("does not import Three.js", () => {
    const files = readdirSync(demoRoot).filter((name) => name.endsWith(".ts"));
    for (const name of files) {
      const source = readFileSync(join(demoRoot, name), "utf8");
      expect(source).not.toMatch(/from\s+["']three["']/);
      expect(source).not.toMatch(/from\s+["']three\//);
    }
  });

  it("blocks movement into walls using the map, not pixels", () => {
    const world = createWorld();
    const player = spawnPlayer();
    const blocked = tryMove(world, player, 0, 4);
    expect(blocked.y).toBeLessThan(player.y + 4);
  });

  it("marks sprites behind walls as occluded", () => {
    const world = createWorld();
    world.sprites = [{ id: "hidden", kind: "orb", x: 2.5, y: 1.5, collected: false }];
    const player = { ...spawnPlayer(), x: 2.5, y: 7.5, dirX: 0, dirY: -1, planeX: 0.66, planeY: 0 };
    const frame = castFrame(world, player, 160, 90);
    const visible = visibleBillboards(frame);
    expect(frame.billboards.length).toBeGreaterThan(0);
    expect(visible.length).toBe(0);
  });

  it("restores Canvas 2D state after a backing-store resize", () => {
    const ctx = {
      imageSmoothingEnabled: true,
      globalCompositeOperation: "multiply",
      font: "99px serif",
      textBaseline: "bottom",
      lineWidth: 9,
      setTransform() {
        /* reset equivalent */
      }
    } as unknown as CanvasRenderingContext2D;
    const restored = restoreCanvas2d(ctx, 2, 40, 20);
    expect(restored.imageSmoothingEnabled).toBe(false);
    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(ctx.font).toContain("12px");
    expect(ctx.globalCompositeOperation).toBe("source-over");
    expect(ctx.textBaseline).toBe("top");
    expect(ctx.lineWidth).toBe(1);
  });
});
