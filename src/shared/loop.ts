/**
 * Shared loop helpers. Demos own their own timing policy;
 * this module only tracks ownership so the launcher can detect leaks.
 */

let activeLoopOwners = 0;

export function getActiveLoopOwners(): number {
  return activeLoopOwners;
}

export interface FrameLoop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export interface DemandRenderer {
  request(): void;
  dispose(): void;
  readonly pending: boolean;
}

export function createFrameLoop(
  onFrame: (dtSeconds: number, nowMs: number) => void,
  options?: { maxDeltaSeconds?: number }
): FrameLoop {
  const maxDelta = options?.maxDeltaSeconds ?? 0.25;
  let raf = 0;
  let running = false;
  let last = 0;

  const tick = (now: number): void => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(Math.max((now - last) / 1000, 0), maxDelta);
    last = now;
    onFrame(dt, now);
  };

  return {
    get running() {
      return running;
    },
    start() {
      if (running) return;
      running = true;
      activeLoopOwners += 1;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      activeLoopOwners = Math.max(0, activeLoopOwners - 1);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/**
 * Render-on-demand: schedules at most one rAF while dirty.
 * Used by event-driven demos that must idle without a continuous loop.
 */
export function createDemandRenderer(render: () => void): DemandRenderer {
  let raf = 0;
  let dirty = false;
  let disposed = false;
  let counted = false;

  const tick = (): void => {
    raf = 0;
    if (disposed || !dirty) {
      if (counted) {
        activeLoopOwners = Math.max(0, activeLoopOwners - 1);
        counted = false;
      }
      return;
    }
    dirty = false;
    render();
    if (dirty && !disposed) {
      raf = requestAnimationFrame(tick);
    } else if (counted) {
      activeLoopOwners = Math.max(0, activeLoopOwners - 1);
      counted = false;
    }
  };

  return {
    get pending() {
      return dirty || raf !== 0;
    },
    request() {
      if (disposed) return;
      dirty = true;
      if (raf === 0) {
        if (!counted) {
          activeLoopOwners += 1;
          counted = true;
        }
        raf = requestAnimationFrame(tick);
      }
    },
    dispose() {
      disposed = true;
      dirty = false;
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (counted) {
        activeLoopOwners = Math.max(0, activeLoopOwners - 1);
        counted = false;
      }
    }
  };
}

export interface FixedStepLoop {
  start(): void;
  stop(): void;
  injectFrame(dtSeconds: number): { steps: number; remainder: number };
  readonly running: boolean;
}

/**
 * Fixed simulation with interpolation alpha and a hard catch-up cap.
 * Injected long frames cannot run unbounded ticks.
 */
export function createFixedStepLoop(options: {
  stepSeconds?: number;
  maxSteps?: number;
  maxFrameSeconds?: number;
  simulate: (stepSeconds: number) => void;
  render: (alpha: number, dtSeconds: number) => void;
}): FixedStepLoop {
  const step = options.stepSeconds ?? 1 / 60;
  const maxSteps = options.maxSteps ?? 5;
  const maxFrame = options.maxFrameSeconds ?? 0.25;
  let raf = 0;
  let running = false;
  let last = 0;
  let accumulator = 0;

  const advance = (frameSeconds: number): { steps: number; remainder: number } => {
    accumulator += Math.min(frameSeconds, maxFrame);
    let steps = 0;
    while (accumulator >= step && steps < maxSteps) {
      options.simulate(step);
      accumulator -= step;
      steps += 1;
    }
    if (steps === maxSteps) accumulator = 0;
    const alpha = accumulator / step;
    options.render(alpha, frameSeconds);
    return { steps, remainder: accumulator };
  };

  const tick = (now: number): void => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = (now - last) / 1000;
    last = now;
    advance(dt);
  };

  return {
    get running() {
      return running;
    },
    start() {
      if (running) return;
      running = true;
      activeLoopOwners += 1;
      last = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      activeLoopOwners = Math.max(0, activeLoopOwners - 1);
      cancelAnimationFrame(raf);
      raf = 0;
      accumulator = 0;
    },
    injectFrame(dtSeconds: number) {
      return advance(dtSeconds);
    }
  };
}
