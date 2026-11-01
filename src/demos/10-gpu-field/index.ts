import { el } from "../../shared/dom";
import { createFrameLoop } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";

const COMPUTE = `@group(0) @binding(0) var<storage, read_write> points: array<vec2<f32>>;
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&points)) { return; }
  var p = points[i];
  p = vec2<f32>(p.x + 0.002, p.y + sin(p.x * 6.0) * 0.002);
  if (p.x > 1.0) { p.x = -1.0; }
  points[i] = p;
}`;

const VERT = `struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> }
@vertex fn vs_main(@location(0) p: vec2<f32>) -> VSOut {
  var o: VSOut;
  o.pos = vec4<f32>(p, 0.0, 1.0);
  o.uv = p * 0.5 + 0.5;
  return o;
}`;

const FRAG = `@fragment fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(0.2 + uv.x * 0.4, 0.45, 0.7, 1.0);
}`;

export const mount: DemoModule["mount"] = async (host, context) => {
  const isolated = window.crossOriginIsolated === true;
  const sabAvailable = typeof SharedArrayBuffer !== "undefined" && isolated;
  const mode = sabAvailable
    ? "SharedArrayBuffer is available, but this demo keeps transferable-buffer handoff as the measured baseline. SAB is not activated without copy-cost evidence."
    : "SharedArrayBuffer rejected or unavailable (crossOriginIsolated=" + String(isolated) + "). Transferable/CPU path remains.";

  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const canvas = document.createElement("canvas");
  viewport.append(canvas);
  const chart = document.createElement("canvas");
  chart.width = 260;
  chart.height = 70;
  const chartCtx = chart.getContext("2d");
  const log = el("pre", { className: "panel-log", text: mode });
  const panel = el("aside", { className: "demo-panel", children: [el("h2", { text: "GPU field" }), log, chart] });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  if (!navigator.gpu) {
    context.setStatus({ state: "unsupported", detail: "WebGPU is not available." });
    log.textContent = `WebGPU unsupported.\n${mode}\nThis is a deliberate state, not a blank canvas pretending to simulate.`;
    return {
      dispose() {
        host.replaceChildren();
      }
    };
  }
  if (!window.isSecureContext) {
    context.setStatus({ state: "unsupported", detail: "WebGPU requires a secure context." });
    return { dispose() { host.replaceChildren(); } };
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    context.setStatus({ state: "unsupported", detail: "No WebGPU adapter." });
    log.textContent = "No GPU adapter.\n" + mode;
    return { dispose() { host.replaceChildren(); } };
  }
  const device = await adapter.requestDevice();
  const cleanups: Array<() => void> = [];
  let gpuDisposed = false;
  const disposeGpu = (): void => {
    if (gpuDisposed) return;
    gpuDisposed = true;
    for (const cleanup of cleanups.reverse()) cleanup();
    device.destroy();
  };
  let stopLoop = (): void => undefined;
  let terminated = false;
  const lost = device.lost.then((info) => {
    if (terminated) return;
    stopLoop();
    disposeGpu();
    context.setStatus({ state: "error", detail: `Device lost: ${info.reason}` });
    log.textContent = `Device lost (${info.reason}). ${info.message}`;
  });

  let contextGpu: GPUCanvasContext | null = null;
  try { contextGpu = canvas.getContext("webgpu"); }
  catch {
    terminated = true;
    disposeGpu();
    context.setStatus({ state: "unsupported", detail: "WebGPU canvas context acquisition failed." });
    return { dispose() { host.replaceChildren(); } };
  }
  if (!contextGpu) {
    context.setStatus({ state: "unsupported", detail: "canvas.getContext('webgpu') failed." });
    terminated = true;
    disposeGpu();
    return { dispose() { host.replaceChildren(); } };
  }
  const gpuContext = contextGpu;
  try {
  const format = navigator.gpu.getPreferredCanvasFormat();
  const resize = observeElementSize(viewport, (w, h) => {
    const dpr = cappedDevicePixelRatio(2);
    canvas.width = Math.max(64, Math.floor(w * dpr));
    canvas.height = Math.max(64, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    gpuContext.configure({ device, format, alphaMode: "opaque" });
  });
  cleanups.push(() => resize.disconnect());

  const computeModule = device.createShaderModule({ code: COMPUTE });
  const renderModule = device.createShaderModule({ code: `${VERT}\n${FRAG}` });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: renderModule,
      entryPoint: "vs_main",
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] }]
    },
    fragment: { module: renderModule, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "point-list" }
  });
  const field = new Float32Array(128);
  // Distinct deterministic positions make the compute result visible as a field,
  // rather than 64 overlapping points at the origin.
  for (let index = 0; index < field.length / 2; index += 1) {
    field[index * 2] = -0.875 + (index % 8) * 0.25;
    field[index * 2 + 1] = -0.875 + Math.floor(index / 8) * 0.25;
  }
  const storage = device.createBuffer({
    size: field.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
  });
  cleanups.push(() => storage.destroy());
  device.queue.writeBuffer(storage, 0, field);
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs_main" }
  });
  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: storage } }]
  });
  // Compute writes the same GPU buffer consumed by the render pipeline.

  const loop = createFrameLoop(() => {
    if (terminated) return;
    const encoder = device.createCommandEncoder();
    const compute = encoder.beginComputePass();
    compute.setPipeline(computePipeline);
    compute.setBindGroup(0, bindGroup);
    compute.dispatchWorkgroups(2);
    compute.end();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: gpuContext.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0.04, g: 0.06, b: 0.09, a: 1 }
        }
      ]
    });
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, storage);
    pass.draw(field.length / 2);
    pass.end();
    device.queue.submit([encoder.finish()]);
    if (chartCtx) {
      chartCtx.fillStyle = "#0b1220";
      chartCtx.fillRect(0, 0, chart.width, chart.height);
      chartCtx.fillStyle = "#7dd3fc";
      chartCtx.fillText(isolated ? "isolated" : "not isolated", 8, 24);
      chartCtx.fillText(sabAvailable ? "SAB present, not activated" : "SAB off", 8, 42);
    }
  });
  stopLoop = () => { terminated = true; loop.stop(); };
  if (!terminated) loop.start();
  log.textContent = `WebGPU device acquired.\n${mode}\nCompute shader module compiled alongside the render pipeline. Canvas 2D is diagnostics only.`;
  context.setStatus({ state: "ready", detail: "Raw WebGPU field. SAB not activated." });

  return {
    dispose() {
      stopLoop();
      disposeGpu();
      void lost;
      host.replaceChildren();
    }
  };
  } catch (error) {
    terminated = true;
    disposeGpu();
    const detail = error instanceof Error ? error.message : String(error);
    context.setStatus({ state: "error", detail });
    log.textContent = `WebGPU initialization failed: ${detail}`;
    return { dispose() { host.replaceChildren(); } };
  }
};
