# Phase log

## Phase 11 — Integration, validation, documentation

- **Previous commit SHA:** `6b724e18a67bfad76b23180ac9b64a268bd9b760`
- **Completed scope:**
  - README ten-demo matrix and command list
  - Validation matrix updated with honest evidence labels
  - Registry requires all ten demos `ready`
  - Production build inspected for renderer isolation (Canvas/WebGL2/WebGPU chunks do not contain Three.js)
- **Validation performed:**
  - `npm run typecheck` passed
  - `npm test` — 40 tests passed
  - `npm run build` passed (51 modules)
- **Unsupported / unverified behavior:**
  - Repeated enter/exit leak hunting in DevTools was not performed as a timed GPU-memory session
  - Physical gamepad, physical touch hardware, and production COOP/COEP hosting were not verified
  - WebGPU adapter availability on this agent session is unverified; unsupported path is implemented
  - SharedArrayBuffer was not activated
  - Worker termination applies only if a worker is created; demos 09/10 did not retain a worker
- **Architectural decisions:** no late redesign of demos; documentation matches implemented architecture rather than aspirational badges

## Phase 10 — Cross-Origin-Isolated GPU Field Simulator

- **Previous commit SHA:** `7ad8aab3f186cbe1b73799420cb61e8dfd56abbf`
- **Completed scope:**
  - WebGPU adapter/device checks and explicit unsupported states
  - Compute + render pipelines, storage and vertex buffer ownership, device.lost
  - Canvas 2D diagnostics for isolation/SAB
  - Dev/preview COOP/COEP headers
  - SharedArrayBuffer is detected but not activated
- **Validation performed:** no-Three.js source test; typecheck
- **Unsupported / unverified behavior:**
  - WebGPU hardware path depends on the browser; unsupported path is intentional
  - Local isolation headers do not prove production hosting
- **Architectural decisions:** transferable/SAB remains a documented non-activation; Canvas 2D is not the GPU renderer

## Phase 9 — Offline Hybrid Strategy Globe

- **Previous commit SHA:** `abff238ebb8df5e8d3791d7a5d65a3673e542146`
- **Completed scope:**
  - Authoritative campaign state driving globe markers, Canvas 2D minimap, and DOM log
  - Explicit lon/lat → minimap transform
  - Main-thread turn resolution; worker not activated (no responsiveness evidence)
  - IndexedDB save schema 2
- **Validation performed:** turn resolver and map transform unit tests
- **Unsupported / unverified behavior:** globe visual in-browser not captured; quota errors not hardware-tested
- **Architectural decisions:** Worker stays off. Failure of IndexedDB does not destroy in-memory campaign state.

## Phase 8 — Instancing and Broadphase Crowd Lab

- **Previous commit SHA:** `57756a5cb5db9ca81e6d0b4a593051a57c36ce21`
- **Completed scope:**
  - Crowd agents with naive and instanced render paths
  - Independent broadphase hash toggle
  - Uniform vs clustered spawn
  - Canvas 2D diagnostic bars for sim time and candidate counts
- **Validation performed:** naive vs hashed candidate counts unit-tested
- **Unsupported / unverified behavior:** GPU frame-time percentiles not measured on hardware
- **Architectural decisions:** instancing/broadphase start OFF; no universal performance slogan is printed

## Phase 7 — IK Creature and CanvasTexture Telemetry Lab

- **Previous commit SHA:** `b25672343edb515c1a5048c418bea26c6f3eea19`
- **Completed scope:**
  - Two-bone IK poses: reachable, unreachable, folded, near-zero, mirrored
  - Verified rig contract (Root/Femur/Tibia)
  - Canvas 2D telemetry plate uploaded only when text changes
- **Validation performed:** IK finite-number tests; telemetry dirty-flag test; typecheck
- **Unsupported / unverified behavior:** visual of the creature in-browser not captured
- **Architectural decisions:** CanvasTexture.needsUpdate is set only after a plate content change

## Phase 6 — Accessible 3D Puzzle Museum

- **Previous commit SHA:** `be794cef21831702b8f6ecd20a8a6c6f8d7aea0a`
- **Completed scope:**
  - Three puzzle rooms with required instructions in semantic DOM
  - Keyboard-operable options, live status, hints, localStorage completion
  - Reduced-motion toggle that stops decorative camera orbit
- **Validation performed:** `npm run typecheck`; museum unit tests
- **Unsupported / unverified behavior:** in-browser visual of the 3D gallery not captured
- **Architectural decisions:** required information is never only on 3D textures

## Phase 5 — Raw WebGL2 Shader Arena

- **Previous commit SHA:** `aa11e3c3d32c3c876ab05067916230836a55eebb`
- **Completed scope:**
  - WebGL2 context creation with explicit unsupported state
  - Shader compile/link diagnostics
  - Owned buffers, VAOs, textures, framebuffer, programs
  - Opaque pass, GPU points, vignette postprocess, reduced-effects toggle
  - Context-lost listener; restore requires remount
- **Validation performed:**
  - `npm run typecheck`, `npm test` (no Three.js import)
- **Unsupported / unverified behavior:**
  - In-browser WebGL2 visual not captured in this phase
  - Context-loss reconstruction is a remount policy, not a silent GPU rebuild
- **Architectural decisions:**
  - Intentionally small renderer, not a Three.js replacement
  - Effects measured as separate programs (opaque vs points vs post)

## Phase 4 — Verified-GLB Generated Adventure

- **Previous commit SHA:** `89d64185b1e50abc3f97b7d4d08345eb6c022842`
- **Completed scope:**
  - `scripts/generate-demo04-assets.mjs` writes player/environment/crystal/npc GLBs
  - Manifest emitted from those files with sha256, node names, animation names
  - Runtime validator checks existence, hash, nodes, clips before binding
  - Animation mixer uses verified clip names only
  - IndexedDB save schema 2 with migration from schema 1
- **Validation performed:**
  - Generator ran; four GLBs + manifest written
  - `npm test` validates hashes/nodes/clips, missing-asset failure, schema migration
  - `npm run typecheck` passed
- **Unsupported / unverified behavior:**
  - Browser visual of loaded GLBs not captured in this phase (WebGL screenshot path is slow on this host)
  - GLB geometry is intentionally primitive boxes produced by the repo generator, not artist-authored hero assets
- **Architectural decisions:**
  - No guessed clip/node names in runtime; they are copied from the generated manifest after validation
  - Asset files are build outputs of the generator, committed so the demo runs without a pre-step

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
