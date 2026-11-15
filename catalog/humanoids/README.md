# Three.js Reusable Humanoid Character Library (`catalog/humanoids/`)

A source-grounded, cross-project humanoid character, outfit, prop, and animation library for Three.js `0.185+` projects, pairing public searchable metadata and runtime utilities in GitHub with immutable original archives and self-contained GLB 2.0 assets stored in private Google Drive (`GPT/ThreeJS_Humanoid_Library/`).

> **Honest Release & Approval Status:**
> - **786** cataloged assets (**115** Microsoft Rocketbox avatars + **671** multi-source GLBs across **37** asset-bearing packs: **181** from 9 KayKit/Quaternius baseline packs + **490** from 28 newly admitted expansion packs) have passed static GLB2 validation, Three.js `0.185.1` Chromium/WebGL2 runtime smoke checks, and GPU disposal checks (`0` geometry/texture leak).
> - Two additional expansion candidates are recorded in [`sources.json`](./sources.json) with **0** admitted assets: **`quaternius-sci-fi-essentials-kit`** (`292` archive entries inspected, `0` humanoids found — non-humanoid drones/arthropods/weapons only; original ZIP archived privately) and **`blender-human-base-meshes`** (`BLOCKED` by `HTTP/2 403 cf-mitigated: challenge` Cloudflare anti-bot check; never bypassed).
> - **0** human production visual signoffs, **0** physical mobile hardware runs, **0** sustained multi-hour GPU soak runs, and **0** full-game combat/physics integrations have been executed. All assets carry `visual_approval: "VISUAL_APPROVAL_PENDING"` until reviewed in your target game.

---

## Inventory Summary (Verified 2026-11-15)

| Source Pack | Edition / License | Verified Admitted Contents | Skeleton Family (Joints) | QA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Microsoft Rocketbox** (`0943055d`) | MIT | **115** avatars (`115` GLBs, `230` QA PNGs; incl. recovered `Medical_Female_01`) | `rocketbox-bip01` (80–81) | 115/115 Browser Smoke Passed |
| **KayKit Adventurers** (`2.0 FREE`) | CC0-1.0 | **6** chars, **2** anim GLBs (26 clips), **31** accessories (`39` GLBs) | `kaykit-rig-medium` (23) | Browser Smoke Passed |
| **KayKit Skeletons** (`1.1 FREE`) | CC0-1.0 | **4** skeletal humanoids, **2** anim GLBs (26 clips), **13** accessories (`19` GLBs) | `kaykit-rig-medium` (23) | Browser Smoke Passed |
| **KayKit Character Animations** (`1.1 FREE`) | CC0-1.0 | **2** mannequins, **8** `Rig_Medium` (`131` non-T-Pose clips), **6** `Rig_Large` (`28` non-T-Pose clips) (`16` GLBs) | `kaykit-rig-medium` / `kaykit-rig-large` | Browser Smoke Passed |
| **Quaternius Universal Base Characters** | Standard FREE (`CC0-1.0`) | **2** bases, **8** rigged + **8** origin-0 hairstyles (`18` GLBs) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius Modular Character Outfits — Fantasy** | Standard FREE (`CC0-1.0`) | **4** outfits + **20** modular part GLBs (`24` GLBs) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius UAL1 & UAL2** | Standard FREE (`CC0-1.0`) | `UAL1_Standard` + `_RM`, `UAL2_Standard` + `_RM`, `Mannequin_F` (`5` GLBs) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius Ultimate Modular Women** | Full Free (`CC0-1.0`) | **10** chars (24 clips ea.), **41** modular parts, `UMW_Animations.glb`, `2` accessories (`54` GLBs) | `quaternius-umw-62` (62/79) | Browser Smoke Passed |
| **Quaternius RPG Characters** | Full Free (`CC0-1.0`) | **6** fantasy characters (11–15 clips ea.) (`6` GLBs) | `quaternius-rpg-32` (32) | Browser Smoke Passed |
| **Polygonal Mind 100 Avatars R1** | CC0-1.0 (`License.md`) | **100** static VRM-derived humanoid avatars (`100` GLBs, 42 char prefixes + `vrm_meta`) | `polygonalmind-vrm-humanoid` | Browser Smoke Passed |
| **Polygonal Mind 100 Avatars R2** | CC0-1.0 (`License.md`) | **100** static VRM-derived humanoid avatars (`100` GLBs, `mixamorig:*` + `vrm_meta`) | `polygonalmind-vrm-humanoid` | Browser Smoke Passed |
| **Polygonal Mind XYZ Creatures** | CC0-1.0 (`License.md`) | **6** humanoid creatures (`01`..`44`; 54 quadruped/blob/arachnid/quad-arm creatures excluded) (`6` GLBs) | `polygonalmind-xyz-custom` (21–32) | Browser Smoke Passed |
| **GDQuest Open 3D Mannequin** | **CC-BY-4.0** (attribution: `GDQuest and contributors`) | `mannequiny_v0_3_0_rigged` (10 clips), `v0_4_0_rigged` (11 clips), `v0_4_0_mesh_only` base mesh (`3` GLBs) | `gdquest-mannequin-45` (45) / `null` | Browser Smoke Passed |
| **OGA Rigged First Person Arms** | CC0-1.0 | **1** partial upper-limb FPS arm rig (`fps_arms_rigged`, `0` clips) (`1` GLB) | `oga-fps-arms-51` (51) | Browser Smoke Passed |
| **Kenney Animated Characters (Protagonists / Retro / Survivors)** | CC0-1.0 (`License.txt`) | **4** + **4** + **4** = **12** rigged FBX→GLB skins across 3 packs (idle/jump/run) (`12` GLBs) | `kenney-character-medium-fbx` (58) | Browser Smoke Passed |
| **Kenney Mini Characters** | CC0-1.0 (`License.txt`) | **20** 7-joint animated mini characters + **13** zero-joint accessory items (`10` props excluded) (`33` GLBs) | `kenney-mini-rig` (7) / `null` | Browser Smoke Passed |
| **Kenney Blocky Characters** | CC0-1.0 (`License.txt`) | **18** node-hierarchy animated characters (`0` skin joints, 27 node clips ea.) (`18` GLBs) | `kenney-blocky-node-rig` (0 nodes) | Browser Smoke Passed |
| **Barnabe Wild LowPoly Character** | CC0-1.0 | `char_rigged_ik` (`25`j French IK, ~7.38 m, 2 clips) + `mocap_preview` (`51`j Mixamo FK, 3 clips) (`2` GLBs) | `barnabe-wild-ik-rig` / `barnabe-wild-mixamo-51` | Browser Smoke Passed |
| **Quaternius Ultimate Animated Character Pack** | CC0-1.0 | **47** animated characters (16–17 clips ea.) + **3** hat/glasses accessories (`2` hats excluded) (`50` GLBs) | `quaternius-uac-biped` (23) / `null` | Browser Smoke Passed |
| **Quaternius Ultimate Modular Men** | CC0-1.0 | **11** chars (24 clips ea.), **47** modular parts (`62j`/`79j`), `umm_animations.glb` (24 clips; 1 broken empty file excluded) (`59` GLBs) | `quaternius-umw-62` (62/79) | Browser Smoke + Assembly CDP Passed |
| **Quaternius Background Posed Humans** | CC0-1.0 | **20** static posed human meshes + **8** modular hairstyles (`28` GLBs) | `none-static-pose` (0) | Browser Smoke Passed |
| **Quaternius Animated Men & Women** | CC0-1.0 | **8** Animated Men + **8** Animated Women (11 clips ea.) (`16` GLBs) | `quaternius-legacy-biped` (42) | Browser Smoke Passed |
| **Quaternius Animated Man / Woman / Zombie** | CC0-1.0 | **6** Man + **4** Woman + **2** Zombie characters (~4.8–8.1 m FBX scale) (`12` GLBs) | `quaternius-mixamo-48` (48) | Browser Smoke Passed |
| **Quaternius Animated Knight** | CC0-1.0 | `KnightCharacter` (12 clips, `Thumb.L/R`) + **8** shield/sword/helmet accessories (`9` GLBs) | `quaternius-knight-biped-42` (42) / `null` | Browser Smoke Passed |
| **Quaternius Animated Robot & Animated Alien** | CC0-1.0 | `Robot` (14 clips, `Palm*`) + **2** Aliens (`Alien`, `Alien_Helmet`, 14 clips, `Index/Middle/Pinky`) (`3` GLBs) | `quaternius-legacy-robot-58` / `quaternius-legacy-alien-58` | Browser Smoke Passed |
| **Quaternius Kit Bipeds (Pirate / Zombie Apoc. / Toon Shooter / Ultimate Space)** | CC0-1.0 | **7** Pirate (`5` chars + `2` skeletons; shark + 65 props excl.) + **10** Zombie Apoc. (54 props + `zombie_ribcage` excl.) + **3** Toon Shooter (71 props excl.) + **5** Ultimate Space (`87` props + `enemy_small`/`extrasmall`/`mech_*` excl.) (`25` GLBs) | `quaternius-kit-biped` (33–50; core 43) | Browser Smoke Passed |
| **Quaternius Cyberpunk Kit** | CC0-1.0 | **1** protagonist (`character`, 22 clips; `70` props + `enemy_2legs*`/`enemy_large*` non-humanoids excl.) (`1` GLB) | `quaternius-cyberpunk-biped-25` (25) | Browser Smoke Passed |
| **Quaternius Cube World Kit** | CC0-1.0 | **4** Cube humanoids (18 clips) + **8** Cube biped enemies/skeletons (7 clips; `95` props/animals excl.) (`12` GLBs) | `quaternius-cube-biped-23` / `quaternius-cube-biped-7` | Browser Smoke Passed |
| **Quaternius Sci-Fi Essentials Kit (Standard)** | CC0-1.0 | **0** admitted (`292` archive entries inspected — drones/arthropods/weapons only; original ZIP archived privately) | `null` | Audited Zero Humanoids |
| **Blender Studio Human Base Meshes** | CC0-1.0 (advertised) | **0** admitted (`www.blender.org/download/demo-files/` returned `HTTP/2 403 cf-mitigated: challenge`; not bypassed) | `null` | `BLOCKED` |

Generator/account-dependent systems (**MakeHuman**, **VRoid Studio**, **Adobe Mixamo**) remain preserved as reference entries in `sources.json` (`43` total entries) and are not auto-distributed. Quaternius QAL-restricted animation assets remain excluded.

---

## Verified Skeleton Families & Compatibility

See [`compatibility-matrix.json`](./compatibility-matrix.json) for full bone lists and workflows:

1. **`quaternius-universal-65` (65 joints, UE Mannequin names):** Exact joint-set match across `UBC Standard`, `Modular Fantasy Outfits` (and all 20 parts), `UAL1_Standard`, `UAL2_Standard`, and `Mannequin_F`. Pair ONLY the head of UBC with full Fantasy Outfits to avoid arm/torso clipping.
2. **`kaykit-rig-medium` (23 joints):** Shared across all KayKit Adventurers, Skeletons, and `Rig_Medium` animations (`131` unique non-T-Pose clips). `Mannequin_Medium` (21 joints) omits `handslot.l`/`handslot.r`; filter missing tracks via `filterClipToRoot`.
3. **`kaykit-rig-large` (23 joints):** Shared between `Mannequin_Large` and all `Rig_Large` animation packs (`28` non-T-Pose clips). Keep separate from `Rig_Medium` translation curves unless retargeted.
4. **`rocketbox-bip01` (80–81 joints):** 3ds Max cm Biped beneath a `0.01`-scaled `Bip01` root. Compatible within Rocketbox.
5. **`quaternius-umw-62` (62 core joints / 79 w/ `_end` leaf bones):** All 10 UMW characters, 41 UMW modular parts, `UMW_Animations.glb`, all 11 **Ultimate Modular Men** characters, 47 UMM modular parts, and `umm_animations.glb` (`24` clips) share this exact rig and bind cleanly via `filterClipToRoot` / `assembleModularHumanoid` (UMM 5-part Adventurer assembly verified in Chromium/WebGL2). Because `Foot.L/R` and `PT.L/R` are detached IK control bones under `Root`, rotation-only FK retargeting (`UAL1` → `UMW`) leaves boots anchored at origin and **distorts lower legs** — use UMW/UMM native clips instead.
6. **`quaternius-rpg-32` (32 joints):** Each RPG character uses its own embedded `11–15` animation clips.
7. **Additional Expansion Rigs (19 families in [`compatibility-matrix.json`](./compatibility-matrix.json) + `none-static-pose`):**
   - `polygonalmind-vrm-humanoid` (`200` static avatars preserving `vrm_meta.humanoid_bone_map`), `polygonalmind-xyz-custom` (`6` humanoid creatures with custom per-creature bone names).
   - `kenney-character-medium-fbx` (`12` chars across Protagonists/Retro/Survivors), `kenney-mini-rig` (`20` 7-joint chars), `kenney-blocky-node-rig` (`18` node-hierarchy animated characters, `0` skin joints).
   - `quaternius-kit-biped` (`25` admitted kit characters across Pirate/Toon Shooter/Zombie Apoc./Ultimate Space), `quaternius-uac-biped` (`47` UAC chars with `Root = Bone`), `quaternius-cube-biped-23` (`4` chars with `Root = Root`) & `quaternius-cube-biped-7` (`8` voxel enemies/skeletons), `quaternius-cyberpunk-biped-25` (`1`), `quaternius-legacy-biped` (`16` Animated Men/Women), `quaternius-knight-biped-42` (`1`, `Thumb.L/R`), `quaternius-mixamo-48` (`12`, `4.8–8.1 m` scale), `quaternius-legacy-robot-58` (`1`), `quaternius-legacy-alien-58` (`2`).
   - `gdquest-mannequin-45` (`2` rigged mannequins; **`CC-BY-4.0`** attribution required), `oga-fps-arms-51` (`1` partial upper-limb FPS arm rig), `barnabe-wild-ik-rig` (`1`, `~7.38 m` French IK) & `barnabe-wild-mixamo-51` (`1`, `~1.80 m` Mixamo FK).
   - `none-static-pose` (`28` unrigged posed crowd meshes and hairstyles in `quaternius-background-posed-humans`).

### Documented Retargeting Workflows (`SkeletonUtils.retargetClip`)
- **`quaternius-universal-65` → `kaykit-rig-medium` (`SUPPORTED_ROTATION_RETARGET_WITH_REST_OFFSETS`):** Proven visually in Chromium (`17_retarget_ual1_to_kaykit_knight`) using rest-pose world-rotation offsets and stripping `.position` tracks.
- **`quaternius-universal-65` → `rocketbox-bip01` (`SUPPORTED_WITH_SCALE_WRAPPER_AND_REST_POSE_CAVEATS`):** Proven visually in Chromium (`16_retarget_ual1_to_rocketbox_male01`) by normalizing `Bip01` (`0.01`) bone scale restoration and applying rest-pose offsets; minor left-forearm inward twist remains from A-pose/T-pose rest roll.

### Verified Upstream Caveats & Three.js Gotchas
- **Three.js Bone Sanitization:** `GLTFLoader` rewrites dots and spaces using `PropertyBinding.sanitizeNodeName` (`handslot.r` → `handslotr`, `Shoulder.L` → `ShoulderL`, `Bip01 Pelvis` → `Bip01_Pelvis`). Use `resolveBone()` / `retargetAnimationClip()` from [`lib/humanoid-library.js`](./lib/humanoid-library.js).
- **Mandatory `skeleton.dispose()`:** Chromium 5-cycle GPU disposal checks proved that omitting `obj.skeleton.dispose()` leaks one WebGL `DataTexture` (`boneTexture`) per `SkinnedMesh`. Use `disposeHumanoidAsset(root)`.
- **Upstream Source Fixes Applied in Processed GLBs:** Fixed 3 missing `*_png.png` texture URIs in Quaternius UBC Standard (`T_Eye_Normal.png`, `T_Hair_1_Normal.png`) and normalized Maya-inverted `Alpha = 0.0` (`alphaMode: MASK`) to opaque `Alpha = 1.0` on UMW FBX→GLB modular parts. Original source ZIPs remain untouched in private storage.

---

## Standalone Catalog Browser & Local GLB Inspector

Open [`inspector.html`](./inspector.html) via any static HTTP server serving the repository root (e.g., `npx vite` -> `/catalog/humanoids/inspector.html`):
- Filter all **786** catalog records by keyword, source pack, asset type, skeleton family, or QA status (the inspector table displays the first 250 matching rows for UI responsiveness).
- View exact private recovery commands, SHA-256 hashes, joint counts, bounds, and cross-rig compatibility.
- Drag & drop any **authorized local `.glb`** onto the WebGL2 viewport to inspect mesh triangles, bone count, live `SkeletonHelper`, animation clips, bounds, and GPU disposal. No private Drive credentials are embedded or transmitted.

---

## Quick Integration Example (Three.js ESM)

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
  fetchHumanoidCatalog,
  bindExternalAnimation,
  attachAccessoryToBone,
  assembleModularHumanoid,
  retargetAnimationClip,
  disposeHumanoidAsset,
} from './catalog/humanoids/lib/humanoid-library.js';

const catalog = await fetchHumanoidCatalog('./catalog/humanoids');
const knightMeta = catalog.getById('kaykit-adventurers/character/knight');
const compatAnims = catalog.getCompatibleAnimations(knightMeta);

const loader = new GLTFLoader();
const knight = await loader.loadAsync('/local-assets/Knight.glb');
const animPack = await loader.loadAsync('/local-assets/Rig_Medium_CombatMelee.glb');
const sword = await loader.loadAsync('/local-assets/sword_1handed.glb');

attachAccessoryToBone(THREE, knight.scene, sword.scene, 'handslot.r');
const { mixer } = bindExternalAnimation(THREE, knight.scene, animPack, {
  clipName: 'Melee_1H_Attack_Chop',
});

// In render loop: mixer.update(dt);
// On scene teardown (zero boneTexture or geometry leak):
mixer.stopAllAction();
disposeHumanoidAsset(knight.scene);
```

## Public Files Index
- [`sources.json`](./sources.json) — Authoritative 43 source pack records (1 Rocketbox, 9 baseline packs, 30 expansion candidates incl. 1 zero-humanoid & 1 Cloudflare-blocked entry, and 3 reference-only tools).
- [`catalog.json`](./catalog.json) — Unified 786-entry searchable index (115 Rocketbox + 671 multi-source GLBs).
- [`rocketbox-characters.json`](./rocketbox-characters.json) — Detailed 115-avatar Microsoft Rocketbox manifest (preserved 1:1).
- [`characters-extended.json`](./characters-extended.json) — Detailed 671-GLB manifest across 36 free/Standard packs + Fantasy Outfits, UMW, and UMM modular groupings.
- [`compatibility-matrix.json`](./compatibility-matrix.json) — Verified 25-skeleton compatibility rules and documented retargeting maps.
- [`lib/humanoid-library.js`](./lib/humanoid-library.js) & [`lib/humanoid-library.d.ts`](./lib/humanoid-library.d.ts) — Reusable Three.js/Node/TS library module.
- [`inspector.html`](./inspector.html) & [`inspector.js`](./inspector.js) — Standalone catalog browser and local GLB inspector.
- [`tools/humanoid-library.test.mjs`](./tools/humanoid-library.test.mjs) — Automated schema, compatibility, disposal, and secret-leak tests.
