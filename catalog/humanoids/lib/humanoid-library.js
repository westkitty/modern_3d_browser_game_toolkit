/**
 * Reusable Three.js Humanoid Character Library helper module.
 * Works across Vite/Node/browser ES module environments without hardcoding private credentials.
 */

export const SKELETON_FAMILIES = Object.freeze({
  ROCKETBOX_BIP01: 'rocketbox-bip01',
  KAYKIT_RIG_MEDIUM: 'kaykit-rig-medium',
  KAYKIT_RIG_LARGE: 'kaykit-rig-large',
  QUATERNIUS_UNIVERSAL_65: 'quaternius-universal-65',
  QUATERNIUS_UMW_62: 'quaternius-umw-62',
  QUATERNIUS_RPG_32: 'quaternius-rpg-32',
  QUATERNIUS_KIT_BIPED: 'quaternius-kit-biped',
  QUATERNIUS_UAC_BIPED: 'quaternius-uac-biped',
  QUATERNIUS_LEGACY_BIPED: 'quaternius-legacy-biped',
  QUATERNIUS_KNIGHT_BIPED_42: 'quaternius-knight-biped-42',
  QUATERNIUS_MIXAMO_48: 'quaternius-mixamo-48',
  QUATERNIUS_LEGACY_ROBOT_58: 'quaternius-legacy-robot-58',
  QUATERNIUS_LEGACY_ALIEN_58: 'quaternius-legacy-alien-58',
  QUATERNIUS_CYBERPUNK_BIPED_25: 'quaternius-cyberpunk-biped-25',
  QUATERNIUS_CUBE_BIPED_23: 'quaternius-cube-biped-23',
  QUATERNIUS_CUBE_BIPED_7: 'quaternius-cube-biped-7',
  POLYGONALMIND_VRM_HUMANOID: 'polygonalmind-vrm-humanoid',
  POLYGONALMIND_XYZ_CUSTOM: 'polygonalmind-xyz-custom',
  KENNEY_CHARACTER_MEDIUM_FBX: 'kenney-character-medium-fbx',
  KENNEY_MINI_RIG: 'kenney-mini-rig',
  KENNEY_BLOCKY_NODE_RIG: 'kenney-blocky-node-rig',
  GDQUEST_MANNEQUIN_45: 'gdquest-mannequin-45',
  OGA_FPS_ARMS_51: 'oga-fps-arms-51',
  BARNABE_WILD_IK_RIG: 'barnabe-wild-ik-rig',
  BARNABE_WILD_MIXAMO_51: 'barnabe-wild-mixamo-51',
  NONE_STATIC_POSE: 'none-static-pose',
});

export function createHumanoidCatalog(data) {
  const catalog = data?.catalog || {};
  const sourcesDoc = data?.sources || {};
  const compatibilityDoc = data?.compatibility || {};
  const extendedDoc = data?.extended || {};
  const rocketboxDoc = data?.rocketbox || null;

  const records = Array.isArray(catalog.records) ? catalog.records : [];
  const extendedRecords = Array.isArray(extendedDoc.records) ? extendedDoc.records : [];
  const sourcesList = Array.isArray(sourcesDoc.sources) ? sourcesDoc.sources : [];

  const byId = new Map(records.map((r) => [r.asset_id, r]));
  const extendedById = new Map(extendedRecords.map((r) => [r.asset_id, r]));
  const sourcesById = new Map(sourcesList.map((s) => [s.id, s]));
  const rocketboxById = new Map(
    (Array.isArray(rocketboxDoc?.records) ? rocketboxDoc.records : []).map((r) => [r.asset_id, r])
  );

  function getById(assetId) {
    const base = byId.get(assetId);
    if (!base) return null;
    const ext = extendedById.get(assetId);
    const rb = rocketboxById.get(assetId);
    return {
      ...base,
      detail: ext || rb || null,
      source: sourcesById.get(base.source_id) || null,
    };
  }

  function search(filters = {}) {
    const q = (filters.query || '').trim().toLowerCase();
    return records.filter((r) => {
      if (filters.sourceId && r.source_id !== filters.sourceId) return false;
      if (filters.assetType && r.asset_type !== filters.assetType) return false;
      if (filters.skeletonFamily && r.skeleton_family !== filters.skeletonFamily) return false;
      if (filters.licenseId && r.license_id !== filters.licenseId) return false;
      if (filters.qaStatus && r.qa_status !== filters.qaStatus) return false;
      if (filters.tag) {
        const t = String(filters.tag).toLowerCase();
        if (!(r.style_tags || []).some((x) => String(x).toLowerCase() === t)) return false;
      }
      if (typeof filters.maxTriangles === 'number' && typeof r.triangle_count === 'number') {
        if (r.triangle_count > filters.maxTriangles) return false;
      }
      if (q) {
        const hay = `${r.asset_id} ${r.display_name} ${r.source_id} ${r.category} ${(r.style_tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function getSource(sourceId) {
    return sourcesById.get(sourceId) || null;
  }

  function listSources() {
    return [...sourcesList];
  }

  function resolveSkeletonFamily(input) {
    if (!input) return null;
    if (typeof input === 'string') {
      if (compatibilityDoc?.skeleton_families?.[input]) return input;
      const rec = byId.get(input);
      if (rec) return rec.skeleton_family || null;
      return null;
    }
    return input.skeleton_family || null;
  }

  function getCompatibility(animationOrSource, targetCharacter) {
    const srcFam = resolveSkeletonFamily(animationOrSource);
    const dstFam = resolveSkeletonFamily(targetCharacter);
    if (!srcFam || !dstFam || srcFam === 'none-static-pose' || dstFam === 'none-static-pose') {
      return {
        status: srcFam === 'none-static-pose' || dstFam === 'none-static-pose' ? 'static-unrigged' : 'unknown',
        compatible: false,
        reason:
          srcFam === 'none-static-pose' || dstFam === 'none-static-pose'
            ? 'Static posed mesh or accessory has no humanoid skeleton.'
            : 'Missing skeleton family metadata on source or target.',
        sourceFamily: srcFam,
        targetFamily: dstFam,
      };
    }
    if (srcFam === dstFam) {
      return {
        status: 'direct-compatible',
        compatible: true,
        sourceFamily: srcFam,
        targetFamily: dstFam,
        notes: compatibilityDoc?.skeleton_families?.[srcFam]?.direct_clip_sharing || 'Same verified skeleton family.',
      };
    }
    const wf = (compatibilityDoc?.retargeting_workflows || []).find(
      (w) => w.source_family === srcFam && w.target_family === dstFam
    );
    if (wf) {
      const compatible = wf.status.startsWith('SUPPORTED');
      return {
        status: wf.status.toLowerCase(),
        compatible,
        sourceFamily: srcFam,
        targetFamily: dstFam,
        workflow: wf,
      };
    }
    const incompat = (compatibilityDoc?.incompatible_pairs_explicit || []).find(
      (p) => (p.pair[0] === srcFam && p.pair[1] === dstFam) || (p.pair[1] === srcFam && p.pair[0] === dstFam)
    );
    return {
      status: 'incompatible',
      compatible: false,
      sourceFamily: srcFam,
      targetFamily: dstFam,
      reason: incompat?.reason || `Distinct skeleton families (${srcFam} vs ${dstFam}); explicit rest-pose retargeting required.`,
    };
  }

  function getCompatibleAnimations(targetAssetOrFamily) {
    const fam = resolveSkeletonFamily(targetAssetOrFamily);
    if (!fam) return [];
    return records.filter((r) => r.asset_type === 'animation_pack' && r.skeleton_family === fam);
  }

  function getModularGroups() {
    return extendedDoc?.modular_relationships || {};
  }

  return {
    summary: catalog.summary || null,
    sources: sourcesList,
    compatibilityMatrix: compatibilityDoc,
    getById,
    search,
    getSource,
    listSources,
    getCompatibility,
    getCompatibleAnimations,
    getModularGroups,
  };
}

export async function fetchHumanoidCatalog(baseUrl = '.') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const [catalog, sources, compatibility, extended] = await Promise.all([
    fetch(`${cleanBase}/catalog.json`).then((r) => r.json()),
    fetch(`${cleanBase}/sources.json`).then((r) => r.json()),
    fetch(`${cleanBase}/compatibility-matrix.json`).then((r) => r.json()),
    fetch(`${cleanBase}/characters-extended.json`).then((r) => r.json()),
  ]);
  return createHumanoidCatalog({ catalog, sources, compatibility, extended });
}

export function sanitizeBoneName(THREE, name) {
  if (!name) return '';
  if (THREE?.PropertyBinding?.sanitizeNodeName) {
    return THREE.PropertyBinding.sanitizeNodeName(name);
  }
  return String(name).replace(/[\s.:/[\]]+/g, '_');
}

export function resolveBone(root, rawName, THREE) {
  if (!root || !rawName) return null;
  const direct = root.getObjectByName(rawName);
  if (direct) return direct;
  const sanitized = sanitizeBoneName(THREE, rawName);
  return root.getObjectByName(sanitized) || null;
}

export function filterClipToRoot(THREE, clip, targetRoot) {
  const validNodes = new Set();
  targetRoot.traverse((o) => {
    if (o.name) validNodes.add(o.name);
  });
  const kept = [];
  const dropped = new Set();
  for (const track of clip.tracks) {
    const nodeName = track.name.split('.')[0];
    if (validNodes.has(nodeName)) kept.push(track.clone());
    else dropped.add(nodeName);
  }
  return {
    clip: new THREE.AnimationClip(clip.name, clip.duration, kept),
    keptTracks: kept.length,
    droppedNodes: [...dropped],
  };
}

export function bindExternalAnimation(THREE, targetRoot, animSource, options = {}) {
  const clips = Array.isArray(animSource) ? animSource : animSource?.animations || [animSource];
  const clip = options.clipName
    ? clips.find((c) => c?.name === options.clipName) || clips[0]
    : clips[0];
  if (!clip) throw new Error('No AnimationClip available to bind.');

  const { clip: filteredClip, keptTracks, droppedNodes } = filterClipToRoot(THREE, clip, targetRoot);
  const mixer = new THREE.AnimationMixer(targetRoot);
  const action = mixer.clipAction(filteredClip);
  if (options.autoPlay !== false) action.play();
  return { mixer, action, clip: filteredClip, keptTracks, droppedNodes };
}

export async function assembleModularHumanoid(THREE, loader, partUrls, options = {}) {
  const root = new THREE.Group();
  root.name = options.groupName || 'ModularHumanoid';
  const parts = [];
  for (const url of partUrls) {
    const gltf = await loader.loadAsync(url);
    root.add(gltf.scene);
    parts.push(gltf);
  }

  function playClip(clip) {
    const mixers = [];
    for (const part of parts) {
      const { mixer } = bindExternalAnimation(THREE, part.scene, [clip], { autoPlay: true });
      mixers.push(mixer);
    }
    return {
      mixers,
      update(dt) {
        for (const m of mixers) m.update(dt);
      },
      dispose() {
        for (const m of mixers) m.stopAllAction();
      },
    };
  }

  return {
    root,
    parts,
    playClip,
    dispose() {
      disposeHumanoidAsset(root);
    },
  };
}

export function attachAccessoryToBone(THREE, characterRoot, accessoryScene, boneName, offset = null) {
  const slot = resolveBone(characterRoot, boneName, THREE);
  if (!slot) {
    throw new Error(`Target attachment bone not found: ${boneName} (sanitized: ${sanitizeBoneName(THREE, boneName)})`);
  }
  if (offset?.position) accessoryScene.position.set(...offset.position);
  if (offset?.rotation) accessoryScene.rotation.set(...offset.rotation);
  if (offset?.scale) accessoryScene.scale.set(...offset.scale);
  slot.add(accessoryScene);
  return slot;
}

/**
 * Rest-pose-compensated animation retargeting via SkeletonUtils.retargetClip.
 * Preserves target bone scales so scaled wrappers (e.g. Rocketbox Bip01 0.01) do not corrupt child matrices.
 */
export function retargetAnimationClip({
  THREE,
  SkeletonUtils,
  targetRoot,
  sourceRoot,
  clip,
  boneMapTargetToSource,
  hipBone,
  stripPositionTracks = true,
  useRestOffsets = true,
}) {
  let targetSkin = null;
  let sourceSkin = null;
  targetRoot.traverse((o) => { if (!targetSkin && o.isSkinnedMesh) targetSkin = o; });
  sourceRoot.traverse((o) => { if (!sourceSkin && o.isSkinnedMesh) sourceSkin = o; });
  if (!targetSkin || !sourceSkin) {
    throw new Error('Both targetRoot and sourceRoot must contain at least one SkinnedMesh.');
  }

  const sanitizedNames = {};
  for (const [dst, src] of Object.entries(boneMapTargetToSource)) {
    sanitizedNames[sanitizeBoneName(THREE, dst)] = sanitizeBoneName(THREE, src);
  }

  const savedBones = targetSkin.skeleton.bones.map((b) => ({
    bone: b,
    pos: b.position.clone(),
    quat: b.quaternion.clone(),
    scale: b.scale.clone(),
  }));

  sourceRoot.updateMatrixWorld(true);
  targetRoot.updateMatrixWorld(true);

  const localOffsets = {};
  if (useRestOffsets) {
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const srcQ = new THREE.Quaternion();
    const dstQ = new THREE.Quaternion();
    for (const b of targetSkin.skeleton.bones) {
      const srcName = sanitizedNames[b.name];
      if (!srcName) continue;
      const srcBone = sourceRoot.getObjectByName(srcName);
      if (!srcBone) continue;
      srcBone.matrixWorld.decompose(pos, srcQ, scale);
      b.matrixWorld.decompose(pos, dstQ, scale);
      const offQ = srcQ.clone().invert().multiply(dstQ);
      localOffsets[b.name] = new THREE.Matrix4().makeRotationFromQuaternion(offQ);
    }
  }

  const retargeted = SkeletonUtils.retargetClip(targetSkin, sourceSkin, clip, {
    names: sanitizedNames,
    hip: sanitizeBoneName(THREE, hipBone),
    preservePosition: false,
    useFirstFramePosition: false,
    useTargetMatrix: true,
    localOffsets: useRestOffsets ? localOffsets : undefined,
  });

  if (stripPositionTracks) {
    retargeted.tracks = retargeted.tracks.filter((t) => !t.name.endsWith('.position'));
  }

  for (const s of savedBones) {
    s.bone.position.copy(s.pos);
    s.bone.quaternion.copy(s.quat);
    s.bone.scale.copy(s.scale);
  }
  targetSkin.skeleton.bones.forEach((b) => b.updateMatrixWorld());

  return { clip: retargeted, targetSkin, sourceSkin };
}

/**
 * Full GPU resource cleanup for loaded humanoid scenes.
 * Explicitly calls obj.skeleton.dispose() to release Three.js boneTexture allocations.
 */
export function disposeHumanoidAsset(root) {
  if (!root) return;
  const disposedMaterials = new Set();
  const disposedTextures = new Set();

  root.traverse((obj) => {
    if (obj.isSkinnedMesh && obj.skeleton) {
      obj.skeleton.dispose();
    }
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const mat of mats) {
      if (!mat || disposedMaterials.has(mat)) continue;
      disposedMaterials.add(mat);
      for (const val of Object.values(mat)) {
        if (val && val.isTexture && !disposedTextures.has(val)) {
          disposedTextures.add(val);
          val.dispose();
        }
      }
      mat.dispose();
    }
  });
}
