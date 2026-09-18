export type ResourceKind =
  | "runtime"
  | "scene"
  | "geometry"
  | "material"
  | "texture"
  | "listener"
  | "streamedZone";

export interface ResourceSnapshot {
  runtime: number;
  scene: number;
  geometry: number;
  material: number;
  texture: number;
  listener: number;
  streamedZone: number;
}

const counts: ResourceSnapshot = {
  runtime: 0,
  scene: 0,
  geometry: 0,
  material: 0,
  texture: 0,
  listener: 0,
  streamedZone: 0
};

export function resourceSnapshot(): ResourceSnapshot {
  return { ...counts };
}

function add(kind: ResourceKind, delta: number): void {
  counts[kind] = Math.max(0, counts[kind] + delta);
}

export interface ResourceScope {
  own(kind: ResourceKind, disposer?: () => void): () => void;
  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
  dispose(): void;
  readonly disposed: boolean;
}

export function createResourceScope(): ResourceScope {
  const releases: Array<() => void> = [];
  let disposed = false;

  const own = (kind: ResourceKind, disposer?: () => void): (() => void) => {
    add(kind, 1);
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      try {
        disposer?.();
      } finally {
        add(kind, -1);
      }
    };
    releases.push(release);
    return release;
  };

  return {
    get disposed() {
      return disposed;
    },
    own,
    listen(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      own("listener", () => target.removeEventListener(type, listener, options));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (let index = releases.length - 1; index >= 0; index -= 1) releases[index]?.();
      releases.length = 0;
    }
  };
}
