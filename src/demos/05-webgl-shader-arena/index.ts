import { el } from "../../shared/dom";
import { createFixedStepLoop } from "../../shared/loop";
import { sampleGamepadAxes } from "../../shared/deadzone";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import type { DemoModule } from "../../shared/types";
import { createContext, createResources, destroyResources, link } from "./gl";
import { COLOR_FS, COLOR_VS, POINT_FS, POINT_VS, POST_FS, POST_VS } from "./shaders";

function ortho(w: number, h: number): Float32Array {
  const sx = 2 / w;
  const sy = 2 / h;
  return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1]);
}

export const mount: DemoModule["mount"] = (host, context) => {
  const shell = el("div", { className: "demo-shell" });
  const viewport = el("div", { className: "demo-viewport" });
  const canvas = document.createElement("canvas");
  viewport.append(canvas);
  const log = el("pre", { className: "panel-log", text: "Creating WebGL2 context…" });
  let reduced = false;
  const reduceBtn = el("button", { text: "Toggle reduced effects", attrs: { type: "button" } });
  const panel = el("aside", {
    className: "demo-panel",
    children: [
      el("h2", { text: "Raw WebGL2 arena" }),
      el("p", { text: "No Three.js. Programs, VAOs, buffers, and a postprocess target are owned here." }),
      reduceBtn,
      log
    ]
  });
  shell.append(viewport, panel);
  host.replaceChildren(shell);

  let gl: WebGL2RenderingContext;
  try {
    gl = createContext(canvas);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    log.textContent = detail;
    context.setStatus({ state: "unsupported", detail });
    return {
      dispose() {
        host.replaceChildren();
      }
    };
  }

  const resources = createResources();
  let colorProg: WebGLProgram;
  let pointProg: WebGLProgram;
  let postProg: WebGLProgram;
  try {
    colorProg = link(gl, COLOR_VS, COLOR_FS, "opaque", resources);
    pointProg = link(gl, POINT_VS, POINT_FS, "particles", resources);
    postProg = link(gl, POST_VS, POST_FS, "post", resources);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    log.textContent = detail;
    context.setStatus({ state: "error", detail });
    return {
      dispose() {
        destroyResources(gl, resources);
        host.replaceChildren();
      }
    };
  }

  const quad = gl.createBuffer();
  resources.buffers.push(quad!);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.4, 0, 0.2, 0.4, 0, 0.2, 0, 0.6, 0.9, -0.4, 0, 0.2, 0, 0.6, 0.9, 0.4, 0, 0.2]), gl.STATIC_DRAW);

  const vao = gl.createVertexArray();
  resources.vaos.push(vao!);
  gl.bindVertexArray(vao);
  const posLoc = gl.getAttribLocation(colorProg, "a_pos");
  const colLoc = gl.getAttribLocation(colorProg, "a_col");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  const col = gl.createBuffer();
  resources.buffers.push(col!);
  gl.bindBuffer(gl.ARRAY_BUFFER, col);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.5, 0.85, 1, 0.5, 0.85, 1, 1, 1, 1, 0.5, 0.85, 1, 1, 1, 1, 0.5, 0.85, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(colLoc);
  gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, 0, 0);

  const particles = new Float32Array(300);
  const pbo = gl.createBuffer();
  resources.buffers.push(pbo!);
  const pvao = gl.createVertexArray();
  resources.vaos.push(pvao!);
  gl.bindVertexArray(pvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, pbo);
  gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);
  const pLoc = gl.getAttribLocation(pointProg, "a_pos");
  gl.enableVertexAttribArray(pLoc);
  gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);

  const fsQuad = gl.createBuffer();
  resources.buffers.push(fsQuad!);
  const fsVao = gl.createVertexArray();
  resources.vaos.push(fsVao!);
  gl.bindVertexArray(fsVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, fsQuad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const fsLoc = gl.getAttribLocation(postProg, "a_pos");
  gl.enableVertexAttribArray(fsLoc);
  gl.vertexAttribPointer(fsLoc, 2, gl.FLOAT, false, 0, 0);

  const colorTex = gl.createTexture();
  resources.textures.push(colorTex!);
  const fbo = gl.createFramebuffer();
  resources.framebuffers.push(fbo!);

  const resizeTarget = (w: number, h: number): void => {
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  let cssW = 320;
  let cssH = 240;
  const resize = observeElementSize(viewport, (w, h) => {
    cssW = Math.max(64, w);
    cssH = Math.max(64, h);
    const dpr = cappedDevicePixelRatio(2);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    resizeTarget(canvas.width, canvas.height);
  });

  const player = { x: 0, y: 0 };
  const keys = new Set<string>();
  let lost = false;
  const onLost = (event: Event): void => {
    event.preventDefault();
    lost = true;
    log.textContent = "WebGL context lost. Waiting to restore owned resources.";
    context.setStatus({ state: "error", detail: "context lost" });
  };
  const onRestored = (): void => {
    lost = false;
    log.textContent = "Context restored. Re-link is required by policy; reload the demo to rebuild GPU objects.";
    context.setStatus({ state: "unsupported", detail: "Context restored; demo requires remount to rebuild programs." });
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  reduceBtn.addEventListener("click", () => {
    reduced = !reduced;
    log.textContent = reduced ? "Reduced effects: postprocess off." : "Full effects: vignette postprocess on.";
  });

  let audio: AudioContext | null = null;
  const onKey = (event: KeyboardEvent): void => {
    keys.add(event.code);
    if (!audio) {
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audio = new Ctor();
    }
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", (event) => keys.delete(event.code));

  const loop = createFixedStepLoop({
    simulate: (dt) => {
      const pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
      const gp = sampleGamepadAxes(pads);
      const x = gp.x || (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
      const y = -gp.y || (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
      player.x += x * 4 * dt;
      player.y += y * 4 * dt;
      for (let i = 0; i < particles.length; i += 3) {
        particles[i] = ((i * 0.17 + player.x) % 8) - 4;
        particles[i + 1] = ((i * 0.11 + player.y) % 6) - 3;
        particles[i + 2] = 0;
      }
    },
    render: () => {
      if (lost) return;
      const matrix = ortho(12, 8);
      gl.bindFramebuffer(gl.FRAMEBUFFER, reduced ? null : fbo);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.05, 0.07, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(colorProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(colorProg, "u_viewProj"), false, matrix);
      gl.uniform3f(gl.getUniformLocation(colorProg, "u_offset"), player.x, player.y, 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(pointProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(pointProg, "u_viewProj"), false, matrix);
      gl.bindVertexArray(pvao);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, particles);
      gl.drawArrays(gl.POINTS, 0, particles.length / 3);
      if (!reduced) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(postProg);
        gl.bindVertexArray(fsVao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.uniform1i(gl.getUniformLocation(postProg, "u_color"), 0);
        gl.uniform1f(gl.getUniformLocation(postProg, "u_strength"), 0.65);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
  });
  loop.start();
  log.textContent = "WebGL2 programs linked. WASD / gamepad to move. Particles are a separate pass.";
  context.setStatus({ state: "ready", detail: "Raw WebGL2 arena." });

  return {
    dispose() {
      loop.stop();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("keydown", onKey);
      void audio?.close();
      destroyResources(gl, resources);
      host.replaceChildren();
    }
  };
};

export { compile } from "./gl";
