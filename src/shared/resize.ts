export interface ResizeHandle {
  disconnect(): void;
  readonly width: number;
  readonly height: number;
}

export function observeElementSize(
  element: HTMLElement,
  onSize: (width: number, height: number) => void
): ResizeHandle {
  let width = 0;
  let height = 0;

  const apply = (): void => {
    const nextWidth = Math.max(1, Math.floor(element.clientWidth));
    const nextHeight = Math.max(1, Math.floor(element.clientHeight));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    onSize(width, height);
  };

  const observer = new ResizeObserver(() => apply());
  observer.observe(element);
  apply();

  return {
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    disconnect() {
      observer.disconnect();
    }
  };
}

export function cappedDevicePixelRatio(cap = 2): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.min(Math.max(dpr, 1), cap);
}
