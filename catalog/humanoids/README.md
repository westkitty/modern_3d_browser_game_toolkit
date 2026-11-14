# Shared Three.js Humanoid Asset Catalog

**Status (2026-11-13 acquisition, verified afterward): PARTIAL source library. Four Rocketbox avatar source archives and two sample animation FBXs are in Google Drive; two converted GLBs passed actual Three.js r185 WebGL2 loader, skinned animation-mixer, render, dispose and reload smoke tests. Of 115 indexed avatars, 111 remain unacquired. Human visual approval, mobile/lifecycle release checks and specific-game integration remain pending.**

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

Look up `asset_id`, confirm `archive_status = acquired` in the private archive registry and `conversion_glb = validated` before adding a GLB to a game. Only the four named Rocketbox asset IDs below are marked `downloaded: true` because their source ZIPs were actually uploaded and verified. The remaining 111 Rocketbox records remain `downloaded: false`.

Source families: Rocketbox (MIT), Quaternius UBC Standard and Universal Animation Libraries 1/2 (item-level CC0 pages), MakeHuman, VRoid, and Mixamo. Generator products do not have downloadable character libraries until individual exports are produced. Mixamo requires an Adobe account, and paid tiers are outside this capture.

**Next legitimate operation:** acquire source binaries from provider-controlled URLs/flows and update the private archive receipts; do not advance a source record from `source-enumerated` to `validated` without actual file inspection.

## Verified source acquisition — batch 01

The existing private Google Drive library `GPT/ThreeJS_Humanoid_Library/ARCHIVE/2026-11-13/` now contains five original-source archives and two manifests. Every archive was independently checked for size and SHA-256 before upload, then Google confirmed correct file name, byte count and parent folder in a readback. **A Drive byte-level download-and-rehash was not performed**. Exact access-controlled Drive file IDs are stored only in `manifests/DRIVE_ACQUISITION_RECEIPTS_Batch01.json`.

| Stable model ID | Archive | Source scope | Validation state |
| --- | --- | --- | --- |
| `rocketbox/adults/male_adult_01` | `Rocketbox_Male_Adult_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; browser GLB smoke PASS (male and female adult only) |
| `rocketbox/adults/female_adult_01` | `Rocketbox_Female_Adult_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; browser GLB smoke PASS (male and female adult only) |
| `rocketbox/professions/delivery_male_01` | `Rocketbox_Delivery_Male_01_Originals_Batch01_2026-11-13.zip` | two source FBX variants, TGA textures and preview | originals archived; GLB not yet converted |
| `rocketbox/professions/medical_female_01` | `Rocketbox_Medical_Female_01_Originals_Batch01_2026-11-13.zip` | **FBX-only**, textures not yet acquired | partial originals archived; browser GLB smoke PASS (male and female adult only) |

An additional `Rocketbox_Animation_Samples_Originals_Batch01_2026-11-13.zip` contains two original animation FBX clips. The source commit is pinned to `0943055db6ec570bcef9f2c8b41c9e5467c808f9`; Microsoft's original MIT license is retained in every archive. Private records also include the per-file source SHA-256 checksums.

### What is not yet established

- Full visual likeness/material appearance and animation-retargeting approval, actual game integration, representative mobile performance and long-session GPU resource lifecycle. Two GLBs passed actual Three.js loader/render/mixer/reload smoke checks but not these release gates.
- The other 111 Rocketbox avatar binaries.
- Free Standard pack binaries for Quaternius, because acquisition requires the provider's interactive download flow. Their presence in `sources.json` is not an acquisition claim.

The toolkit's ten canonical demonstrations remain unchanged; this catalog is independent documentation and processing tooling.

## Processed GLB candidates — verified browser smoke

The processed `Male_Adult_01.glb` (30,261,844 bytes; SHA-256 `733d6b0396893d4d0111e39ecc247618436b88ec1f1cee74e026c1356000c44c`) and `Female_Adult_01.glb` (32,829,304 bytes; SHA-256 `4dd78525aa1175af4e87683e44b21cbfe655c6c6b126282032e7a6353801a40d`) are stored in the private Drive `processed-glb` folder, with exact IDs in `DRIVE_PROCESSED_GLB_RECEIPTS_Batch01.json`.

Real Chrome/WebGL2/Three.js r185 smoke test: GitHub Actions run [43549437068](https://github.com/westkitty/modern_3d_browser_game_toolkit/actions/runs/43549437068). Both converted models loaded with `GLTFLoader`, yielded 80-bone humanoid skeletons, three skinned meshes with three texture-backed materials, two animation clips (mixer advanced), actual WebGL-rendered triangles, disposal calls, and successful reload. Male: 4,802 vertices / 7,934 rendered triangles; Female: 5,563 vertices / 9,400 rendered triangles. Details and environment limitations are recorded in the private `BROWSER_SMOKE_RESULT.json` and its QA ZIP.

**Release verdict remains PARTIAL.** A headless browser smoke test is not substitute for independent visual approval, animation quality review, sustained GPU leak testing or real mobile benchmarking. Runtime files stay out of the ten canonical demonstrations until an integration pass is requested.
