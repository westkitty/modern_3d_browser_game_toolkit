import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COLOR_FS, COLOR_VS } from "../src/demos/05-webgl-shader-arena/shaders";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/demos/05-webgl-shader-arena");

describe("demo 05 raw WebGL2", () => {
  it("does not import Three.js", () => {
    for (const name of readdirSync(dir).filter((item) => item.endsWith(".ts"))) {
      const source = readFileSync(join(dir, name), "utf8");
      expect(source).not.toMatch(/from\s+["']three["']/);
    }
  });

  it("keeps shader sources as inspectable GLSL", () => {
    expect(COLOR_VS).toContain("#version 300 es");
    expect(COLOR_FS).toContain("outColor");
  });
});
