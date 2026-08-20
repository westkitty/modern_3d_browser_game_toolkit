export interface CanvasRestoreState {
  dpr: number;
  cssWidth: number;
  cssHeight: number;
  imageSmoothingEnabled: boolean;
  globalCompositeOperation: GlobalCompositeOperation;
  font: string;
  textBaseline: CanvasTextBaseline;
  lineWidth: number;
}

export function restoreCanvas2d(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  cssWidth: number,
  cssHeight: number
): CanvasRestoreState {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.lineWidth = 1;
  return snapshotCanvas2d(ctx, dpr, cssWidth, cssHeight);
}

export function snapshotCanvas2d(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  cssWidth: number,
  cssHeight: number
): CanvasRestoreState {
  return {
    dpr,
    cssWidth,
    cssHeight,
    imageSmoothingEnabled: ctx.imageSmoothingEnabled,
    globalCompositeOperation: ctx.globalCompositeOperation,
    font: ctx.font,
    textBaseline: ctx.textBaseline,
    lineWidth: ctx.lineWidth
  };
}

export function resizeCanvas2d(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  dpr: number
): CanvasRestoreState {
  const width = Math.max(1, Math.floor(cssWidth * dpr));
  const height = Math.max(1, Math.floor(cssHeight * dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  return restoreCanvas2d(ctx, dpr, cssWidth, cssHeight);
}

export function canvasLocalPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { u: number; v: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    u: rect.width === 0 ? 0 : (clientX - rect.left) / rect.width,
    v: rect.height === 0 ? 0 : (clientY - rect.top) / rect.height
  };
}
