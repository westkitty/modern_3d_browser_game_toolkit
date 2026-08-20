import { getActiveLoopOwners } from "./loop";

export function publishDiagnostics(activeDemoId: string | null): void {
  window.__LAUNCHER_DIAGNOSTICS__ = {
    activeDemoId,
    activeLoopOwners: getActiveLoopOwners()
  };
}

export function publishDemoStatus(
  id: string | null,
  state: "idle" | "loading" | "ready" | "error" | "unsupported",
  detail?: string
): void {
  window.__DEMO_STATUS__ = { id, state, ...(detail !== undefined ? { detail } : {}) };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
