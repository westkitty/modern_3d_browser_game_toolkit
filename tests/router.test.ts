import { describe, expect, it } from "vitest";
import { demoHash, homeHash, parseHash } from "../src/shared/router";

describe("parseHash", () => {
  it("maps empty and root hashes to home", () => {
    expect(parseHash("")).toEqual({ kind: "home" });
    expect(parseHash("#")).toEqual({ kind: "home" });
    expect(parseHash("#/")).toEqual({ kind: "home" });
  });

  it("parses demo routes", () => {
    expect(parseHash("#/demo/01-tactics-table")).toEqual({
      kind: "demo",
      id: "01-tactics-table"
    });
  });

  it("rejects unknown shapes", () => {
    expect(parseHash("#/nope")).toEqual({ kind: "unknown", hash: "#/nope" });
    expect(parseHash("#/demo/")).toEqual({ kind: "unknown", hash: "#/demo/" });
  });

  it("builds canonical hashes", () => {
    expect(homeHash()).toBe("#/");
    expect(demoHash("10-gpu-field")).toBe("#/demo/10-gpu-field");
  });
});
