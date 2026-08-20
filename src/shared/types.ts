export type DemoStatusState = "idle" | "loading" | "ready" | "error" | "unsupported";

export interface DemoStatus {
  state: DemoStatusState;
  detail?: string;
}

export interface DemoContext {
  demoId: string;
  reducedMotion: boolean;
  announce: (message: string) => void;
  setStatus: (status: DemoStatus) => void;
}

export interface DemoHandle {
  dispose(): void | Promise<void>;
}

export interface DemoModule {
  mount(host: HTMLElement, context: DemoContext): Promise<DemoHandle> | DemoHandle;
}

export type RenderPath =
  | "canvas2d-projected"
  | "threejs-webgl2"
  | "threejs-webgpu"
  | "raw-webgl2"
  | "raw-webgpu"
  | "hybrid"
  | "existing-engine";

export type TimingModel = "event" | "variable" | "fixed" | "fixed_interpolated";

export type DemoBuildStatus = "not-built" | "ready";

export interface DemoDefinition {
  id: string;
  number: string;
  title: string;
  route: string;
  renderPath: RenderPath;
  timingModel: TimingModel;
  capability: string;
  question: string;
  status: DemoBuildStatus;
  load: () => Promise<DemoModule>;
}

export type Route =
  | { kind: "home" }
  | { kind: "demo"; id: string }
  | { kind: "unknown"; hash: string };
