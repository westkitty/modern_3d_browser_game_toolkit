/// <reference types="vite/client" />

interface Window {
  __DEMO_STATUS__?: {
    id: string | null;
    state: "idle" | "loading" | "ready" | "error" | "unsupported";
    detail?: string;
  };
  __LAUNCHER_DIAGNOSTICS__?: {
    activeDemoId: string | null;
    activeLoopOwners: number;
  };
}
