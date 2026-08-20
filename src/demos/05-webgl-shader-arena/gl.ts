export class GlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlError";
  }
}

export interface GpuResources {
  buffers: WebGLBuffer[];
  vaos: WebGLVertexArrayObject[];
  textures: WebGLTexture[];
  framebuffers: WebGLFramebuffer[];
  programs: WebGLProgram[];
}

export function createResources(): GpuResources {
  return { buffers: [], vaos: [], textures: [], framebuffers: [], programs: [] };
}

export function createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
  if (!gl) throw new GlError("WebGL2 context was not created. This demo will not pretend to run on WebGL1.");
  return gl;
}

export function compile(gl: WebGL2RenderingContext, type: number, source: string, label: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new GlError(`Could not create shader for ${label}.`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "no log";
    gl.deleteShader(shader);
    throw new GlError(`${label} compile failed:\n${log}`);
  }
  return shader;
}

export function link(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string,
  label: string,
  resources: GpuResources
): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vert, `${label} vertex`);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag, `${label} fragment`);
  const program = gl.createProgram();
  if (!program) throw new GlError(`Could not create program ${label}.`);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "no log";
    gl.deleteProgram(program);
    throw new GlError(`${label} link failed:\n${log}`);
  }
  resources.programs.push(program);
  return program;
}

export function destroyResources(gl: WebGL2RenderingContext, resources: GpuResources): void {
  for (const buffer of resources.buffers) gl.deleteBuffer(buffer);
  for (const vao of resources.vaos) gl.deleteVertexArray(vao);
  for (const texture of resources.textures) gl.deleteTexture(texture);
  for (const fb of resources.framebuffers) gl.deleteFramebuffer(fb);
  for (const program of resources.programs) gl.deleteProgram(program);
  resources.buffers.length = 0;
  resources.vaos.length = 0;
  resources.textures.length = 0;
  resources.framebuffers.length = 0;
  resources.programs.length = 0;
}
