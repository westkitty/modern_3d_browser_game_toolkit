# OPERATIONAL_STATE

## Project identity
Modern 3D Browser Game Toolkit: ten independently runnable architectural demonstrations behind one hash-routed launcher. The launcher is a lifecycle host, not a game engine.

## Current baseline
- Production-reference implementation is present on main working tree after baseline commit 22fb843.
- Ten canonical demos remain registered and production build emits one chunk for each demo 01 through 10.
- Distinct Three.js, Canvas 2D, raw WebGL2 and raw WebGPU paths remain intentional.

## Protected invariants
- Exactly ten canonical demonstrations remain independently runnable.
- Only one mounted demo may own render/input/runtime resources at a time.
- Renderer-specific architectures remain distinct; no generic engine abstraction.
- Hash routes remain static-host friendly.
- Demo 10 reports unsupported WebGPU honestly.
- Launcher keyboard/focus accessibility remains intact.
- Evidence labels advance only from observed proof.
- No device/performance guarantee is inferred from local source/build evidence.

## Implemented production-reference systems
- Demo 03: fixed-step first-person kinematic movement, acceleration/deceleration, gravity/jump, grounded state, representative collision/step handling, pointer-lock look, touch controls and lifecycle-safe input clearing.
- Demo 04: schema-v3 IndexedDB save/load/clear, v1/v2 migration, malformed/unsupported refusal, deterministic bounded local zone streaming, stale-load rejection, fallback geometry and explicit resource disposal.
- Demo 08: five comparative stress scenarios with raw frame/update/render-call samples plus Three.js draw, triangle and renderer-memory counters.
- Shared: explicit acquire/release resource ownership counters for runtime, scene, geometry, material, texture, listeners and streamed zones.

## Verified evidence
- Environment preflight verified cwd, repository root, branch main and origin git@github.com:westkitty/modern_3d_browser_game_toolkit.git.
- Focused production-reference tests: 23/23 passed.
- npm run typecheck passed after one bounded event-handler typing repair.
- npm test passed: 54/54 tests across 15 files.
- npm run build passed: 55 modules transformed.
- Built output contains emitted chunks for demos 01 through 10.
- Local preview server responded successfully on 127.0.0.1:4173.

## Unverified/browser-specific paths
- Headless Chrome on this host exited without DOM output, so pointer-lock interaction, IndexedDB UI actions, streamed-zone browser behavior and coarse-pointer DOM presence are not Phase-12 browser-verified.
- No physical touch device was used.
- No cross-device performance threshold or FPS guarantee is claimed.
- Demo 10 WebGPU hardware availability remains browser/device dependent.

## Delivery state
- Production-reference upgrade committed as `b48cb515e19c7938134a14a2d2b8464fcd262600` (`feat: add production gameplay reference systems`).
- Push to `origin/main` verified; local `HEAD` and `origin/main` matched after push.

## Remaining work
- Optional only: obtain browser-interaction evidence for pointer lock, IndexedDB controls, streaming behavior and coarse-pointer UI on a stable browser/runtime path or representative physical device.
