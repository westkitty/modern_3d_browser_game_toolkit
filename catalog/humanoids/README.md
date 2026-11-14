# Shared Three.js Humanoid Asset Catalog

**CURRENT STATUS — 2026-11-14: All 115 Rocketbox avatar source sets now have complete FBX and original texture coverage in the private Drive library (the earlier Medical_Female_01 FBX-only ZIP is retained, with an additive complete-source ZIP). All 115/115 distinct humanoid GLBs passed independent structural checks and real Three.js r185 Chromium WebGL2 loader/skinning/texture/animation/render/dispose/reload smoke, with 230 separate PNG views archived. Zero human production visual approvals, physical mobile tests, sustained GPU resource-lifecycle certifications, or live-game integrations. Earlier partial/blocked counts below are historical snapshots.**

This is the reusable **asset metadata index** for multiple Three.js projects. The host repository retains exactly ten independent architecture demonstrations; this catalog is data-only and does not alter game behavior.

## Contents

- `sources.json` — 7 source families with access/licensing and honest acquisition state.
- `rocketbox-characters.json` — 115 unique Microsoft Rocketbox avatar source directories with stable IDs and GitHub source paths. Two party-character directories are duplicated across source categories and are de-duplicated here.
- `ACQUISITION_AND_USE.md` — raw archive -> quarantine -> validation -> GLB -> cross-project usage contract.

**Cataloged ≠ acquired ≠ converted ≠ playable.** These are separate states.

## Storage authority

- **GitHub (here):** index, source identifiers, schema, rights evidence pointers, reproducible processing instructions, revisions.
- **Google Drive:** original downloaded ZIPs, source models, materials, animation masters, rendered previews, GLB exports and per-file hash/verification receipts; access remains Drive-controlled.
- The public repo must not publish private Drive folder/file IDs, restricted source material, credentials, or downloadable links to private binaries.
- After a successful binary archival, update each record with a non-public archive locator or a separate access-controlled mapping, without disclosing the private Drive ID in the public manifest.

## Usage

Look up `asset_id` in `rocketbox-characters.json`. Twelve records have `downloaded: true`; 103 remain unacquired. Resolve exact private Drive IDs using `BATCH02_DRIVE_ORIGINALS_RECEIPTS.json` / `BATCH02_DRIVE_PROCESSED_RECEIPTS.json`, or the batch01 equivalents. A `PASS_WITH_LIMITATIONS` browser result is not production release approval; actual application integration additionally requires visual and device/lifecycle checks.

Source families: Rocketbox (MIT), Quaternius UBC Standard and Universal Animation Libraries 1/2 (item-level CC0 pages), MakeHuman, VRoid, and Mixamo. Generator products do not have downloadable character libraries until individual exports are produced. Mixamo requires an Adobe account, and paid tiers are outside this capture.

**Next legitimate operation:** acquire source binaries from provider-controlled URLs/flows and update the private archive receipts; do not advance a source record from `source-enumerated` to `validated` without actual file inspection.

## Verified source acquisition — batch 01

The existing private Google Drive library `GPT/ThreeJS_Humanoid_Library/ARCHIVE/2026-11-13/` now contains five original-source archives and two manifests. Every archive was independently checked for size and SHA-256 before upload, then Google confirmed correct file name, byte count and parent folder in a readback. **A Drive byte-level download-and-rehash was not performed**. Exact access-controlled Drive file IDs are stored only in `manifests/DRIVE_ACQUISITION_RECEIPTS_Batch01.json`.

| Stable model ID | Archive | Source scope | Validation state |
| --- | --- | --- | --- |
| `rocketbox/adults/male_adult_01` | `Rocketbox_Male_Adult_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; browser GLB smoke PASS (male and female adult only) |
| `rocketbox/adults/female_adult_01` | `Rocketbox_Female_Adult_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; browser GLB smoke PASS (male and female adult only) |
| `rocketbox/professions/delivery_male_01` | `Rocketbox_Delivery_Male_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; GLB not yet converted |
| `rocketbox/professions/medical_female_01` | `Rocketbox_Medical_Female_01_Originals_Batch01_2026-11-13.zip` | **FBX-only**, textures not yet acquired | partial originals archived; GLB not yet converted |

An additional `Rocketbox_Animation_Samples_Originals_Batch01_2026-11-13.zip` contains two original animation FBX clips. The source commit is pinned to `0943055db6ec570bcef9f2c8b41c9e5467c808f9`; Microsoft's original MIT license is retained in every archive. Private records also include the per-file source SHA-256 checksums.

### What is not yet established

- Full visual likeness/material appearance and animation-retargeting approval, actual game integration, representative mobile performance and long-session GPU resource lifecycle. Two GLBs passed actual Three.js loader/render/mixer/reload smoke checks but not these release gates.
- The other 103 Rocketbox avatar source sets.
- Free Standard pack binaries for Quaternius, because acquisition requires the provider's interactive download flow. Their presence in `sources.json` is not an acquisition claim.

The toolkit's ten canonical demonstrations remain unchanged; this catalog is independent documentation and processing tooling.

## Batch 01 processed GLB candidates — verified browser smoke

The processed `Male_Adult_01.glb` (30,261,844 bytes; SHA-256 `733d6b0396893d4d0111e39ecc247618436b88ec1f1cee74e026c1356000c44c`) and `Female_Adult_01.glb` (32,829,304 bytes; SHA-256 `4dd78525aa1175af4e87683e44b21cbfe655c6c6b126282032e7a6353801a40d`) are stored in the private Drive `processed-glb` folder, with exact IDs in `DRIVE_PROCESSED_GLB_RECEIPTS_Batch01.json`.

Real Chrome/WebGL2/Three.js r185 smoke test: GitHub Actions run [43549437068](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43549437068). Both converted models loaded with `GLTFLoader`, yielded 80-bone humanoid skeletons, three skinned meshes with three texture-backed materials, two animation clips (mixer advanced), actual WebGL-rendered triangles, disposal calls, and successful reload. Male: 4,802 vertices / 7,934 rendered triangles; Female: 5,563 vertices / 9,400 rendered triangles. Details and environment limitations are recorded in the private `BROWSER_SMOKE_RESULT.json` and its QA ZIP.

**Release verdict remains PARTIAL.** A headless browser smoke test is not substitute for independent visual approval, animation quality review, sustained GPU leak testing or real mobile benchmarking. Runtime files stay out of the ten canonical demonstrations until an integration pass is requested.


## Historical snapshot: verified source acquisition — batch 02

Eight additional distinct avatars were acquired on a disposable GitHub Actions Ubuntu runner from Microsoft Rocketbox pinned commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`. Each ZIP preserves original FBX variants, source textures, previews and an untouched Microsoft MIT license. Each individual original was size/signature/SHA-256 checked, packed under the Drive 100 MiB limit, and independently rehashed from the resulting ZIP before upload.

**Evidence:** 8 source archives (276,019,102 compressed bytes); 750,604,203 total original/source bytes as recorded across the eight packages, including their own license notices. All 8 Google Drive provider writes passed independent file-ID, byte-size, MIME and parent-folder readbacks. No Drive download-and-rehash proof was performed; SHA-256 values below were computed **before** upload. The authorized Drive archive holds `manifests/BATCH02_DRIVE_ORIGINALS_RECEIPTS.json`, `manifests/BATCH02_LIBRARY_INDEX.csv`, and `manifests/BATCH02_RUNNER_SOURCE_RECEIPT.json`, including the private Drive recovery links and per-file source SHA-256 hashes.

| Asset ID | Full original ZIP filename | Current model state |
| --- | --- | --- |
| `rocketbox/adults/male_adult_08` | `Rocketbox_Male_Adult_08_Originals_Batch02_2026-11-13.zip` | GLB browser smoke PASS |
| `rocketbox/adults/female_adult_11` | `Rocketbox_Female_Adult_11_Originals_Batch02_2026-11-13.zip` | GLB browser-smoke PASS in completion run; visual release pending |
| `rocketbox/professions/business_male_04` | `Rocketbox_Business_Male_04_Originals_Batch02_2026-11-13.zip` | GLB browser-smoke PASS in completion run; visual release pending |
| `rocketbox/professions/construction_female_01` | `Rocketbox_Construction_Female_01_Originals_Batch02_2026-11-13.zip` | GLB browser smoke PASS |
| `rocketbox/professions/fire_male_04` | `Rocketbox_Fire_Male_04_Originals_Batch02_2026-11-13.zip` | GLB browser smoke PASS |
| `rocketbox/professions/medical_male_02` | `Rocketbox_Medical_Male_02_Originals_Batch02_2026-11-13.zip` | GLB browser-smoke PASS in completion run; visual release pending |
| `rocketbox/professions/sports_female_01` | `Rocketbox_Sports_Female_01_Originals_Batch02_2026-11-13.zip` | GLB browser smoke PASS |
| `rocketbox/professions/security_male_01` | `Rocketbox_Security_Male_01_Originals_Batch02_2026-11-13.zip` | GLB browser-smoke PASS in completion run; visual release pending |

### Batch 02 GLB conversion and browser proof

Blender 4.0.2 converted four representatives from working copies. Independent structural validation verified real geometry, skin joints, embedded images and two animation clips each, with no external resource URIs. Chromium/WebGL2/Three.js r185 then loaded the four GLBs via `GLTFLoader`, rendered geometry, exercised the embedded `AnimationMixer` and successfully disposed/reloaded skinned meshes. All four GLBs (122,409,072 bytes total) and associated private receipts and QA reports were uploaded and metadata-verified in the existing Drive `processed-glb` folder.

| Processed GLB | Bytes | SHA-256 before upload | Browser triangles | Skeleton joints |
| --- | ---: | --- | ---: | ---: |
| `Male_Adult_08.glb` | 30,279,432 | `7d0531e7062d7c0e598cf4325f1cff26a1934f2b2af8c780a5a6b7f7c8471ef4` | 7,666 | 80 |
| `Construction_Female_01.glb` | 30,222,496 | `7fc6a1575fdfffb50de3a33f3a317e72c8db10b2d794e9a570f7ab77bebd86bc` | 8,662 | 80 |
| `Fire_Male_04.glb` | 36,690,720 | `b5bc8f04bd2612a27d8bf9bab4bda6f107706c91045f45f96bb088deab91d1fe` | 13,563 | 80 |
| `Sports_Female_01.glb` | 25,216,424 | `7d24da445ab90166e5e782c3527d027da2091c23519fb28393fa46db3be9e357` | 8,480 | 81 |

The reproducible cloud source/conversion/browser/regression run is [GitHub Actions #43550104493](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43550104493). The latest private browser report is `BATCH02_BROWSER_SMOKE_RESULT.json`; the Drive processed receipt is `BATCH02_DRIVE_PROCESSED_RECEIPTS.json`. Source/archive and runtime identities agree. Existing ten-demo toolkit `npm run typecheck`, `npm test`, `npm run build` passed.

**Release verdict: PARTIAL.** A WebGL2 smoke test validates functionality but does not establish final visual appearance, separate animation-retarget quality, mobile performance, sustained memory disposal or live-game integration. All previously archived batch01 files and GLBs are preserved. No character source binaries or private Drive IDs are committed to this public repository.

## Batch 02 preview-grounded visual search

All eight original Rocketbox 1280×720 source preview PNG files were decoded and inspected, alongside the original hashes and model assets. The descriptions below characterize **those publisher-supplied previews**, not independent screenshots of the exported GLBs; they are search and selection aids, not visual acceptance certificates. All eight batch-02 converted model bounding boxes are now recorded in `rocketbox-characters.json` as scene measurements including clothing/equipment, not anatomical proportions.

| Stable asset ID | Observed source-preview appearance | Search tags |
| --- | --- | --- |
| `rocketbox/adults/female_adult_11` | Long-sleeve brown knee-length dress with dark belt, tall brown boots and tied-back dark hair. | `civilian`, `dress`, `boots`, `long-sleeves` |
| `rocketbox/adults/male_adult_08` | Light-blue collared button-front shirt, dark trousers and dark shoes; short dark hair, ordinary civilian silhouette. | `civilian`, `collared-shirt`, `long-pants`, `casual-smart` |
| `rocketbox/professions/business_male_04` | Gray buttoned vest over gray collared long-sleeve shirt, dark trousers and shoes; bald head. | `business`, `vest`, `collared-shirt`, `smart-casual` |
| `rocketbox/professions/construction_female_01` | White safety hard hat, yellow high-visibility vest with reflective bands, blue workwear, protective gloves and tan boots. | `construction`, `high-visibility-vest`, `hard-hat`, `workwear`, `ppe` |
| `rocketbox/professions/fire_male_04` | Tan firefighting turnout clothing with reflective yellow bands, white helmet, respiratory face covering, dark gloves and boots; bulky equipment silhouette. | `firefighting`, `emergency-responder`, `turnout-gear`, `respirator`, `helmet`, `ppe` |
| `rocketbox/professions/medical_male_02` | Bright-blue emergency-response jacket and matching trousers with white reflective bands and dark boots; not a white lab coat. | `medical`, `emergency-responder`, `reflective-uniform`, `blue-workwear`, `not-doctor-coat` |
| `rocketbox/professions/security_male_01` | Gray security shirt with black tie, dark trousers, black peaked uniform cap, belt and dark shoes; gray hair. | `security`, `guard-uniform`, `peaked-cap`, `tie`, `uniform` |
| `rocketbox/professions/sports_female_01` | Pink floral two-piece swimwear, barefoot, hair pulled back; despite the Sports source label, this is swimwear rather than a gym or track uniform. | `swimwear`, `bikini`, `beach`, `barefoot`, `not-track-uniform` |

The source category `Sports_Female_01` corresponds visually to a pink floral two-piece swimsuit, not conventional track or gym attire. `Medical_Male_02` resembles an emergency-response worker in reflective blue uniform rather than a physician in a lab coat. Search using the actual appearance tags before choosing a model for a scene.

## Historical snapshot: batch 02 completion — four additional converted GLBs

**Verified cloud run:** [GitHub Actions 43551948111](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43551948111). The four original ZIPs were downloaded and SHA-256-checked directly from the authenticated private Drive library. The GitHub-hosted runner consumed earlier GitHub artifact copies only after their full ZIP SHA-256s matched the recovered Drive copies; no signed Drive token was committed. The original FBX and textures remain unchanged, and Blender 4.0.2 converted working copies.

| Newly converted GLB | Bytes | SHA-256 (before Drive upload) | Bounds height |
| --- | ---: | --- | ---: |
| `Female_Adult_11.glb` | 35596408 | `ed15c9cccbaea75c1a331d02dc3d0c3ae7302cce620cc60055bde1e253a7cb04` | 1.7364 m |
| `Business_Male_04.glb` | 25962480 | `47c348230c1ea8818940b7bf2d2ac4bf20f32c4da91c27339988b8e0baf2b335` | 1.8009 m |
| `Medical_Male_02.glb` | 32922856 | `891e25d6513902b35a7860de971ba16984ac1feeb946dbb2ef2c2862260d123e` | 1.8306 m |
| `Security_Male_01.glb` | 35539924 | `0342e86cfcea57f2b0e2876044d302549a15f207499d1773811e66683b7e6919` | 1.8323 m |

All four GLBs passed independent GLB2 structural checks for skinned mesh, embedded UV-texture images, animation clips and no external media URLs. Every one passed real Chromium WebGL2 / Three.js r185 `GLTFLoader`, animation-mixer updates, rendered geometry, disposal calls and skinned-model reload. The real bytes were uploaded to the existing Drive `processed-glb/` folder and verified by provider file name, byte count, MIME and parent-folder readback. No post-upload Drive full-byte SHA-256 roundtrip was performed.

### Twenty actual rendered views of ten GLBs

The four new and six existing GLBs underwent a fresh real browser render test. Two separate 768x768 PNGs were captured per character; all twenty were validated by PNG signature, image dimensions, their original SHA-256, visible-model pixel coverage and Drive name/size/MIME readback. The private `processed-glb/Visual_QA_2026-11-13_Batch02_Completion/` subfolder holds every individual screenshot, a twenty-image archive ZIP, provenance and checksum reports, `VISUAL_QA_ASSESSMENT.md`, and the private screenshot lookup. A separate private ten-GLB locator CSV and cumulative Drive receipt JSON are in `ARCHIVE/2026-11-13/manifests/`.

**Separate visual QA:** recognizable full humanoid silhouettes with no obvious catastrophic missing limbs; recorded height bounds range 1.7334–1.8575 m (not anthropometric measurements). Textured clothing roles are recognizable. The newly converted brown dress, business vest, blue emergency responder uniform and security cap remain visibly distinguishable from source previews. Faces and some dark clothing look noticeably darker in the normalized Chromium renders than in the original preview PNGs: controlled material/lighting/color parity checks remain necessary. Two embedded animation clips and skinned skeletons load and advance, but static PNGs do not certify animation quality or retargeting.

**Cumulative:** 115 indexed sources, 12 acquired original avatar archives, 10 GLBs passing headless Three.js smoke, 2 acquired but not converted sources (one FBX-only), 103 unacquired sources, 20 visual QA PNGs, **zero production-approved visual/mobile/lifecycle releases**. The ten demos, source ZIPs, `main`, and draft PR #2 are unchanged. Private Drive file IDs remain exclusively in Drive-controlled manifests.

## Final source acquisition certificate — complete 115/115

All **103 remaining** Microsoft Rocketbox avatar source directories have now been acquired from pinned commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`. The live upstream official tree accounted for **1,198 expected individual files** totaling **9,867,263,237 bytes (9.19 GiB raw)** across 36 adult, four child, and 63 profession character directories. Original FBX, textures, preview PNGs and the source MIT license notice were preserved. Every newly downloaded source file was checked for length, format signature, official Git blob SHA-1, and independently computed SHA-256. Source ZIPs were independently re-read and hash-checked. One source (`Male_Adult_02`) initially failed because an upstream filename contained spaces; the downloader now URL-encodes paths, and a separate one-character retry succeeded. Historical failure preserved, resolved, and **not silently suppressed**.

**Archive transfer reality:** 52 new, sub-100-MiB nested transport ZIPs now reside in the original private Drive `ARCHIVE/2026-11-13/originals/` alongside 13 previous archive objects. Exactly **65 original archive objects** therefore cover 115 distinct avatar source sets plus two separate animation FBX files in one older archive. Google Drive returned a successful provider write for every new file and independently returned matching file name, size, MIME type, and original parent folder. **No full-file Google Drive post-upload download-and-SHA-256 comparison was performed**; separate original/source hashes were verified before upload.

**Private cross-project retrieval and recovery:** The existing private Drive `manifests/` folder contains `ROCKETBOX_115_PRIVATE_MASTER_LOOKUP.csv` (115 stable IDs with exact Drive source pointers and ten GLB links), `ROCKETBOX_115_PRIVATE_MASTER_INDEX.json` (full source/provenance hashes, nested ZIP member and part paths, source counts), and `ROCKETBOX_115_README.md` (restoration instructions). Separate immutable receipts `ROCKETBOX_REMAINING_GROUP00_DRIVE_RECEIPT.json` through `ROCKETBOX_REMAINING_GROUP10_DRIVE_RECEIPT.json`, plus `ROCKETBOX_REMAINING_GROUP04_MALE02_RETRY_DRIVE_RECEIPT.json`, preserve per-batch transfer proof. **Private Drive file IDs and signed URLs do not belong in public GitHub files.**

**Workflow proof:** Frozen, version-pinned public source inventory: `rocketbox-remaining-103-plan.json`. Cloud acquisition code: `tools/rocketbox_remaining_103_cloud_acquire.py`. GitHub Actions runs: [pilot 43553390313](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43553390313), [groups 1–10 43553780934](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43553780934), and [isolated retry 43554819035](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43554819035). Group4's combined run is marked failure because of the initial skipped item, even though its nine successful items were preserved; the separate retry passed.

**Release boundary:** The originals library is acquired, **not** a 115-GLB playable catalog. Ten previously converted GLBs passed actual browser smoke, and 105 archived source sets remain without a browser-tested GLB (including one historically FBX-only). No new GLBs were created in this acquisition campaign. Visual color/material parity, motion retarget quality, long-session GPU reclamation, mobile QA and live-game integration remain pending. Preserve the existing ten toolkit demonstrations, feature-branch-only edits and draft PR #2. No Mac, cloud account purchase, login-gated marketplace asset, merge or deployment was involved.


## 2026-11-14 conversion completion (new current authority)

- Source: Microsoft Rocketbox pinned commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`, MIT copyright Microsoft 2020. Preserve immutable archived FBXs, textures, license and source hashes.
- 10 initial GLBs, plus [10 new batch03](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43557244473), [93 in 11 capped cloud groups](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43558118152), and [Delivery_Male_01](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43611309285): **114 browser-smoke GLBs**. New output/source hashes, independent GLB2 structure reports, Chromium r185 GLTFLoader texture/skeleton/animation/render/dispose/reload proof and PNG views are archived in the existing private Drive `processed-glb/` and its `Visual_QA_*` subfolders.
- `Medical_Female_01`: **BLOCKED**, not a failed conversion. Archived historical source contains FBX but lacks source textures; handle separately without substituting art.
- Not approved: actual visual parity/materials, animation retarget feel, real mobile hardware, sustained GPU memory/resource lifecycle, game integration. Drive name/size/MIME/folder readbacks were performed, not full post-upload SHA-256 downloads. Existing ten demos, Macs, originals and `main` unchanged; PR #2 remains draft. Earlier acquisition-only figures elsewhere in this README are historical.

## Final source and GLB completion — Medical_Female_01 (current authority)

The historically incomplete `Medical_Female_01` is now fully source-complete and browser-smoke proven. **Do not delete or overwrite** the earlier `Rocketbox_Medical_Female_01_Originals_Batch01_2026-11-13.zip` FBX-only archive. It remains historical evidence. A second, independently verified source archive was created and added to the **existing** private `originals/` folder.

- Source: pinned `microsoft/Microsoft-Rocketbox` Git commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`. Exactly two original FBXs, seven original TGA textures, the publisher's preview PNG, and the unchanged MIT license (copyright Microsoft 2020). Every source-file size, Git blob SHA1 and SHA-256 was checked, and three older preserved FBX/preview files were byte-compared to source copies from the original cloud archive.
- New immutable source ZIP: `Rocketbox_Medical_Female_01_Complete_Source_2026-11-14.zip`, **34,332,018 bytes**, SHA-256 `24689a165d6befa553b0e04534fe5916461f4ef4c8755497174963a7afb837ad`.
- New actual GLB: `Medical_Female_01.glb`, **31,743,080 bytes**, SHA-256 `2c9d879fb60124579651eb8967cedafb86176c4f96d14317edec3beb82e7ee5f`. Blender 4.0.2 performed conversion on a working copy in GitHub-hosted Ubuntu. The source ZIP and GLB were both uploaded to their existing private Drive parents, then independently **downloaded back and compared byte-for-byte** with their source-side SHA-256s.
- [GitHub Actions run 43644401403](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43644401403): all steps succeeded. Independent GLB2 structure: 80-joint rig, seven embedded images, three skinned primitives, and two animation clips. Chromium WebGL2 / Three.js 185 rendered 8,884 triangles and two separate 768x768 screenshots, advanced 246 animation tracks, performed disposal and reloaded three skinned objects successfully. The unchanged toolkit passed typecheck, tests and production build.
- Visual evidence was archived in private Drive `processed-glb/Visual_QA_2026-11-14_Medical_Female_01_Complete/`. The original publisher preview is noticeably lighter than the Chrome render (white medical clothing appears gray; face/skin exposure darker). This is an **unresolved material/lighting parity warning**, not evidence of broken source textures or human production approval.
- Exact private file IDs, original-file SHA-256 hashes, source and output recovery URLs, QA evidence IDs and full Drive roundtrip strength are in private `manifests/ROCKETBOX_MEDICAL_FEMALE01_PRIVATE_COMPLETION_RECEIPT.json`. The repository intentionally contains no private Drive IDs.

**Final total: 115 archived original character sources (one historical FBX-only ZIP plus its additive complete-source replacement), 115 independently browser-tested GLBs, 230 saved screenshots, zero production-release approvals.** Headless browser smoke does not replace visual signoff, animation retarget review, real mobile benchmarks, sustained GPU-resource leak checks, or individual game integration. No Mac, main branch, existing ten demos, original ZIPs, signed-in marketplaces, PR merge or deployment were involved.
