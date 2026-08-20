# Phase log

## Phase 3 — Fixed-Step Three.js Character Course

- **Previous commit SHA:** `85f21905276435e271c50a776124ea12cfc34ea2`
- **Completed scope:**
  - Capsule controller, jump, moving platform, hazard, respawn
  - Keyboard + gamepad sampling with scaled radial deadzone
  - Fixed 60 Hz step, max 5 catch-up steps, interpolated visuals
  - Respawn snaps previous/current transforms
  - Camera follow with a separate obstruction test
  - Jump blip via Web Audio after a key activation
- **Validation performed:**
  - `npm run typecheck` and `npm test` (catch-up cap, teleport snap, disconnected gamepad, movement)
  - Chrome SwiftShader screenshot: capsule, pads, hazard, READY
- **Unsupported / unverified behavior:**
  - Physical gamepad hardware not attached
  - Camera obstruction was unit-tested as a helper and visually composed; a wall-penetration playtest on a high-refresh display was not recorded
- **Architectural decisions:**
  - No physics engine; AABB/capsule tests only
  - Gameplay transforms remain outside Three.js nodes

## Phase 2 — High-DPI Canvas 2D Ray-Cast Labyrinth

- **Previous commit SHA:** `de45fe8c89c4e2534c7ade837de18db46b8a7947`
- **Completed scope:**
  - Grid world, DDA column caster, 1D depth buffer, distance-sorted billboards
  - High-DPI canvas resize with explicit Canvas 2D state restoration
  - Keyboard + DOM/touch movement, map-based collision, clamped variable delta
  - Web Audio chime after user activation
  - Source and bundle contain no Three.js for this demo (7.4 kB chunk)
- **Validation performed:**
  - `npm test` including no-Three import, wall collision, sprite occlusion, canvas state restore
  - `npm run build` — demo 02 chunk 7.42 kB vs demo 01 Three.js chunk 536 kB
  - Chrome headless screenshot of a perspective corridor, orb billboard, touch controls, READY
- **Unsupported / unverified behavior:**
  - Frame-budget profiling on target hardware was not recorded
  - Touch swipe-on-canvas was implemented; physical touch hardware was not used
- **Architectural decisions:**
  - `CanvasRenderingContext2D` is the primary renderer; HTML canvas is only the surface
  - Collision uses the cell map, never painted pixels
  - Background/blur clears keys so a stalled tab cannot apply a huge movement delta

## Phase 1 — Accessible Turn-Based 3D Tactics Table

- **Previous commit SHA:** `49c3aaafa3ca36f00c23423661be5c4f3e1be5d2`
- **Completed scope:**
  - Pure gameplay model in `src/demos/01-tactics-table/game.ts` (grid, units, move/attack/wait, enemy phase)
  - Three.js tabletop view mapped by gameplay IDs, render-on-demand
  - Semantic DOM unit list, actions, keyboard targets, camera buttons, combat log
  - Versioned localStorage envelope for camera + campaign + battle
  - Honest WebGL-unavailable state that keeps DOM play working
  - Three.js loaded only by this demo chunk
- **Validation performed:**
  - `npm run typecheck` passed
  - `npm test` — 17 tests including keyboard-equivalent turn, full player round, camera/gameplay split, save round-trip
  - `npm run build` — Three.js confined to `01-tactics-table` chunk
  - Chrome headless without GPU: explicit unsupported renderer + playable controls
  - Chrome headless + SwiftShader: 3D table and units visible, status READY, Return to Launcher present
- **Unsupported / unverified behavior:**
  - Pointer picking of tiles/units was not interaction-verified in the headed GPU browser
  - Demand-renderer idle after camera rest is implemented and unit-tested at the helper level; long-session leak counting in DevTools was not performed
  - Default headless Chrome without SwiftShader cannot create a WebGL context on this machine
- **Architectural decisions:**
  - Gameplay state is independent of scene nodes; camera pose is persisted separately
  - No physics, no fixed tick, no worker, no postprocessing
  - Render-on-demand via shared `createDemandRenderer`
  - If WebGL construction fails, the demo remains mounted and playable through semantic controls

## Phase 0 — Repository initialization and launcher foundation

- **Previous commit SHA:** none (new repository)
- **Completed scope:**
  - Vite + TypeScript application shell
  - semantic launcher catalog with ten cards
  - hash routing (`#/`, `#/demo/<id>`)
  - demo registry with dynamic imports
  - demo lifecycle/disposal host (one active demo)
  - shared loop, resize, diagnostics helpers
  - placeholder modules for demos 01–10
  - per-demo `architecture.project.json` contracts
  - README, ARCHITECTURE, VALIDATION_MATRIX
  - Vitest coverage for routing, registry contracts, host disposal, and fixed-step catch-up cap
  - preserved existing handbook DOCX
- **Validation performed:**
  - `npm install` (lockfile pins Vite 8.2.1, TypeScript 7.0.2, Vitest 4.1.11)
  - `npm run typecheck` passed
  - `npm test` — 12 tests passed (router, registry, host disposal, fixed-step cap)
  - `npm run build` passed (ten lazy demo chunks, no Three.js in the bundle)
  - Chrome headless load of `http://127.0.0.1:5173/#/` rendered ten catalog cards with renderer/timing/capability fields
  - Chrome headless load of `#/demo/01-tactics-table` showed the placeholder and a Return to Launcher control
- **Unsupported / unverified behavior:**
  - no demonstration gameplay
  - arrow-key card movement was not exercised in the browser (Tab/hash links are native and were visually present)
  - no Three.js, WebGL2, WebGPU, or Canvas 2D game renderer mounted yet
  - SharedArrayBuffer not configured
  - Playwright smoke harness not added in this phase
- **Architectural decisions:**
  - no repository-wide renderer contract; each demo owns its contract
  - Three.js is not a Phase 0 dependency; it will be added only for demos that require it
  - Canvas 2D vs HTML canvas distinction is documented in the launcher copy
  - shared infrastructure is limited to routing, chrome, host, loop counters, resize, and DOM helpers
  - hash routing chosen for static hosting
