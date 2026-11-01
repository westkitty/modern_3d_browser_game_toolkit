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
- **Verified CI for repair branch:** GitHub Actions run 41283448397 on commit `f8cff7a6f0dfcc51e8af7acc4def29f3ea02045a` completed `npm ci`, `npm run typecheck`, `npm test -- --run` (62/62 passed, 15 files), and `npm run build` (55 modules transformed); the source graph at that SHA built successfully. Later changes must be rechecked. Browser/physical WebGL/WebGPU, navigation, IndexedDB, audio, touch and accessibility journeys remain unverified.
- **Remaining potential defects:** WebGL recovery requires reopening rather than automatic reinitialization; browser focus and occlusion require visual checks; WebGPU init/loss requires real hardware validation; partial asset/runtime teardown and all changed user paths require regression checks. Do not mark audit closed or merge based solely on source inspection.
- Next gate: reproducible checkout + `npm ci && npm run typecheck && npm test && npm run build`, then representative browser routes and GPU fallback/restore checks. Repair any failures before integration.

## Chromium regression evidence (2026-11-01)
- CI run [41284352138](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/41284352138) verified branch commit `132039adece72ee5ecb2c61478a9e2053ae5108e`: `npm ci`, TypeScript typecheck, 63/63 Vitest tests in 15 files, Vite production build, and Chromium smoke all passed.
- Ten routes inspected: demos 01–09 reached ready status; demo 10 reached expected unsupported status (no WebGPU adapter on the CI runner).
- Sixteen browser checks passed: catalog, keyboard focus, tactics selection/movement, Canvas 2D movement, fixed-step course movement, verified GLB save/clear/load, WebGL effects control, museum three-room completion and replay, IK pose switching, performance-scenario switching, IndexedDB campaign save/reload, unsupported WebGPU messaging, zero frame-loop ownership after returning to catalog, rapid navigation during delayed GLB manifest load, mobile emulated touch controls/jump, and no uncaught page errors.
- Actual regression found by browser: first tactics unit click also activated New battle due broad `button:last-of-type` query in panel. Fixed with a dedicated `button.launch` selector and an isolated regression test. Chromium confirmed the corrected user journey.
- Browser artifacts from the CI run (individual route screenshots and JSON result) are retained by GitHub Actions according to workflow retention settings.
- Remaining unknowns: physical mobile touch usability; WebGPU supported adapter/render path and real device loss; actual GPU context loss/restoration; complete assistive technology review; visual correctness in additional browsers; performance/thermal tests. This run does not certify those paths.
- No merge or production deployment was performed. The repair PR remains draft.

## GPU lifecycle and context-loss regression evidence (2026-11-01)
- **Verified branch CI:** [run 41285459998](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/41285459998) on commit `30339c8ad19dd0601ec97c20e1dbcc8b05ea89d1` passed TypeScript typecheck, 63/63 unit tests, production build, 16/16 ten-demo Chromium smoke checks, and 4/4 focused resilience checks.
- Real Chromium with Linux software rendering exposed `WEBGL_lose_context`; tested context loss, explicit refusal to reuse invalid context-restored GPU objects, navigation away, and a successful new WebGL2 mount. Verified zero loop owners after returning home.
- A scripted **mock** WebGPU device exercised visible 64-point vertex-buffer draw contract (initialized on an 8x8 grid), normal disposal, device-loss teardown, and shader initialization exception cleanup. All mock devices/buffers and ResizeObservers were disposed exactly once.
- Implemented WebGPU cleanup stack for owned GPU buffers and size observer; initialization failure and device-loss paths now terminate and clean up deterministically. Initial field positions are distinct instead of overlapping at origin.
- Limitation: mock WebGPU evidence does **not** prove actual WebGPU adapter availability, WGSL compilation, pipeline correctness on a hardware device, GPU synchronization, visual quality, or physical-device performance.
- Still requires separate physical-browser/device evidence for WebGPU available path, assistive-technology audit, cross-browser differences, and real mobile control ergonomics. No main-branch merge or deployment was performed.
