# Three.js Reusable Humanoid Character Library (`catalog/humanoids/`)

A source-grounded, cross-project humanoid character, outfit, prop, and animation library for Three.js `0.185+` projects, pairing public searchable metadata and runtime utilities in GitHub with immutable original archives and self-contained GLB 2.0 assets stored in private Google Drive (`GPT/ThreeJS_Humanoid_Library/`).

> **Honest Release & Approval Status:**
> - **296** cataloged assets (**115** Microsoft Rocketbox avatars + **181** multi-source KayKit & Quaternius GLBs across 9 free/Standard packs) have passed static GLB2 validation, Three.js `0.185.1` Chromium/WebGL2 runtime smoke checks, and private archival verification.
> - **0** human production visual signoffs, **0** physical mobile hardware runs, **0** sustained multi-hour GPU soak runs, and **0** full-game combat/physics integrations have been executed. All assets therefore carry `visual_approval: "VISUAL_APPROVAL_PENDING"` until reviewed in your target game.

---

## Inventory Summary (Verified 2026-11-14)

| Source Pack | Edition / License | Verified Contents | Skeleton Family (Joints) | QA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Microsoft Rocketbox** (`0943055d`) | MIT | **115** avatars (`115` GLBs, `230` QA PNGs; incl. recovered `Medical_Female_01`) | `rocketbox-bip01` (80–81) | 115/115 Browser Smoke Passed |
| **KayKit Adventurers** (`2.0 FREE`) | CC0-1.0 | **6** char GLBs (5 chars + `Rogue_Hooded`), **2** anim GLBs (26 clips), **31** accessory GLBs (`39` total GLBs) | `kaykit-rig-medium` (23) | Browser Smoke Passed |
| **KayKit Skeletons** (`1.1 FREE`) | CC0-1.0 | **4** specialized skeletal humanoid GLBs, **2** anim GLBs (26 clips), **13** accessory GLBs (`19` total GLBs) | `kaykit-rig-medium` (23) | Browser Smoke Passed |
| **KayKit Character Animations** (`1.1 FREE`) | CC0-1.0 | `2` mannequins (`Mannequin_Medium` 21j, `Mannequin_Large` 23j), `8` `Rig_Medium` GLBs (`131` non-T-Pose clips), `6` `Rig_Large` GLBs (`28` non-T-Pose clips) (`16` total GLBs) | `kaykit-rig-medium` / `kaykit-rig-large` | Browser Smoke Passed |
| **Quaternius Universal Base Characters** | Standard FREE (`CC0-1.0`) | **2** bases (`Superhero_Female_FullBody`, `Superhero_Male_FullBody` — vs 6 advertised in paid Source), **8** rigged + **8** origin-0 hairstyles (`18` total GLBs) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius Modular Character Outfits — Fantasy** | Standard FREE (`CC0-1.0`) | **4** combined outfits + **20** modular part GLBs + **2** texture variations (`24` total GLBs — vs 12 outfits / 62 parts in paid Source) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius UAL1 & UAL2** | Standard FREE (`CC0-1.0`) | `UAL1_Standard` + `_RM` (`43` clips each), `UAL2_Standard` + `_RM` (`43` clips each), `Mannequin_F` (`5` total GLBs) | `quaternius-universal-65` (65) | Browser Smoke Passed |
| **Quaternius Ultimate Modular Women** | Full Free Release (`CC0-1.0`) | **10** character GLBs (`24` embedded clips each), **41** modular part GLBs (FBX→GLB via Blender), `UMW_Animations.glb` (`24` clips), `Gun.glb`, `Sword.glb` (`54` total GLBs) | `quaternius-umw-62` (62) | Browser Smoke Passed |
| **Quaternius RPG Characters** | Full Free Release (`CC0-1.0`) | **6** fantasy character GLBs with class weapon clips (`11–15` clips each) (`6` total GLBs) | `quaternius-rpg-32` (32) | Browser Smoke Passed |

Generator/account-dependent systems (**MakeHuman**, **VRoid Studio**, **Adobe Mixamo**) remain preserved as reference entries in `sources.json` and are not auto-distributed. Quaternius QAL-restricted animation assets are excluded.

---

## Verified Skeleton Families & Compatibility

See [`compatibility-matrix.json`](./compatibility-matrix.json) for full bone lists and workflows:

1. **`quaternius-universal-65` (65 joints, UE Mannequin names):** Exact joint-set match across `UBC Standard`, `Modular Fantasy Outfits` (and all 20 parts), `UAL1_Standard`, `UAL2_Standard`, and `Mannequin_F`. Pair ONLY the head of UBC with full Fantasy Outfits to avoid arm/torso clipping.
2. **`kaykit-rig-medium` (23 joints):** Shared across all KayKit Adventurers, Skeletons, and `Rig_Medium` animations (`131` unique non-T-Pose clips). `Mannequin_Medium` (21 joints) omits `handslot.l`/`handslot.r`; filter missing tracks via `filterClipToRoot`.
3. **`kaykit-rig-large` (23 joints):** Shared between `Mannequin_Large` and all `Rig_Large` animation packs (`28` non-T-Pose clips). Keep separate from `Rig_Medium` translation curves unless retargeted.
4. **`rocketbox-bip01` (80–81 joints):** 3ds Max cm Biped beneath a `0.01`-scaled `Bip01` root. Compatible within Rocketbox.
5. **`quaternius-umw-62` (62 joints):** All 10 UMW characters, 41 modular parts, and `UMW_Animations.glb` (`24` clips) share this rig directly. Because `Foot.L/R` and `PT.L/R` are detached IK control bones under `Root`, rotation-only FK retargeting (`UAL1` → `UMW`) leaves boots anchored at origin and **distorts lower legs** — use UMW's native 24 clips instead.
6. **`quaternius-rpg-32` (32 joints):** Each RPG character uses its own embedded `11–15` animation clips.

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
- Filter all **296** catalog records by keyword, source pack, asset type, skeleton family, or QA status.
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
- [`sources.json`](./sources.json) — Authoritative 13 source pack records (MIT/CC0/generator statuses + archive SHA-256s).
- [`catalog.json`](./catalog.json) — Unified 296-entry searchable index (115 Rocketbox + 181 multi-source GLBs).
- [`rocketbox-characters.json`](./rocketbox-characters.json) — Detailed 115-avatar Microsoft Rocketbox manifest (preserved 1:1).
- [`characters-extended.json`](./characters-extended.json) — Detailed 181-GLB manifest for the 9 KayKit/Quaternius packs + modular outfit groupings.
- [`compatibility-matrix.json`](./compatibility-matrix.json) — Verified 6-skeleton compatibility rules and documented retargeting maps.
- [`lib/humanoid-library.js`](./lib/humanoid-library.js) & [`lib/humanoid-library.d.ts`](./lib/humanoid-library.d.ts) — Reusable Three.js/Node/TS library module.
- [`inspector.html`](./inspector.html) & [`inspector.js`](./inspector.js) — Standalone catalog browser and local GLB inspector.
- [`tools/humanoid-library.test.mjs`](./tools/humanoid-library.test.mjs) — Automated schema, compatibility, disposal, and secret-leak tests.
