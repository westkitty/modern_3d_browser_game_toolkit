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
