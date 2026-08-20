import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEMOS, demoIds, getDemo } from "../src/launcher/registry";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("demo registry", () => {
  it("registers exactly ten canonical demonstrations", () => {
    expect(DEMOS).toHaveLength(10);
    expect(demoIds()).toEqual([
      "01-tactics-table",
      "02-raycast-labyrinth",
      "03-character-course",
      "04-verified-glb-adventure",
      "05-webgl-shader-arena",
      "06-puzzle-museum",
      "07-ik-telemetry",
      "08-crowd-lab",
      "09-strategy-globe",
      "10-gpu-field"
    ]);
  });

  it("marks every canonical demo ready after phase 10", () => {
    expect(DEMOS.every((demo) => demo.status === "ready")).toBe(true);
  });

  it("keeps unique routes and renderer identities", () => {
    const routes = new Set(DEMOS.map((demo) => demo.route));
    expect(routes.size).toBe(10);
    expect(getDemo("02-raycast-labyrinth")?.renderPath).toBe("canvas2d-projected");
    expect(getDemo("05-webgl-shader-arena")?.renderPath).toBe("raw-webgl2");
    expect(getDemo("10-gpu-field")?.renderPath).toBe("raw-webgpu");
  });

  it("pairs each demo with an architecture contract", () => {
    for (const demo of DEMOS) {
      const contractPath = join(
        root,
        "src/demos",
        demo.id,
        "architecture.project.json"
      );
      const contract = JSON.parse(readFileSync(contractPath, "utf8")) as {
        renderPath: string;
        timingModel: string;
        status: string;
      };
      expect(contract.renderPath).toBe(demo.renderPath);
      expect(contract.timingModel).toBe(demo.timingModel);
      expect(contract.status).toBe(demo.status);
    }
  });

  it("does not present the launcher as a single renderer contract", () => {
    const demosDir = join(root, "src/demos");
    const dirs = readdirSync(demosDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(dirs).toHaveLength(10);
    const paths = new Set(
      dirs.map((id) => {
        const contract = JSON.parse(
          readFileSync(join(demosDir, id, "architecture.project.json"), "utf8")
        ) as { renderPath: string };
        return contract.renderPath;
      })
    );
    expect(paths.size).toBeGreaterThan(1);
  });
});
