export interface TelemetryPlate {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  last: string;
  width: number;
  height: number;
}

export function createPlate(width = 128, height = 64): TelemetryPlate {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D required for telemetry plates.");
  return { canvas, ctx, last: "", width, height };
}

export function writePlate(plate: TelemetryPlate, text: string): boolean {
  if (plate.last === text) return false;
  plate.last = text;
  const { ctx, width, height } = plate;
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#e8eef6";
  ctx.font = "12px ui-monospace";
  ctx.textBaseline = "top";
  ctx.fillText(text, 8, 10);
  return true;
}
