interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
  getPreferredCanvasFormat(): GPUTextureFormat;
}

interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}

interface GPUDevice {
  readonly queue: GPUQueue;
  readonly lost: Promise<{ reason: string; message: string }>;
  createShaderModule(desc: { code: string }): GPUShaderModule;
  createRenderPipeline(desc: Record<string, unknown>): GPURenderPipeline;
  createComputePipeline(desc: Record<string, unknown>): GPUComputePipeline;
  createBuffer(desc: { size: number; usage: number }): GPUBuffer;
  createBindGroup(desc: Record<string, unknown>): GPUBindGroup;
  createCommandEncoder(): GPUCommandEncoder;
  destroy(): void;
}

interface GPUQueue {
  writeBuffer(buffer: GPUBuffer, offset: number, data: BufferSource): void;
  submit(buffers: GPUCommandBuffer[]): void;
}

interface GPUBuffer {
  destroy(): void;
}

interface GPUShaderModule {}
interface GPURenderPipeline {}
interface GPUComputePipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}
interface GPUBindGroup {}
interface GPUBindGroupLayout {}
interface GPUCommandEncoder {
  beginRenderPass(desc: Record<string, unknown>): GPURenderPassEncoder;
  beginComputePass(): GPUComputePassEncoder;
  finish(): GPUCommandBuffer;
}
interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setVertexBuffer(slot: number, buffer: GPUBuffer): void;
  draw(count: number): void;
  end(): void;
}
interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, group: GPUBindGroup): void;
  dispatchWorkgroups(x: number): void;
  end(): void;
}
interface GPUCommandBuffer {}
type GPUTextureFormat = string;
interface GPUCanvasContext {
  configure(desc: Record<string, unknown>): void;
  getCurrentTexture(): { createView(): unknown };
}

interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null;
}

declare const GPUBufferUsage: {
  VERTEX: number;
  COPY_DST: number;
  STORAGE: number;
};
