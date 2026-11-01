import { describe, expect, it } from "vitest";
import { twoBoneIk } from "../src/demos/07-ik-telemetry/ik";
import { writePlate, type TelemetryPlate } from "../src/demos/07-ik-telemetry/telemetry";

describe("demo 07 IK", () => {
  it("stays numerically finite for required poses", () => {
    const origin = { x: 0, y: 0 };
    const poses = [
      { x: 1.2, y: 0.2 },
      { x: 8, y: 8 },
      { x: 0.1, y: 0 },
      { x: 0, y: 0 },
      { x: 1.2, y: 0.2 }
    ];
    const signs = [1, 1, 1, 1, -1];
    poses.forEach((target, index) => {
      const ik = twoBoneIk(origin, target, 1.1, 1.0, signs[index]);
      expect(Number.isFinite(ik.angleA)).toBe(true);
      expect(Number.isFinite(ik.angleB)).toBe(true);
      expect(Number.isFinite(ik.end.x)).toBe(true);
    });
  });

  it("enforces both reach bounds and segment geometry", () => {
    const origin = { x: 0, y: 0 };
    const near = twoBoneIk(origin, { x: 0.01, y: 0 }, 1.1, 1);
    expect(near.reachable).toBe(false);
    expect(Math.hypot(near.end.x, near.end.y)).toBeCloseTo(0.1);
    const far = twoBoneIk(origin, { x: 4, y: 0 }, 1.1, 1);
    expect(far.reachable).toBe(false);
    expect(Math.hypot(far.end.x, far.end.y)).toBeCloseTo(2.1);
    const mirrored = twoBoneIk(origin, { x: 1.2, y: 0.2 }, 1.1, 1, -1);
    expect(Math.hypot(mirrored.b.x, mirrored.b.y)).toBeCloseTo(1.1);
    expect(Math.hypot(mirrored.end.x - mirrored.b.x, mirrored.end.y - mirrored.b.y)).toBeCloseTo(1);
    expect(() => twoBoneIk(origin, { x: 1, y: 0 }, NaN, 1)).toThrow();
    expect(() => twoBoneIk(origin, { x: 1, y: 0 }, 0, 1)).toThrow();
  });

  it("does not mark unchanged telemetry as dirty", () => {
    const plate: TelemetryPlate = {
      canvas: {} as HTMLCanvasElement,
      ctx: {
        fillStyle: "",
        font: "",
        textBaseline: "top",
        fillRect() {},
        fillText() {}
      } as unknown as CanvasRenderingContext2D,
      last: "",
      width: 128,
      height: 64
    };
    expect(writePlate(plate, "same")).toBe(true);
    expect(writePlate(plate, "same")).toBe(false);
  });
});
