export const SKELETON_FAMILIES: {
  readonly ROCKETBOX_BIP01: 'rocketbox-bip01';
  readonly KAYKIT_RIG_MEDIUM: 'kaykit-rig-medium';
  readonly KAYKIT_RIG_LARGE: 'kaykit-rig-large';
  readonly QUATERNIUS_UNIVERSAL_65: 'quaternius-universal-65';
  readonly QUATERNIUS_UMW_62: 'quaternius-umw-62';
  readonly QUATERNIUS_RPG_32: 'quaternius-rpg-32';
  readonly QUATERNIUS_KIT_BIPED: 'quaternius-kit-biped';
  readonly QUATERNIUS_UAC_BIPED: 'quaternius-uac-biped';
  readonly QUATERNIUS_LEGACY_BIPED: 'quaternius-legacy-biped';
  readonly QUATERNIUS_KNIGHT_BIPED_42: 'quaternius-knight-biped-42';
  readonly QUATERNIUS_MIXAMO_48: 'quaternius-mixamo-48';
  readonly QUATERNIUS_LEGACY_ROBOT_58: 'quaternius-legacy-robot-58';
  readonly QUATERNIUS_LEGACY_ALIEN_58: 'quaternius-legacy-alien-58';
  readonly QUATERNIUS_CYBERPUNK_BIPED_25: 'quaternius-cyberpunk-biped-25';
  readonly QUATERNIUS_CUBE_BIPED_23: 'quaternius-cube-biped-23';
  readonly QUATERNIUS_CUBE_BIPED_7: 'quaternius-cube-biped-7';
  readonly POLYGONALMIND_VRM_HUMANOID: 'polygonalmind-vrm-humanoid';
  readonly POLYGONALMIND_XYZ_CUSTOM: 'polygonalmind-xyz-custom';
  readonly KENNEY_CHARACTER_MEDIUM_FBX: 'kenney-character-medium-fbx';
  readonly KENNEY_MINI_RIG: 'kenney-mini-rig';
  readonly KENNEY_BLOCKY_NODE_RIG: 'kenney-blocky-node-rig';
  readonly GDQUEST_MANNEQUIN_45: 'gdquest-mannequin-45';
  readonly OGA_FPS_ARMS_51: 'oga-fps-arms-51';
  readonly BARNABE_WILD_IK_RIG: 'barnabe-wild-ik-rig';
  readonly BARNABE_WILD_MIXAMO_51: 'barnabe-wild-mixamo-51';
  readonly NONE_STATIC_POSE: 'none-static-pose';
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
