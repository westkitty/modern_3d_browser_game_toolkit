import type { DemoDefinition } from "../shared/types";

export const DEMOS: readonly DemoDefinition[] = [
  {
    id: "01-tactics-table",
    number: "01",
    title: "Accessible Turn-Based 3D Tactics Table",
    route: "#/demo/01-tactics-table",
    renderPath: "threejs-webgl2",
    timingModel: "event",
    capability: "semantic DOM + localStorage",
    question:
      "When turns are player decisions, does a 3D board need a continuous simulation loop, or is render-on-demand plus accessible DOM the actual architecture?",
    status: "ready",
    load: () => import("../demos/01-tactics-table/index")
  },
  {
    id: "02-raycast-labyrinth",
    number: "02",
    title: "High-DPI Canvas 2D Ray-Cast Labyrinth",
    route: "#/demo/02-raycast-labyrinth",
    renderPath: "canvas2d-projected",
    timingModel: "variable",
    capability: "CanvasRenderingContext2D + Web Audio",
    question:
      "When the visual grammar is retro column-cast walls, is Canvas 2D simpler than a scene graph — and what does high-DPI resize actually reset?",
    status: "ready",
    load: () => import("../demos/02-raycast-labyrinth/index")
  },
  {
    id: "03-character-course",
    number: "03",
    title: "Fixed-Step Three.js Character Course",
    route: "#/demo/03-character-course",
    renderPath: "threejs-webgl2",
    timingModel: "fixed_interpolated",
    capability: "gamepad + custom collision",
    question:
      "Can a third-person controller stay stable across refresh rates without a physics engine, and can camera obstruction stay distinct from player collision?",
    status: "ready",
    load: () => import("../demos/03-character-course/index")
  },
  {
    id: "04-verified-glb-adventure",
    number: "04",
    title: "Verified-GLB Generated Adventure",
    route: "#/demo/04-verified-glb-adventure",
    renderPath: "threejs-webgl2",
    timingModel: "fixed_interpolated",
    capability: "asset manifest + IndexedDB",
    question:
      "Can a 3D adventure bind only to verified GLB facts — nodes, clips, hashes — instead of inventing asset metadata in runtime code?",
    status: "ready",
    load: () => import("../demos/04-verified-glb-adventure/index")
  },
  {
    id: "05-webgl-shader-arena",
    number: "05",
    title: "Raw WebGL2 Shader Arena",
    route: "#/demo/05-webgl-shader-arena",
    renderPath: "raw-webgl2",
    timingModel: "fixed_interpolated",
    capability: "explicit GPU ownership + postprocess",
    question:
      "When the product is shader and buffer ownership, what does a small WebGL2 renderer look like without becoming a home-grown Three.js?",
    status: "ready",
    load: () => import("../demos/05-webgl-shader-arena/index")
  },
  {
    id: "06-puzzle-museum",
    number: "06",
    title: "Accessible 3D Puzzle Museum",
    route: "#/demo/06-puzzle-museum",
    renderPath: "threejs-webgl2",
    timingModel: "event",
    capability: "semantic accessibility + reduced-motion",
    question:
      "If 3D is spatial presentation, can every required instruction and action live in semantic DOM so keyboard users complete every puzzle?",
    status: "ready",
    load: () => import("../demos/06-puzzle-museum/index")
  },
  {
    id: "07-ik-telemetry",
    number: "07",
    title: "IK Creature and CanvasTexture Telemetry Lab",
    route: "#/demo/07-ik-telemetry",
    renderPath: "hybrid",
    timingModel: "fixed_interpolated",
    capability: "inverse kinematics + CanvasTexture",
    question:
      "How do Canvas 2D telemetry plates enter a Three.js world without uploading unchanged textures every frame, and how does a verified rig fail honestly?",
    status: "ready",
    load: () => import("../demos/07-ik-telemetry/index")
  },
  {
    id: "08-crowd-lab",
    number: "08",
    title: "Instancing and Broadphase Crowd Lab",
    route: "#/demo/08-crowd-lab",
    renderPath: "threejs-webgl2",
    timingModel: "fixed",
    capability: "measured instancing + spatial hash",
    question:
      "Do instancing and a spatial broadphase actually help this crowd, in this distribution, or are they premature optimizations until measured?",
    status: "ready",
    load: () => import("../demos/08-crowd-lab/index")
  },
  {
    id: "09-strategy-globe",
    number: "09",
    title: "Offline Hybrid Strategy Globe",
    route: "#/demo/09-strategy-globe",
    renderPath: "hybrid",
    timingModel: "event",
    capability: "Three.js + Canvas 2D minimap + IndexedDB",
    question:
      "Can one authoritative campaign state drive a globe, a Canvas minimap, and semantic DOM without deriving truth from pixels or meshes?",
    status: "ready",
    load: () => import("../demos/09-strategy-globe/index")
  },
  {
    id: "10-gpu-field",
    number: "10",
    title: "Cross-Origin-Isolated GPU Field Simulator",
    route: "#/demo/10-gpu-field",
    renderPath: "raw-webgpu",
    timingModel: "fixed_interpolated",
    capability: "raw WebGPU + conditional SharedArrayBuffer",
    question:
      "When GPU compute is the architecture, what is an honest unsupported path, and when does SharedArrayBuffer actually beat transferable buffers?",
    status: "ready",
    load: () => import("../demos/10-gpu-field/index")
  }
];

export function getDemo(id: string): DemoDefinition | undefined {
  return DEMOS.find((demo) => demo.id === id);
}

export function demoIds(): string[] {
  return DEMOS.map((demo) => demo.id);
}
