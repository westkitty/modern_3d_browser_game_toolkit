# Three.js Humanoid Library — Operational State

Date: 2026-11-13 America/Detroit (cloud runs crossed into 2026-11-14 UTC)
State: PARTIAL — 12 archived character originals (11 complete plus one FBX-only); 10 GLBs passed real WebGL2/Three.js r185 browser smoke and have 20 rendered QA PNGs; 103 original avatars remain unacquired. No model has production visual/mobile/lifecycle approval.

## Authoritative locations

- GitHub: `westkitty/modern_3d_browser_game_toolkit`, branch `feat/humanoid-asset-catalog-20261113`, draft pull request #2. The default branch `main` is untouched.
- Public metadata: `catalog/humanoids/rocketbox-characters.json`, `sources.json`, README and pipeline tools. Keep private Google Drive file IDs out of the public repo.
- Private originals: existing Google Drive `GPT/ThreeJS_Humanoid_Library/ARCHIVE/2026-11-13/originals/` (exact folder verified).
- Private processed files and QA: existing sibling `processed-glb/`; metadata in sibling `manifests/`.
- Source authority: `microsoft/Microsoft-Rocketbox`, pinned commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`, MIT license (Microsoft copyright 2020) included in each source archive.

## Verified batch 01 accomplished (historical baseline; preserved)

- 115 unique Rocketbox avatar directory IDs indexed in JSON. Two duplicate party source directory aliases were removed from the index.
- Four character source ZIP archives in Drive: `Male_Adult_01` (full FBX, facial FBX, textures and preview), `Female_Adult_01` (same), `Delivery_Male_01` (same), `Medical_Female_01` (FBX-only, textures missing). Two sample animation FBXs are in a fifth archive. Original source bytes verified against GitHub source metadata and SHA-256 checksums before upload.
- All five original source archives transferred and verified by Drive file name, byte length, and exact parent ID; private ID/hash mapping recorded in `manifests/DRIVE_ACQUISITION_RECEIPTS_Batch01.json` and `ARCHIVE_SPLIT_MANIFEST.json`. Do not infer a Drive roundtrip content hash: not performed.
- Two actual GLBs created by Blender 4.0.2 on ephemeral Linux runner and uploaded to Drive `processed-glb/`: `Male_Adult_01.glb` (30,261,844 bytes; SHA256 `733d6b0396893d4d0111e39ecc247618436b88ec1f1cee74e026c1356000c44c`) and `Female_Adult_01.glb` (32,829,304 bytes; SHA256 `4dd78525aa1175af4e87683e44b21cbfe655c6c6b126282032e7a6353801a40d`). Both match independent structural checks (mesh, materials, embedded images, 80 bones, 2 animation clips, no external GLB URLs).
- Browser/renderer QA: GitHub Actions run `43549437068`, Three.js revision 185 / Chromium WebGL 2, both models passed real `GLTFLoader` load, skinned meshes and material maps, mixer advancement, WebGL rendered triangles, geometry/material/texture disposal calls and reload. Browser report `processed-glb/BROWSER_SMOKE_RESULT.json`, private processed receipts `DRIVE_PROCESSED_GLB_RECEIPTS_Batch01.json` and evidence ZIP archived in Drive.
- Protected ten-demo toolkit regression validation (`npm ci`, typecheck, tests, build) passed in source acquisition run `43548963931`. PR file-scope inspection verified every changed path is under `catalog/humanoids/` or the two dedicated `.github/workflows/rocketbox-humanoid-*.yml` files.

## Outstanding / NOT claimed

- Remaining 103 Rocketbox character original sets are unacquired.
- `Medical_Female_01` texture files not downloaded, and that model plus `Delivery_Male_01` not converted into GLBs.
- No retargeted sample animation onto a published character was visually verified; the two original animation FBXs are merely archived.
- Visual human-quality approval, facial detail accuracy, animation quality, long-session GPU lifecycle, physical mobile testing, and integration into an actual game remain **unverified**. Browser smoke PASS is not full production release PASS.
- Quaternius Universal Base Characters Standard (122 MB), Universal Animation Library Standard (15 MB), and Library 2 Standard (17 MB) are listed by the creator as CC0/free, but official itch.io interaction is needed for each download. No gated flow bypassed, no Quaternius binary claimed. Source and Pro tiers require payment.
- MakeHuman and VRoid are character-generation tools, not automatically downloadable libraries; exports would need independent creation and license review. Mixamo requires an authenticated Adobe workflow.
- Batch01 recorded additive temporary Big Mac staging, but public documentation intentionally omits its local absolute path. Not rechecked or modified during batch02. Both Macs remained unused for this batch; conversion took place in disposable GitHub Actions.

## Continuation boundary

Acquire further Rocketbox sources in bounded ~4–12 avatar batches through pinned GitHub cloud workflow, inspect raw bytes/hash, split archives to under 100 MiB per Drive upload, verify Drive metadata readbacks, and update only records for actual acquired items. Do not download all 115 in one batch or fill a local Mac. Expand GLB exports, real Three.js smoke, visual signoff and per-project loader integration. Maintain stable public asset IDs and a separate access-controlled Drive file/rights mapping. Keep PR #2 draft until the user chooses merge/release. Record partial outcomes accurately.
## Batch 02 acquisition snapshot — historical at that time, superseded below

**Execution:** existing repository `westkitty/modern_3d_browser_game_toolkit`, feature branch `feat/humanoid-asset-catalog-20261113`, draft PR #2, disposable GitHub Actions run [43550104493](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43550104493). Public upstream Rocketbox commit remains exactly `0943055db6ec570bcef9f2c8b41c9e5467c808f9`; Microsoft MIT license included in all new source ZIPs.

**Acquisition:** eight additional unique, complete character originals: `Male_Adult_08`, `Female_Adult_11`, `Business_Male_04`, `Construction_Female_01`, `Fire_Male_04`, `Medical_Male_02`, `Sports_Female_01`, `Security_Male_01`. Each source FBX/texture/preview was size, signature and SHA-256 checked; ZIPs were independently checked for original bytes, SHA-256 and CRC. Aggregated reported original bytes: 750,604,203 (includes repeated package-local MIT license notices); eight ZIPs total 276,019,102 bytes and each below the 100 MiB upload cap. **All eight Drive uploads returned success and were read back by exact ID, name, MIME, byte length and correct unchanged `originals/` parent.**

**GLB processing:** Blender 4.0.2 on Ubuntu converted four representatives: `Male_Adult_08.glb` (30,279,432 bytes), `Construction_Female_01.glb` (30,222,496), `Fire_Male_04.glb` (36,690,720), `Sports_Female_01.glb` (25,216,424). Files pass independent GLB2/mesh/skin/image/animation structural inspection and match the cloud runner's source hashes. All four passed actual Chromium/WebGL 2 / Three.js r185 `GLTFLoader`, skeleton, textured material, animation-mixer advancement, drawn-triangle, disposal call and skinned-model reload smoke tests. **All four processed Drive writes were confirmed and metadata-read back.**

**Private retrieval and reconstruction:** existing Drive library root `GPT/ThreeJS_Humanoid_Library`; use existing `ARCHIVE/2026-11-13/manifests/BATCH02_DRIVE_ORIGINALS_RECEIPTS.json`, `BATCH02_LIBRARY_INDEX.csv` and `BATCH02_RUNNER_SOURCE_RECEIPT.json` for exact original files and file hashes. Existing sibling `processed-glb/BATCH02_DRIVE_PROCESSED_RECEIPTS.json`, `BATCH02_BROWSER_SMOKE_RESULT.json`, `BATCH02_INDEPENDENT_QA_PROOF.json`, `BATCH02_GLB_STATIC_VALIDATION.json`, `BATCH02_CONVERSION_REPORT.json` record GLB hash, source and browser evidence. All eight metadata/QA receipts were uploaded and verified by size/parent readback. Private Drive IDs never enter public GitHub files.

**Cumulative count:** 12 of 115 distinct character sources archived (11 full, 1 FBX-only); 6 GLBs passed actual browser smoke (two batch01 plus four batch02). 103 original character sets remain, plus 6 archived-but-unconverted sources (one incomplete). Two independently archived sample motion FBXs remain unretargeted.

**Protected and unknown:** All existing batch01 Drive files remain unchanged. No new Mac downloads, commands, cleanup, or storage mutation. No game demos or toolkit runtime files changed. Cloud `npm ci`, `npm run typecheck`, `npm test` and `npm run build` passed. No human rendered visual approval, cross-model retargeted motion review, real mobile measurement, sustained GPU-resource leak proof, or end-to-end application integration. No byte-for-byte Drive download/re-hash was performed; provider metadata readback is narrower proof. No Quaternius gated downloads, purchases or account logins. No PR merge, deployment or main-branch write.

**Next safe boundary:** preserve immutable archives, only expand in new pinned batch with per-file provenance and below-cap packaging, and separately prove visual/long-session/device quality before calling any GLB production-ready. Commit and validate only this `catalog/humanoids/` area and specifically dedicated source/QA workflows on the feature branch.

## Batch 02 completion — four additional real GLBs, 20 visual screenshots

**Run:** GitHub Actions [43551948111](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43551948111), successful. Repo `westkitty/modern_3d_browser_game_toolkit`; same feature branch `feat/humanoid-asset-catalog-20261113`; draft PR #2 remains open. The remaining four already-archived batch02 original source ZIPs (`Female_Adult_11`, `Business_Male_04`, `Medical_Male_02`, `Security_Male_01`) were downloaded and independently SHA-256 checked directly from the authenticated Google Drive library. The cloud runner used **byte-identical** artifacts from previous GitHub Actions run 43550104493, verified against the recovered Drive ZIP hashes, rather than embedding signed Drive links in a public workflow. No new source archives were acquired or altered.

**Conversion/validation:** Blender 4.0.2, source FBX and textures copied into an isolated working directory; all four generated real self-contained GLBs. They passed independent GLB structural geometry/skins/embedded-image/animation validations. Each also passed actual Three.js r185 / Chromium WebGL2 `GLTFLoader`, skinned mesh, UV-texture, two animation clips, mixer advancement, two real scene viewpoints, pixel-coverage check, cleanup and skinned reload. New files and byte sizes:
- `Female_Adult_11.glb` — 35,596,408 bytes, SHA256 `ed15c9cccbaea75c1a331d02dc3d0c3ae7302cce620cc60055bde1e253a7cb04`.
- `Business_Male_04.glb` — 25,962,480 bytes, SHA256 `47c348230c1ea8818940b7bf2d2ac4bf20f32c4da91c27339988b8e0baf2b335`.
- `Medical_Male_02.glb` — 32,922,856 bytes, SHA256 `891e25d6513902b35a7860de971ba16984ac1feeb946dbb2ef2c2862260d123e`.
- `Security_Male_01.glb` — 35,539,924 bytes, SHA256 `0342e86cfcea57f2b0e2876044d302549a15f207499d1773811e66683b7e6919`.

**Private archival and recovery:** four new GLBs uploaded to the **same existing** `processed-glb/` parent; all four provider write/readbacks matched exact name, size, MIME and folder. There are now ten distinct GLB files in that Drive location. The subfolder `processed-glb/Visual_QA_2026-11-13_Batch02_Completion/` contains twenty individually archived 768x768 PNG render screenshots (two for each of ten models), a portable ZIP of all twenty with SHA checksums, browser, source-equality, static/conversion and independent verification reports, and `VISUAL_QA_ASSESSMENT.md`. All twenty screenshot metadata size/MIME/name readbacks passed; the ten supplemental QA artifacts had matching size/parent readbacks. The private Drive manifest folder contains `BATCH02_COMPLETION_PRIVATE_DRIVE_RECEIPTS.json` with exact source->GLB IDs and `BATCH02_COMPLETION_10_GLB_PRIVATE_LOOKUP.csv`, listing stable asset IDs, all ten GLB hashes and private retrieval links. Private IDs are intentionally absent from public GitHub.

**Cumulative real state:** 115 indexed Rocketbox character sources, 12 archived sources, **10 GLBs verified by real Three.js browser smoke**, 2 archived sources without GLBs (`Delivery_Male_01` and FBX-only `Medical_Female_01`), 103 unacquired original avatar sets. Two sample animation FBXs remain archived but **retargeting to new characters has not been visually evaluated**. Ten existing toolkit demonstrations protected; `npm run typecheck`, `npm test`, `npm run build` succeeded in the same isolated Actions job.

**Separate visual QA:** human silhouettes and broad apparel shapes visible in screenshots; model heights 1.7334–1.8575 meters are overall bounds, not approved anatomical proportions. Face and dark-material exposure in automated Three.js renders is consistently darker than the publisher's source previews; root cause could be lighting, color management, or material conversion. **Do not claim exact texture/color fidelity or visual approval.** Headless stills do not prove animation deformation quality, retargeting, mobile thermal performance, sustained GPU memory reclamation or actual per-game integration.

**Preservation/limits:** All prior Drive originals and processed files remain in place, original byte hashes unchanged, no Macs invoked, no paid assets or login-gated Quaternius, no repository files changed outside `catalog/humanoids/` and dedicated Rocketbox workflows, no merge/deploy or `main` writes. Full-file Drive **post-upload re-download SHA256** was *not performed*; only provider write+size/MIME/parent readback is proven. Draft PR #2 stays draft. The quality release gate remains pending.
