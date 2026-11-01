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


## OMNI bug-repair branch (2026-11-01; implemented, not yet runtime-verified)
- Authorized repair target: `westkitty/modern_3d_browser_game_toolkit`.
- Audited baseline: `main@8d50011c1c1a3aa5ac2dedfbd691a65b58dc2189`.
- Isolated implementation branch: `fix/omni-verified-bugs-20261101`. Main is not modified or deployed by this repair run.
- Changed areas: serialized demo mount/dispose and late resource ownership; tactics save validation, input cancellation and focus; labyrinth audio and sprite occlusion; touch-jump consumption; GLB parsing, verified-byte loading and database cleanup; WebGL loss guard, shader compilation cleanup and corrected vignette; inverse-kinematics range and visual alignment; spatial-hash neighboring pairs; strategy campaign recovery and transaction reporting; WebGPU cleanup, device loss, and visible compute-buffer rendering; museum completion and replay.
- Narrow regression tests added for launcher mount races, late resource registration, IK reach limits, and spatial hashing. Existing end-to-end paths must remain available.
- **Unverified:** no `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, hardware WebGL/WebGPU, browser navigation, IndexedDB, audio, or touch journey was executed against this branch in this chat. Source changes are **implemented-unverified** and may still require corrections.
- **Remaining potential defects:** WebGL recovery requires reopening rather than automatic reinitialization; browser focus and occlusion require visual checks; WebGPU init/loss requires real hardware validation; partial asset/runtime teardown and all changed user paths require regression checks. Do not mark audit closed or merge based solely on source inspection.
- Next gate: reproducible checkout + `npm ci && npm run typecheck && npm test && npm run build`, then representative browser routes and GPU fallback/restore checks. Repair any failures before integration.
