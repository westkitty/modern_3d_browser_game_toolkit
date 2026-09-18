# Modern 3D Browser Game Toolkit — Demo Launcher

One hash-routed launcher containing **ten independently runnable architectural demonstrations** derived from the Modern 3D Browser Game Architecture Toolkit v1.1.

The launcher is not a game engine. It is a catalog with a strict lifecycle host: only one demonstration may own rendering and input resources at a time.

Governing principle: **the game’s requirements determine the architecture.**

## Status

All ten canonical demonstrations are implemented. Phase 12 adds bounded production-reference systems while preserving the ten-demo architecture and evidence discipline.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Vite + TypeScript launcher, routing, lifecycle host | complete |
| 1 | Accessible Turn-Based 3D Tactics Table | complete |
| 2 | High-DPI Canvas 2D Ray-Cast Labyrinth | complete |
| 3 | Fixed-Step Three.js Character Course | complete |
| 4 | Verified-GLB Generated Adventure | complete |
| 5 | Raw WebGL2 Shader Arena | complete |
| 6 | Accessible 3D Puzzle Museum | complete |
| 7 | IK Creature and CanvasTexture Telemetry | complete |
| 8 | Instancing and Broadphase Crowd Lab | complete |
| 9 | Offline Hybrid Strategy Globe | complete |
| 10 | Cross-Origin-Isolated GPU Field Simulator | complete |
| 11 | Integration, validation, documentation | complete |
| 12 | Production reference systems | in this commit |

## Production reference systems

The launcher still contains exactly ten independent architectural demonstrations. Production concerns are taught where they naturally belong rather than through a new engine layer:

- **Demo 03** owns the first-person kinematic reference: 60 Hz fixed-step movement, acceleration/deceleration, gravity/jump, collision/step handling, pointer-lock mouse look, coarse-pointer touch controls, focus-loss clearing and explicit teardown.
- **Demo 04** owns persistence and streaming: schema-v3 IndexedDB saves with v1/v2 migration and validation, explicit Save/Load/Clear controls, deterministic streamed-zone activation, bounded one-at-a-time loading, stale-load rejection, unload disposal and local fallback geometry.
- **Demo 08** owns comparative performance evidence: baseline, movement/collision, streamed-zone churn, resource mount/unmount churn and crowd/broadphase scenarios with raw frame/update/render-call samples plus Three.js draw, triangle and renderer-memory counters.
- **Shared resource instrumentation** counts production-reference runtime, scene, geometry, material, texture, listener and streamed-zone ownership from actual acquire/release operations. Counts are not device-performance claims.

Physical touch feel and device-specific frame behavior still require representative hardware. No FPS guarantee is asserted.

## Installation

```bash
cd /Users/andrew/modern_3d_browser_game_toolkit
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. Hash routes work on static hosting.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck, then production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run generate:demo04` | Rebuild demo 04 GLBs and the emitted manifest |

Pinned versions live in `package-lock.json` after install. Do not treat this README as a substitute for the lockfile.

## Ten-demo matrix

| # | Route | Renderer | Timing | Status |
| --- | --- | --- | --- | --- |
| 01 | `#/demo/01-tactics-table` | Three.js WebGL2 + semantic DOM | event / render-on-demand | ready |
| 02 | `#/demo/02-raycast-labyrinth` | CanvasRenderingContext2D projected | variable | ready |
| 03 | `#/demo/03-character-course` | Three.js WebGL2 | fixed interpolated | ready · first-person/touch reference |
| 04 | `#/demo/04-verified-glb-adventure` | Three.js WebGL2 + verified GLB | fixed interpolated | ready · save/stream reference |
| 05 | `#/demo/05-webgl-shader-arena` | raw WebGL2, no Three.js | fixed interpolated | ready |
| 06 | `#/demo/06-puzzle-museum` | Three.js WebGL2 + semantic DOM | event | ready |
| 07 | `#/demo/07-ik-telemetry` | Three.js + Canvas 2D textures | fixed interpolated | ready |
| 08 | `#/demo/08-crowd-lab` | Three.js comparative stress lab | fixed | ready · performance reference |
| 09 | `#/demo/09-strategy-globe` | Three.js + Canvas 2D + DOM | event | ready |
| 10 | `#/demo/10-gpu-field` | raw WebGPU, no Three.js | fixed interpolated | ready |

These four rendering paths are intentionally not collapsed:

- **Three.js** when scene/camera/material/loader convenience is the product need
- **Canvas 2D** (`CanvasRenderingContext2D`) when the projection model is deliberately constrained
- **raw WebGL2** when GPU state ownership is the demonstration
- **raw WebGPU** when compute/buffer ownership is the demonstration

An HTML `<canvas>` element is only a surface. It does not imply Canvas 2D, WebGL, or WebGPU.

## Browser capability notes

- The launcher itself needs a current Chromium, Firefox, or Safari with ES modules.
- Demo 10 requires WebGPU and will report an explicit unsupported state when the adapter is absent.
- SharedArrayBuffer is not activated in Phase 0. If later activated, it requires cross-origin isolation headers and `window.crossOriginIsolated === true`.
- Local `npm run dev` success is not evidence of an arbitrary production host configuration.

## Accessibility

The catalog is semantic HTML. Cards are keyboard reachable. `Tab` moves through launch controls, arrow keys move between cards when a launch control is focused, and `Escape` returns from a demonstration to the catalog. Visible `:focus-visible` styles are required on launcher chrome.

## Architecture and evidence

See:

- `docs/ARCHITECTURE.md`
- `docs/VALIDATION_MATRIX.md`
- `docs/PHASE_LOG.md`
- per-demo `src/demos/<id>/architecture.project.json`

Evidence labels in the validation matrix are not upgraded merely because source files exist.

The original handbook document is preserved at `MODERN_3D_BROWSER_GAME_ARCHITECTURE_TOOLKIT_OPTIMIZED_V1_1.docx`.
