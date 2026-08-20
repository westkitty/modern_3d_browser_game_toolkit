#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../public/assets/demos/04-verified-glb-adventure");

function pad4(buffer) {
  const pad = (4 - (buffer.length % 4)) % 4;
  if (pad === 0) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(pad, 0x20)]);
}

function boxGeometry(sx, sy, sz) {
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const positions = new Float32Array([
    -hx, -hy, hz, hx, -hy, hz, hx, hy, hz, -hx, hy, hz,
    -hx, -hy, -hz, -hx, hy, -hz, hx, hy, -hz, hx, -hy, -hz,
    -hx, hy, -hz, -hx, hy, hz, hx, hy, hz, hx, hy, -hz,
    -hx, -hy, -hz, hx, -hy, -hz, hx, -hy, hz, -hx, -hy, hz,
    hx, -hy, -hz, hx, hy, -hz, hx, hy, hz, hx, -hy, hz,
    -hx, -hy, -hz, -hx, -hy, hz, -hx, hy, hz, -hx, hy, -hz
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ]);
  return { positions, indices };
}

function encodeGlb({ nodeName, color, size, clips }) {
  const { positions, indices } = boxGeometry(size[0], size[1], size[2]);
  const bin = Buffer.concat([Buffer.from(positions.buffer), Buffer.from(indices.buffer)]);
  const json = {
    asset: { version: "2.0", generator: "demo04-verified-glb-generator" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: nodeName }],
    meshes: [
      {
        name: `${nodeName}Mesh`,
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            material: 0
          }
        ]
      }
    ],
    materials: [
      {
        name: `${nodeName}Material`,
        pbrMetallicRoughness: {
          baseColorFactor: color,
          metallicFactor: 0.05,
          roughnessFactor: 0.7
        }
      }
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min: [-size[0] / 2, -size[1] / 2, -size[2] / 2],
        max: [size[0] / 2, size[1] / 2, size[2] / 2]
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: indices.length,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength, target: 34963 }
    ],
    buffers: [{ byteLength: bin.length }]
  };

  if (clips.length) {
    const times = new Float32Array([0, 1]);
    const translations = new Float32Array([0, 0, 0, 0, 0.08, 0]);
    const extra = Buffer.concat([Buffer.from(times.buffer), Buffer.from(translations.buffer)]);
    const extraOffset = bin.length;
    json.accessors.push(
      { bufferView: 2, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
      { bufferView: 3, componentType: 5126, count: 2, type: "VEC3" }
    );
    json.bufferViews.push(
      { buffer: 0, byteOffset: extraOffset, byteLength: times.byteLength },
      { buffer: 0, byteOffset: extraOffset + times.byteLength, byteLength: translations.byteLength }
    );
    json.animations = clips.map((name) => ({
      name,
      samplers: [{ input: 2, interpolation: "LINEAR", output: 3 }],
      channels: [{ sampler: 0, target: { node: 0, path: "translation" } }]
    }));
    json.buffers[0].byteLength = extraOffset + extra.length;
    const packedBin = pad4(Buffer.concat([bin, extra]));
    json.buffers[0].byteLength = packedBin.length;
    return packGlb(json, packedBin);
  }

  const packedBin = pad4(bin);
  json.buffers[0].byteLength = packedBin.length;
  return packGlb(json, packedBin);
}

function packGlb(json, bin) {
  const jsonBuf = pad4(Buffer.from(JSON.stringify(json), "utf8"));
  const total = 12 + 8 + jsonBuf.length + 8 + bin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonChunk = Buffer.alloc(8);
  jsonChunk.writeUInt32LE(jsonBuf.length, 0);
  jsonChunk.writeUInt32LE(0x4e4f534a, 4);
  const binChunk = Buffer.alloc(8);
  binChunk.writeUInt32LE(bin.length, 0);
  binChunk.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonChunk, jsonBuf, binChunk, bin]);
}

const spec = [
  { id: "player", file: "player.glb", nodeName: "Player", color: [0.49, 0.83, 0.99, 1], size: [0.6, 1.4, 0.6], clips: ["Idle", "Walk"] },
  { id: "environment", file: "environment.glb", nodeName: "Arch", color: [0.35, 0.42, 0.5, 1], size: [6, 0.4, 6], clips: [] },
  { id: "prop", file: "crystal.glb", nodeName: "Crystal", color: [0.53, 0.81, 0.98, 1], size: [0.4, 0.8, 0.4], clips: [] },
  { id: "npc", file: "npc.glb", nodeName: "Npc", color: [0.94, 0.64, 0.64, 1], size: [0.7, 1.3, 0.7], clips: ["Wave"] }
];

await mkdir(outDir, { recursive: true });
const assets = [];
for (const item of spec) {
  const bytes = encodeGlb(item);
  const path = join(outDir, item.file);
  await writeFile(path, bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  assets.push({
    id: item.id,
    uri: `assets/demos/04-verified-glb-adventure/${item.file}`,
    bytes: bytes.length,
    sha256,
    nodes: [item.nodeName],
    animations: item.clips
  });
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  generator: "scripts/generate-demo04-assets.mjs",
  assets
};
await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${assets.length} GLBs + manifest to ${outDir}`);
