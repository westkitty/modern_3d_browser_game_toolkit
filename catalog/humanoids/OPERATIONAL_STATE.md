# Operational State — Reusable Three.js Humanoid Character Library

Last Updated (UTC): `2026-11-15T05:33:32Z`
Branch: `feat/humanoid-asset-catalog-20261113`
Private Archive Root: `GPT/ThreeJS_Humanoid_Library/` (Google Drive; NO Drive folder/file IDs or tokens stored in GitHub)

---

## Current Library Totals (Verified)

| Metric | Count | Status & Evidence Tier |
| :--- | :---: | :--- |
| **Total Cataloged Assets** | **786** | `catalog/humanoids/catalog.json` (`115` Rocketbox + `671` multi-source GLBs) |
| **Microsoft Rocketbox Avatars** | **115** | Protected historical checkpoint (`ARCHIVE/2026-11-13/`): `115` original archives, `115` GLBs, `230` QA PNGs, incl. recovered `Medical_Female_01` |
| **Baseline Multi-Source GLBs (9 packs)** | **181** | Protected checkpoint (`ARCHIVE/2026-11-14/`): `9` KayKit & Quaternius free/Standard packs |
| **Expansion Multi-Source GLBs (30 candidates -> 28 admitted packs)** | **490** | Archived in `ARCHIVE/2026-11-14_expansion/`; `28` packs admitted (`1` zero-humanoid `quaternius-sci-fi-essentials-kit` archived original-only; `1` `blender-human-base-meshes` `BLOCKED` by Cloudflare `HTTP/2 403`) |
| **Sources Cataloged (`sources.json`)** | **43** | `1` Rocketbox + `9` baseline packs + `30` expansion candidates + `3` reference-only tools (`MakeHuman`, `VRoid Studio`, `Adobe Mixamo`) |
| **Skeleton Families Mapped** | **25** | Mapped in `compatibility-matrix.json` (+ `none-static-pose` for `28` unrigged crowd poses/hairstyles; `26` keys exported in `SKELETON_FAMILIES`) |
| **Chromium WebGL2 / Three.js `0.185.1` Validation** | **17 + 502 Passed** | `17/17` baseline cases + `502/502` expansion GLBs (`490` admitted + `12` quarantined non-humanoids before removal); `0` failures; 5-cycle disposal net leak = `0` geometries / `0` textures; UMM 5-part modular assembly + inspector `786`-entry CDP checks passed |
| **Private Drive Metadata & Roundtrip Verification (`2026-11-14_expansion`)** | **100% Metadata + 20/20 SHA-256** | `1,160` remote files (`1,938,660,947` B); `879/879` local expected files + `17/17` Quaternius original ZIPs matched (`0` missing, `0` size mismatch via `lsjson`); separate `20/20` stratified sample verified byte-for-byte SHA-256 via full re-download |
| **Automated Catalog, Type & Toolkit Tests** | **All Passing** | `tsc --noEmit`, `54/54` `vitest` tests, `vite build`, `6/6` `humanoid-library.test.mjs` tests, `test_inspector_cdp.mjs` (`786` records) |
| **Production Human / Mobile / Sustained GPU / Game Signoffs** | **0** | Not yet performed; all assets remain `VISUAL_APPROVAL_PENDING` |

---

## Chronological Checkpoint Ledger

### 1. Rocketbox Baseline Checkpoint (`ARCHIVE/2026-11-13/`) — Protected Unmodified
- Source: `microsoft/Microsoft-Rocketbox` commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9` (MIT License).
- 115 unique avatars archived as originals (`originals/`), converted GLBs (`processed-glb/`), 230 individual 768x768 WebGL2 QA PNGs (`Visual_QA_*`), and V4 private manifests (`ROCKETBOX_115_PRIVATE_MASTER_INDEX_V4.json`).
- `Medical_Female_01` fully recovered (`Rocketbox_Medical_Female_01_Complete_Source_2026-11-14.zip` + `Medical_Female_01.glb`, GitHub Actions run `43644401403`).
- `rocketbox-characters.json` preserves all 115 `asset_id`s untouched.

### 2. Multi-Source 9-Pack Baseline (`ARCHIVE/2026-11-14/`) — Protected Unmodified
All 9 free/Standard packs (`181` GLBs) remain intact (`kaykit-adventurers` `39`, `kaykit-skeletons` `19`, `kaykit-character-animations` `16`, `quaternius-universal-base-characters-standard` `18`, `quaternius-modular-character-outfits-fantasy-standard` `24`, `quaternius-ual1-standard` `2`, `quaternius-ual2-standard` `3`, `quaternius-ultimate-modular-women` `54`, `quaternius-rpg-characters` `6`).

### 3. 30-Source Selected Expansion (`ARCHIVE/2026-11-14_expansion/`) — Verified Complete
- **10 Cloud-Built / Downloaded Sources (`273` admitted GLBs):**
  - `polygonalmind-100-avatars-r1` (`100` GLBs, `polygonalmind-vrm-humanoid` w/ 42 char prefixes + `vrm_meta`), `polygonalmind-100-avatars-r2` (`100` GLBs, `mixamorig:*` + `vrm_meta`), `polygonalmind-xyz-creatures` (`6` admitted humanoid creatures; `54` non-humanoids excluded).
  - `gdquest-open-3d-mannequin` (`3` GLBs: `v0.3.0`, `v0.4.0` rigged, `v0.4.0` base mesh; **`CC-BY-4.0`** requiring attribution to `GDQuest and contributors`).
  - `oga-rigged-fps-arms` (`1` partial upper-limb FPS arm rig, `0` clips).
  - `kenney-animated-protagonists` (`4`), `kenney-animated-retro` (`4`), `kenney-animated-survivors` (`4` -> `kenney-character-medium-fbx`, `58`j), `kenney-mini-characters` (`20` `7j` mini chars + `13` zero-joint accessories; `10` props excluded), `kenney-blocky-characters` (`18` node-hierarchy animated characters, `0` skin joints, `27` node clips).
- **1 Local Archive Direct Pack (`2` admitted GLBs):** `barnabe-wild-lowpoly-character` (`char_rigged_ik` `25`j French IK at `~7.38 m` + `mocap_preview` `51`j Mixamo FK at `~1.80 m`).
- **17 Local Google Drive Quaternius Packs (`215` admitted GLBs across `16` admitted packs + `1` zero-humanoid pack):**
  - `quaternius-ultimate-animated-character` (`47` chars + `3` accessories = `50`), `quaternius-ultimate-modular-men` (`11` chars + `47` modular parts + `umm_animations.glb` = `59`, sharing `quaternius-umw-62`; `5`-part Adventurer assembly verified in CDP WebGL2), `quaternius-background-posed-humans` (`20` static posed humans + `8` hairstyles = `28`, `none-static-pose`), `quaternius-animated-men` (`8`) & `quaternius-animated-women` (`8`), `quaternius-animated-man` (`6`), `quaternius-animated-woman` (`4`), `quaternius-animated-zombie` (`2`), `quaternius-animated-knight` (`1` char + `8` accessories = `9`), `quaternius-animated-robot` (`1`), `quaternius-animated-alien` (`2`), `quaternius-pirate-kit` (`7`), `quaternius-zombie-apocalypse-kit` (`10`), `quaternius-toon-shooter-kit` (`3`), `quaternius-cyberpunk-kit` (`1`), `quaternius-ultimate-space-kit` (`5`), `quaternius-cube-world-kit` (`4` `23j` chars + `8` `7j` enemies/skeletons = `12`).
  - `quaternius-sci-fi-essentials-kit` (`Standard`): `292` archive entries inspected -> `0` humanoids found (non-humanoid drones/arthropods/weapons only); original ZIP archived privately, `0` admitted.
- **1 Blocked Source (`0` admitted):** `blender-human-base-meshes` (`www.blender.org/download/demo-files/` returned `HTTP/2 403 cf-mitigated: challenge` Cloudflare anti-bot challenge; never bypassed).
- **Exclusion Hygiene (`509` excluded items):** Logged in private `expansion_exclusion_ledger.json`, including `12` non-humanoid GLBs quarantined to `scratch/expansion_excluded/` after visual and bone-hierarchy inspection (`Characters_Shark`, cyberpunk `enemy_2legs*`/`enemy_large*`, space `enemy_small`/`enemy_extrasmall`/`mech_*`, `zombie_ribcage`).

---

## Verified Runtime & Engineering Findings
- **Bone Name Sanitization:** Three.js `GLTFLoader` rewrites dots and spaces (`handslot.r` → `handslotr`, `Bip01 Pelvis` → `Bip01_Pelvis`). Handled transparently in `catalog/humanoids/lib/humanoid-library.js`.
- **Skeleton Memory Leak Prevention:** Five-cycle load/render/dispose/reload Chromium profiling revealed `SkinnedMesh` leaks 1 WebGL `boneTexture` per reload unless `obj.skeleton.dispose()` is invoked explicitly. `disposeHumanoidAsset()` achieves `0` net geometry and texture growth across 5 cycles (`before=1/1` → `after=1/1`).
- **IK vs FK Retargeting Boundary:** Visual inspection caught lower-leg boot stretching when applying rotation-only `SkeletonUtils.retargetClip` from `UAL1` to `UMW` (`15_retarget_ual1_to_umw_adventurer`) because UMW's `Foot.L/R` bones are detached IK targets under `Root`. Explicitly marked incompatible for rotation-only FK retargeting in `compatibility-matrix.json`.

---

## Remaining Limitations (Unclaimed / Not Run)
- **Visual Approval:** 0 human artistic approvals (screenshots captured cleanly for offline review in `ARCHIVE/2026-11-14/`).
- **Mobile & Sustained Thermal Tests:** No physical iOS/Android GPU runs or multi-hour memory/thermal tests performed.
- **Toolkit Canonicals Protected:** All 10 playable demos in `src/demos/` remain unmodified and verified passing (`npm run typecheck`, `npm test`, `npm run build`).
