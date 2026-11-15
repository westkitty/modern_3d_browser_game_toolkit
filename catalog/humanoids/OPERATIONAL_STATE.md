# Operational State — Reusable Three.js Humanoid Character Library

Last Updated (UTC): `2026-11-15T01:55:00Z`
Branch: `feat/humanoid-asset-catalog-20261113`
Private Archive Root: `GPT/ThreeJS_Humanoid_Library/` (Google Drive; NO Drive folder/file IDs or tokens stored in GitHub)

---

## Current Library Totals (Verified)

| Metric | Count | Status & Evidence Tier |
| :--- | :---: | :--- |
| **Total Cataloged Assets** | **296** | `catalog/humanoids/catalog.json` (115 Rocketbox + 181 Multi-Source GLBs) |
| **Microsoft Rocketbox Avatars** | **115** | Protected historical checkpoint (`ARCHIVE/2026-11-13/`): 115 original archives, 115 GLBs, 230 QA PNGs, incl. recovered `Medical_Female_01` |
| **Multi-Source CC0 GLBs Added (2026-11-14)** | **181** | All 9 KayKit & Quaternius free/Standard packs acquired, unpacked, converted/packed cleanly (0 external URI failures) |
| **Skeleton Families Mapped** | **6** | `rocketbox-bip01`, `kaykit-rig-medium`, `kaykit-rig-large`, `quaternius-universal-65`, `quaternius-umw-62`, `quaternius-rpg-32` |
| **Chromium WebGL2 / Three.js `0.185.1` Cases (Multi-Source)** | **17 / 17 Passed** | `0` runtime errors, `34` 2-view QA PNGs (`VISUAL_APPROVAL_PENDING`), 5-cycle disposal net leak = `0` geometries / `0` textures |
| **Automated Catalog & Security Tests** | **6 / 6 Passed** | `node --test catalog/humanoids/tools/humanoid-library.test.mjs` |
| **Production Human / Mobile / Sustained GPU / Game Signoffs** | **0** | Not yet performed; all assets remain `VISUAL_APPROVAL_PENDING` |

---

## Chronological Checkpoint Ledger

### 1. Rocketbox Baseline Checkpoint (`ARCHIVE/2026-11-13/`) — Protected Unmodified
- Source: `microsoft/Microsoft-Rocketbox` commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9` (MIT License).
- 115 unique avatars archived as originals (`originals/`), converted GLBs (`processed-glb/`), 230 individual 768x768 WebGL2 QA PNGs (`Visual_QA_*`), and V4 private manifests (`ROCKETBOX_115_PRIVATE_MASTER_INDEX_V4.json`).
- `Medical_Female_01` fully recovered (`Rocketbox_Medical_Female_01_Complete_Source_2026-11-14.zip` + `Medical_Female_01.glb`, GitHub Actions run `43644401403`).
- `rocketbox-characters.json` preserves all 115 `asset_id`s untouched.

### 2. Multi-Source Expansion (`ARCHIVE/2026-11-14/`) — Verified Complete
All 9 free/Standard packs acquired directly from official publisher pages (7 itch.io ZIPs via Playwright/Chromium download flow + 2 public `quaternius.com` Drive links via `rclone`), ZIP-traversal audited (`0` unsafe paths), and license-verified (`CC0-1.0` inside every pack's `License.txt` / `License_Standard.txt`):

1. **KayKit Adventurers (2.0 FREE):** 6 char GLBs (5 chars + `Rogue_Hooded`), 2 `Rig_Medium` anim GLBs (`26` clips), 31 accessory `.gltf`→`.glb` = **39 GLBs**.
2. **KayKit Skeletons (1.1 FREE):** 4 specialized skeletal humanoid GLBs, 2 anim GLBs (`26` clips), 13 accessory `.gltf`→`.glb` = **19 GLBs**.
3. **KayKit Character Animations (1.1 FREE):** `Mannequin_Medium` (21 joints), `Mannequin_Large` (23 joints), 8 `Rig_Medium` GLBs (`139` raw / `131` non-T-Pose clips), 6 `Rig_Large` GLBs (`34` raw / `28` non-T-Pose clips) = **16 GLBs** (`155` unique non-T-Pose clip names combined vs 161 advertised overall).
4. **Quaternius Universal Base Characters — Standard:** Standard ZIP contains **2** bases (`Superhero_Female_FullBody`, `Superhero_Male_FullBody` vs 6 in paid Source) + 8 rigged hairstyles + 8 origin-0 hairstyles = **18 GLBs**. Repaired 3 upstream broken `*_png.png` URIs on working copies during GLB packing.
5. **Quaternius Modular Character Outfits — Fantasy (Standard):** Standard ZIP contains **4** outfits + **20** modular part GLBs + **2** texture variations (`T_Peasant`/`T_Peasant_2`, `T_Ranger`/`T_Ranger_3`) = **24 GLBs** (vs 12 outfits / 62 parts in paid Source).
6. **Quaternius UAL1 & UAL2 Standard:** `UAL1_Standard` + `_RM` (`43` clips each), `UAL2_Standard` + `_RM` (`43` clips each), `Mannequin_F` = **5 GLBs**.
7. **Quaternius Ultimate Modular Women:** **10** individual character GLBs (`24` clips each), **41** modular part FBX→GLBs + `UMW_Animations.glb` (`24` clips) + `Gun.glb` + `Sword.glb` converted via Blender 5.2.3 LTS = **54 GLBs**. Repaired Maya-inverted `Alpha=0.0` (`MASK`) FBX material imports to `Alpha=1.0` during conversion.
8. **Quaternius RPG Characters:** **6** class character GLBs (`11–15` clips each) = **6 GLBs**. Distributed formats confirmed: `glTF`, `FBX`, `OBJ`, `Blend`, `PNG`, plus `Humanoid Rig Versions`.

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
