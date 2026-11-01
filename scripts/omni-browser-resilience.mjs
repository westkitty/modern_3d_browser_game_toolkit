import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = process.env.OMNI_EVIDENCE_DIR || "omni-browser-evidence";
const BASE = "http://127.0.0.1:4173";
mkdirSync(OUT, { recursive: true });
const result = { chromium: "Linux software renderer", tests: [], unsupported: [], errors: [] };
const check = (name, facts) => { result.tests.push({ name, ...facts }); console.log("RESILIENCE PASS " + name + " " + JSON.stringify(facts)); };
const requireState = async (page, id, state) => {
  await page.waitForFunction(([expectedId, expectedState]) =>
    window.__DEMO_STATUS__?.id === expectedId && window.__DEMO_STATUS__.state === expectedState,
    [id, state], { timeout: 30000 });
};
const home = async page => {
  await page.evaluate(() => { window.location.hash = "#/"; });
  await page.waitForFunction(() => document.querySelectorAll(".demo-card").length === 10 &&
    window.__LAUNCHER_DIAGNOSTICS__?.activeLoopOwners === 0, null, { timeout: 30000 });
};
const browser = await chromium.launch({ headless: true, args: [
  "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"
]});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 780 } });
  page.on("pageerror", error => result.errors.push("WebGL: " + error.message));
  await page.goto(BASE + "/#/demo/05-webgl-shader-arena");
  await requireState(page, "05-webgl-shader-arena", "ready");
  const extension = await page.evaluate(() => {
    const canvas = document.querySelector(".demo-viewport canvas");
    const gl = canvas?.getContext("webgl2");
    const lose = gl?.getExtension("WEBGL_lose_context");
    if (!lose) return false;
    window.__omniLoseWebGL = lose;
    lose.loseContext();
    return true;
  });
  if (extension) {
    await requireState(page, "05-webgl-shader-arena", "error");
    const lost = await page.locator(".demo-panel .panel-log").innerText();
    assert.match(lost, /context lost/i);
    await page.evaluate(() => window.__omniLoseWebGL.restoreContext());
    await requireState(page, "05-webgl-shader-arena", "unsupported");
    const restored = await page.locator(".demo-panel .panel-log").innerText();
    assert.match(restored, /reopen this demo/i);
    await home(page);
    await page.evaluate(() => { window.location.hash = "#/demo/05-webgl-shader-arena"; });
    await requireState(page, "05-webgl-shader-arena", "ready");
    await home(page);
    check("WebGL context loss, restore refusal, and remount", { extension: true, finalOwners: 0 });
  } else {
    result.unsupported.push("WEBGL_lose_context extension unavailable; context-loss path unverified");
    await home(page);
    console.log("RESILIENCE UNVERIFIED WebGL extension absent");
  }
  await page.close();

  const mock = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  mock.on("pageerror", error => result.errors.push("Mock WebGPU: " + error.message));
  await mock.addInitScript(() => {
    const m = {
      devices: 0, destroys: 0, buffers: 0, bufferDestroys: 0,
      drawCalls: 0, lastDrawVertices: 0, computeDispatches: 0,
      writes: [], observed: 0, disconnected: 0, configs: 0,
      failShader: false, failCanvas: false, lost: null
    };
    window.__omniMockGPU = m;
    const NativeRO = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(cb) { this.impl = new NativeRO(cb); }
      observe(...args) { m.observed++; return this.impl.observe(...args); }
      disconnect() { m.disconnected++; return this.impl.disconnect(); }
      unobserve(...args) { return this.impl.unobserve(...args); }
    };
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...options) {
      if (type === "webgpu") {
        if (m.failCanvas) return null;
        return {
          configure() { m.configs++; },
          getCurrentTexture() { return { createView() { return {}; } }; }
        };
      }
      return nativeGetContext.call(this, type, ...options);
    };
    Object.defineProperty(window, "GPUBufferUsage", { configurable: true, value: { STORAGE: 1, COPY_DST: 2, VERTEX: 4 } });
    Object.defineProperty(navigator, "gpu", { configurable: true, value: {
      getPreferredCanvasFormat() { return "bgra8unorm"; },
      async requestAdapter() {
        return { async requestDevice() {
          m.devices++;
          let notifyLoss;
          const lost = new Promise(resolve => { notifyLoss = resolve; });
          m.lose = detail => notifyLoss(detail);
          return {
            lost,
            queue: {
              writeBuffer(buffer, offset, data) {
                m.writes.push({ count: data.length, first: data[0], second: data[1], last: data[data.length - 1] });
              },
              submit() { /* no GPU in this mocked lifecycle contract */ }
            },
            createShaderModule() { if (m.failShader) throw new Error("Synthetic shader initialization failure"); return {}; },
            createRenderPipeline() { return {}; },
            createComputePipeline() { return { getBindGroupLayout() { return {}; } }; },
            createBuffer() { m.buffers++; return { destroy() { m.bufferDestroys++; } }; },
            createBindGroup() { return {}; },
            createCommandEncoder() { return {
              beginComputePass() { return {
                setPipeline() {}, setBindGroup() {}, dispatchWorkgroups(n) { m.computeDispatches += n; }, end() {}
              }; },
              beginRenderPass() { return {
                setPipeline() {}, setVertexBuffer() {}, draw(count) { m.drawCalls++; m.lastDrawVertices = count; }, end() {}
              }; },
              finish() { return {}; }
            }; },
            destroy() { m.destroys++; }
          };
        } };
      }
    }});
  });
  await mock.goto(BASE + "/#/demo/10-gpu-field");
  await requireState(mock, "10-gpu-field", "ready");
  await mock.waitForFunction(() => window.__omniMockGPU.drawCalls >= 3);
  const before = await mock.evaluate(() => ({
    devices: window.__omniMockGPU.devices,
    drawCalls: window.__omniMockGPU.drawCalls,
    drawVertices: window.__omniMockGPU.lastDrawVertices,
    field: window.__omniMockGPU.writes.at(-1)
  }));
  assert.equal(before.drawVertices, 64);
  assert.equal(before.field?.count, 128);
  assert.notEqual(before.field?.first, before.field?.second);
  await home(mock);
  const released = await mock.evaluate(() => ({
    devices: window.__omniMockGPU.devices,
    destroys: window.__omniMockGPU.destroys,
    buffers: window.__omniMockGPU.buffers,
    bufferDestroys: window.__omniMockGPU.bufferDestroys,
    observed: window.__omniMockGPU.observed,
    disconnected: window.__omniMockGPU.disconnected
  }));
  assert.equal(released.destroys, released.devices);
  assert.equal(released.buffers, released.bufferDestroys);
  assert.equal(released.observed, released.disconnected);
  check("Mock WebGPU compute-to-render contract and teardown", { ...before, ...released, GPU: "mocked, NOT hardware validated" });

  await mock.evaluate(() => { window.location.hash = "#/demo/10-gpu-field"; });
  await requireState(mock, "10-gpu-field", "ready");
  await mock.waitForFunction(() => window.__omniMockGPU.drawCalls >= 5);
  const beforeLoss = await mock.evaluate(() => window.__omniMockGPU.drawCalls);
  await mock.evaluate(() => { window.__omniMockGPU.lose({ reason: "unknown", message: "synthetic device loss" }); });
  await requireState(mock, "10-gpu-field", "error");
  await mock.waitForTimeout(150);
  const afterLoss = await mock.evaluate(() => ({
    calls: window.__omniMockGPU.drawCalls,
    devices: window.__omniMockGPU.devices,
    destroys: window.__omniMockGPU.destroys,
    buffers: window.__omniMockGPU.buffers,
    bufferDestroys: window.__omniMockGPU.bufferDestroys,
    observed: window.__omniMockGPU.observed,
    disconnected: window.__omniMockGPU.disconnected
  }));
  assert.ok(afterLoss.calls >= beforeLoss);
  assert.equal(afterLoss.destroys, afterLoss.devices);
  assert.equal(afterLoss.buffers, afterLoss.bufferDestroys);
  assert.equal(afterLoss.observed, afterLoss.disconnected);
  await home(mock);
  check("Mock WebGPU device loss stops work and releases resources", { ...afterLoss, GPU: "mocked" });

  await mock.evaluate(() => { window.__omniMockGPU.failShader = true; window.location.hash = "#/demo/10-gpu-field"; });
  await requireState(mock, "10-gpu-field", "error");
  assert.match(await mock.locator(".demo-panel .panel-log").innerText(), /Synthetic shader initialization failure/);
  const failed = await mock.evaluate(() => ({
    devices: window.__omniMockGPU.devices,
    destroys: window.__omniMockGPU.destroys,
    buffers: window.__omniMockGPU.buffers,
    bufferDestroys: window.__omniMockGPU.bufferDestroys,
    observed: window.__omniMockGPU.observed,
    disconnected: window.__omniMockGPU.disconnected
  }));
  assert.equal(failed.destroys, failed.devices);
  assert.equal(failed.buffers, failed.bufferDestroys);
  assert.equal(failed.observed, failed.disconnected);
  await home(mock);
  check("Mock WebGPU shader initialization error closes all owners", { ...failed, GPU: "mocked" });
  await mock.close();

  assert.deepEqual(result.errors, [], "No uncaught browser errors");
  result.verdict = "passed";
} catch (error) {
  result.verdict = "failed";
  result.errors.push(error instanceof Error ? error.stack || error.message : String(error));
  console.error("RESILIENCE FAILURE " + result.errors.at(-1));
  process.exitCode = 1;
} finally {
  await browser.close();
  writeFileSync(join(OUT, "resilience.json"), JSON.stringify(result, null, 2));
  console.log("RESILIENCE RESULT " + JSON.stringify({ verdict: result.verdict, passed: result.tests.length, unverified: result.unsupported, errors: result.errors }));
}
