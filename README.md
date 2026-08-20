# Modern 3D Browser Game Toolkit — Demo Launcher

One hash-routed launcher containing **ten independently runnable architectural demonstrations** derived from the Modern 3D Browser Game Architecture Toolkit v1.1.

The launcher is not a game engine. It is a catalog with a strict lifecycle host: only one demonstration may own rendering and input resources at a time.

Governing principle: **the game’s requirements determine the architecture.**

## Status (Phase 0)

The launcher foundation is implemented. All ten cards are registered. Demonstration gameplay is **not built** yet; each route currently mounts a placeholder that declares its architecture contract.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Vite + TypeScript launcher, routing, lifecycle host | in progress in this commit |
| 1–10 | Canonical demonstrations 01–10 | not built |
| 11 | Cross-demo validation and polish | not started |

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

Pinned versions live in `package-lock.json` after install. Do not treat this README as a substitute for the lockfile.

## Ten-demo matrix

| # | Route | Renderer | Timing | Status |
| --- | --- | --- | --- | --- |
| 01 | `#/demo/01-tactics-table` | Three.js WebGL2 + semantic DOM | event / render-on-demand | not built |
| 02 | `#/demo/02-raycast-labyrinth` | CanvasRenderingContext2D projected | variable | not built |
| 03 | `#/demo/03-character-course` | Three.js WebGL2 | fixed interpolated | not built |
| 04 | `#/demo/04-verified-glb-adventure` | Three.js WebGL2 + verified GLB | fixed interpolated | not built |
| 05 | `#/demo/05-webgl-shader-arena` | raw WebGL2, no Three.js | fixed interpolated | not built |
| 06 | `#/demo/06-puzzle-museum` | Three.js WebGL2 + semantic DOM | event | not built |
| 07 | `#/demo/07-ik-telemetry` | Three.js + Canvas 2D textures | fixed interpolated | not built |
| 08 | `#/demo/08-crowd-lab` | Three.js, instancing off until measured | fixed | not built |
| 09 | `#/demo/09-strategy-globe` | Three.js + Canvas 2D + DOM | event | not built |
| 10 | `#/demo/10-gpu-field` | raw WebGPU, no Three.js | fixed interpolated | not built |

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
