import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/demos/10-gpu-field");

describe("demo 10 webgpu field", () => {
  it("does not import Three.js", () => {
    for (const name of readdirSync(dir).filter((item) => item.endsWith(".ts"))) {
      expect(readFileSync(join(dir, name), "utf8")).not.toMatch(/from\s+["']three["']/);
    }
  });
});
