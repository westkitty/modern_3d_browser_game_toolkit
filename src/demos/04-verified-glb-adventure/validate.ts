export interface ManifestAsset {
  id: string;
  uri: string;
  bytes: number;
  sha256: string;
  nodes: string[];
  animations: string[];
}

export interface AssetManifest {
  schemaVersion: number;
  generatedAt: string;
  generator: string;
  assets: ManifestAsset[];
}

export interface ValidationIssue {
  id: string;
  code: "missing" | "hash" | "nodes" | "clips" | "manifest";
  message: string;
}

export interface ValidationOk {
  ok: true;
  manifest: AssetManifest;
  facts: Record<string, ManifestAsset>;
}

export interface ValidationFail {
  ok: false;
  issues: ValidationIssue[];
}

const encoder = new TextDecoder();

export function parseManifest(raw: unknown): AssetManifest {
  if (!raw || typeof raw !== "object") throw new Error("Manifest is not an object.");
  const data = raw as AssetManifest;
  if (data.schemaVersion !== 1 || !Array.isArray(data.assets)) {
    throw new Error("Manifest schema is unsupported or assets[] is missing.");
  }
  return data;
}

export function parseGlbJson(bytes: Uint8Array): { nodes: string[]; animations: string[] } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Not a GLB file.");
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(encoder.decode(bytes.subarray(20, 20 + jsonLength))) as {
    nodes?: Array<{ name?: string }>;
    animations?: Array<{ name?: string }>;
  };
  return {
    nodes: (json.nodes ?? []).map((node) => node.name).filter((name): name is string => Boolean(name)),
    animations: (json.animations ?? []).map((clip) => clip.name).filter((name): name is string => Boolean(name))
  };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function validateAssets(
  manifest: AssetManifest,
  load: (uri: string) => Promise<Uint8Array | null>
): Promise<ValidationOk | ValidationFail> {
  const issues: ValidationIssue[] = [];
  const facts: Record<string, ManifestAsset> = {};
  for (const asset of manifest.assets) {
    const bytes = await load(asset.uri);
    if (!bytes) {
      issues.push({ id: asset.id, code: "missing", message: `${asset.uri} is missing.` });
      continue;
    }
    if (bytes.byteLength !== asset.bytes) {
      issues.push({
        id: asset.id,
        code: "hash",
        message: `${asset.id} byte length ${bytes.byteLength} != manifest ${asset.bytes}.`
      });
    }
    const hash = await sha256Hex(bytes);
    if (hash !== asset.sha256) {
      issues.push({ id: asset.id, code: "hash", message: `${asset.id} hash mismatch.` });
    }
    const parsed = parseGlbJson(bytes);
    for (const node of asset.nodes) {
      if (!parsed.nodes.includes(node)) {
        issues.push({ id: asset.id, code: "nodes", message: `Expected node ${node} was not in ${asset.id}.` });
      }
    }
    for (const clip of asset.animations) {
      if (!parsed.animations.includes(clip)) {
        issues.push({ id: asset.id, code: "clips", message: `Expected clip ${clip} was not in ${asset.id}.` });
      }
    }
    facts[asset.id] = asset;
  }
  if (issues.length) return { ok: false, issues };
  return { ok: true, manifest, facts };
}
