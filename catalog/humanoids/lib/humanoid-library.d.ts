export const SKELETON_FAMILIES: {
  readonly ROCKETBOX_BIP01: 'rocketbox-bip01';
  readonly KAYKIT_RIG_MEDIUM: 'kaykit-rig-medium';
  readonly KAYKIT_RIG_LARGE: 'kaykit-rig-large';
  readonly QUATERNIUS_UNIVERSAL_65: 'quaternius-universal-65';
  readonly QUATERNIUS_UMW_62: 'quaternius-umw-62';
  readonly QUATERNIUS_RPG_32: 'quaternius-rpg-32';
};

export interface HumanoidCatalogFilter {
  query?: string;
  sourceId?: string;
  assetType?: string;
  skeletonFamily?: string;
  licenseId?: string;
  qaStatus?: string;
  tag?: string;
  maxTriangles?: number;
}

export interface HumanoidCatalogEntry {
  asset_id: string;
  display_name: string;
  source_id: string;
  asset_type: string;
  category: string;
  style_tags: string[];
  license_id: string;
  skeleton_family: string | null;
  joint_count: number | null;
  triangle_count: number | null;
  dimensions_m: [number, number, number] | null;
  animation_count: number;
  processed_glb_basename: string;
  processed_glb_bytes: number;
  processed_glb_sha256: string;
  private_locator: string;
  qa_status: string;
  visual_approval: string;
  catalog_file: string;
}

export interface HumanoidCatalogAPI {
  summary: Record<string, unknown> | null;
  sources: Record<string, unknown>[];
  compatibilityMatrix: Record<string, unknown>;
  getById(assetId: string): (HumanoidCatalogEntry & { detail: unknown; source: unknown }) | null;
  search(filters?: HumanoidCatalogFilter): HumanoidCatalogEntry[];
  getSource(sourceId: string): Record<string, unknown> | null;
  listSources(): Record<string, unknown>[];
  getCompatibility(animationOrSource: string | HumanoidCatalogEntry, targetCharacter: string | HumanoidCatalogEntry): Record<string, unknown>;
  getCompatibleAnimations(targetAssetOrFamily: string | HumanoidCatalogEntry): HumanoidCatalogEntry[];
  getModularGroups(): Record<string, unknown>;
}

export function createHumanoidCatalog(data: {
  catalog: Record<string, unknown>;
  sources: Record<string, unknown>;
  compatibility: Record<string, unknown>;
  extended?: Record<string, unknown>;
  rocketbox?: Record<string, unknown>;
}): HumanoidCatalogAPI;

export function fetchHumanoidCatalog(baseUrl?: string): Promise<HumanoidCatalogAPI>;
export function sanitizeBoneName(THREE: unknown, name: string): string;
export function resolveBone(root: unknown, rawName: string, THREE?: unknown): unknown;
export function filterClipToRoot(THREE: unknown, clip: unknown, targetRoot: unknown): {
  clip: unknown;
  keptTracks: number;
  droppedNodes: string[];
};
export function bindExternalAnimation(THREE: unknown, targetRoot: unknown, animSource: unknown, options?: {
  clipName?: string;
  autoPlay?: boolean;
}): { mixer: unknown; action: unknown; clip: unknown; keptTracks: number; droppedNodes: string[] };
export function assembleModularHumanoid(THREE: unknown, loader: { loadAsync(url: string): Promise<unknown> }, partUrls: string[], options?: {
  groupName?: string;
}): Promise<{
  root: unknown;
  parts: unknown[];
  playClip(clip: unknown): { mixers: unknown[]; update(dt: number): void; dispose(): void };
  dispose(): void;
}>;
export function attachAccessoryToBone(THREE: unknown, characterRoot: unknown, accessoryScene: unknown, boneName: string, offset?: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
} | null): unknown;
export function retargetAnimationClip(params: {
  THREE: unknown;
  SkeletonUtils: unknown;
  targetRoot: unknown;
  sourceRoot: unknown;
  clip: unknown;
  boneMapTargetToSource: Record<string, string>;
  hipBone: string;
  stripPositionTracks?: boolean;
  useRestOffsets?: boolean;
}): { clip: unknown; targetSkin: unknown; sourceSkin: unknown };
export function disposeHumanoidAsset(root: unknown): void;
