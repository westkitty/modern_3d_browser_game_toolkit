# Launcher architecture

This repository is a **catalog of architectures**, not one engine with ten skins.

## Lifecycle boundary

`src/launcher/host.ts` is the only owner of the currently mounted demonstration.

```ts
interface DemoModule {
  mount(host: HTMLElement, context: DemoContext): Promise<DemoHandle> | DemoHandle;
}

interface DemoHandle {
  dispose(): void | Promise<void>;
}
```

Invariants:

- Only one demo may own active rendering or input resources.
- Route changes dispose the current handle before the next `mount`.
- `dispose` must stop animation frames, remove listeners, release pointer lock, stop demo-owned audio, terminate demo-owned workers, and drop GPU/Canvas surfaces the demo created.
- Shared loop helpers in `src/shared/loop.ts` count owners so leftover `requestAnimationFrame` work is observable.

## Lazy loading

`src/launcher/registry.ts` loads each demo with a dynamic `import()`. Canvas-only and raw-GPU demos must not pull Three.js into their module graph. The launcher does not eagerly initialize a renderer.

## Why renderer-specific code stays separated

A generic “3D runtime” would hide the point of the toolkit. Three.js scene graphs, Canvas 2D column casters, raw WebGL2 buffer maps, and WebGPU pipelines do not share a useful lowest common denominator beyond routing, chrome, resize observation, and diagnostics.

Shared code is limited to:

- hash routing
- launcher chrome and keyboard catalog navigation
- demo host / disposal
- resize helpers
- loop ownership counters
- small DOM helpers
- narrow explicit resource-ownership counters used by production-reference demos

Renderer-specific code lives under `src/demos/<id>/`.

## State ownership

Gameplay truth is never stored solely in mesh transforms, painted pixels, or GPU buffers. Each demo keeps an authoritative model appropriate to its genre and maps presentation objects back to that model.

The launcher does not own gameplay state.

## Canvas 2D opportunities

Use `CanvasRenderingContext2D` when it is the simpler owner:

- projected/pseudo-3D primary renderers (demo 02)
- minimaps and heat maps (demo 09)
- diagnostic charts (demos 08 and 10)
- dynamic world-space plates via `CanvasTexture` (demo 07)

Assigning `canvas.width` or `canvas.height` resets Canvas 2D state. Demos that use Canvas 2D must centralize resize restoration.

## Three.js boundaries

Three.js is used where scene, camera, lights, picking, or glTF loading remove real work (demos 01, 03, 04, 06, 07, 08, 09). It is forbidden as a dependency of demos 02, 05, and 10.

Three.js objects are presentation. They map to gameplay IDs; they are not the IDs.

## Raw GPU boundaries

Demos 05 and 10 own context/device creation, shader diagnostics, buffer/texture/pipeline lifetime, and context/device loss. They are intentionally small renderers, not replacement engines.

Unsupported adapters must become visible application states, not blank canvases.

## Asset authority

Demos that load GLB content (04, 07) must go through:

1. specification
2. actual generated/exported files
3. a manifest emitted from those files
4. validation
5. runtime binding by logical ID

Runtime code must not invent node names, clip names, skeleton facts, or hashes.

## Worker and shared-memory boundaries

Workers and `SharedArrayBuffer` start **off** unless a demo records evidence that main-thread work is insufficient.

- Demo 09: main-thread turn resolution first; worker only with measured justification.
- Demo 10: transferable-buffer handoff first; SAB only if `crossOriginIsolated` is true and measurements justify it.

## Production reference systems

Production concerns remain demo-owned. They are not promoted into a generic engine API.

### Demo 03 — first-person kinematic reference

- authoritative movement state lives in the simulation module, not camera/mesh transforms
- simulation advances at 60 Hz with bounded catch-up
- acceleration/deceleration, gravity, jump and grounded state are deterministic under fixed deltas
- local movement input is rotated by camera yaw before integration
- representative AABB/platform collision includes bounded step-up handling; this is not a general mesh-physics solver
- pointer lock owns mouse-look only while the canvas is locked
- keyboard/touch/gamepad state is cleared on blur, visibility loss and pointer-lock loss
- coarse-pointer touch controls use pointer events with `touch-action: none` and are removed with the demo
- camera pitch is clamped; desktop controls remain available when touch controls are present
- the demo explicitly disposes renderer resources and listener ownership

### Demo 04 — versioned persistence and streaming

Save data is gameplay state only. Schema v3 stores player position/orientation, deterministic seed, collected/spoken flags and activated zone IDs. v1 and v2 payloads migrate through one validator. Invalid bounds, malformed shapes and unsupported versions are refused instead of being applied. Three.js objects, loaders and GPU state are never serialized.

Streaming is local and bounded:

1. deterministic distance rule queues a zone
2. at most one Demo 04 zone load runs concurrently
3. the loaded object receives unique ownership
4. activation inserts it into the scene
5. leaving the retention boundary deactivates it
6. geometry/material/texture ownership is disposed on unload
7. late results from stale loads are disposed instead of activated
8. a failed GLB runtime load produces visible fallback geometry rather than a missing-world blank

Generated GLBs are already validated from the manifest before streaming. Streaming demonstrates runtime lifetime, not asset-authority discovery.

### Resource instrumentation

`src/shared/resources.ts` is deliberately narrow. It counts only ownership acquired through its scopes: runtime, scene, geometry, material, texture, listener and streamed-zone registrations. Demo UI combines those ownership counts with `WebGLRenderer.info` where available. The counters are for leak visibility and repeated mount/unmount checks, not memory-byte estimates.

### Demo 08 — comparative performance reference

Demo 08 has five reproducible scenarios: baseline idle, representative movement/collision CPU work, streamed-zone churn, resource mount/unmount churn and the crowd/broadphase workload. It samples frame interval, simulation/update cost and renderer call cost and displays Three.js draw calls, triangles and renderer resource counts. These are raw local measurements; no cross-device FPS threshold is encoded.

## Cleanup strategy

Leaving a demo:

1. dispose the `DemoHandle`
2. cancel demo-owned rAF
3. disconnect resize observers
4. remove DOM the demo inserted into the host surface
5. publish `__DEMO_STATUS__` idle and `__LAUNCHER_DIAGNOSTICS__`

The launcher never assumes garbage collection releases GPU allocations.

## Contracts

There is **no** repository-wide `renderPath`. Each demo has `architecture.project.json`. The launcher CSS and chrome are shared presentation, not a rendering architecture.

Production builds keep Three.js in a shared chunk loaded only by demos that import it. Canvas 2D, raw WebGL2, and raw WebGPU demos are separate entry chunks and must not import `three`.
