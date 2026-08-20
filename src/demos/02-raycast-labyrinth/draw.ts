import type { CanvasRestoreState } from "./canvasState";
import type { FrameCast } from "./raycast";

export function drawLabyrinth(
  ctx: CanvasRenderingContext2D,
  frame: FrameCast,
  cssWidth: number,
  cssHeight: number,
  state: CanvasRestoreState,
  hud: string
): void {
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = state.imageSmoothingEnabled;
  ctx.globalCompositeOperation = state.globalCompositeOperation;
  ctx.font = state.font;
  ctx.textBaseline = state.textBaseline;
  ctx.lineWidth = state.lineWidth;

  ctx.fillStyle = "#0a1522";
  ctx.fillRect(0, 0, cssWidth, cssHeight / 2);
  ctx.fillStyle = "#12100e";
  ctx.fillRect(0, cssHeight / 2, cssWidth, cssHeight / 2);

  for (const column of frame.walls) {
    const shade = 1 / (1 + column.distance * 0.22);
    const ns = column.side === 1 ? 0.62 : 1;
    const value = Math.floor(40 + 150 * shade * ns);
    ctx.fillStyle = `rgb(${value},${value + 8},${value + 18})`;
    const y = (cssHeight - column.height) / 2;
    ctx.fillRect(column.x, y, 1, column.height);
  }

  for (const billboard of frame.billboards) {
    if (billboard.occluded) continue;
    const size = Math.max(6, Math.min(billboard.size, cssHeight));
    const x = billboard.screenX - size / 2;
    const y = (cssHeight - size) / 2;
    ctx.fillStyle = billboard.sprite.kind === "orb" ? "#7dd3fc" : "#f0a3a3";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, size * 0.22, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#e8eef6";
  ctx.fillText(hud, 10, 10);
}
