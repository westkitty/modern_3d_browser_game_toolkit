# Shared Three.js Humanoid Asset Catalog

**Status (2026-11-13): inventory and source verification only; zero source binaries are confirmed downloaded, archived, or converted.** Do not describe these as installed game assets.

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

Look up `asset_id`, confirm `archive_status = acquired` in the private archive registry and `conversion_glb = validated` before adding a GLB to a game. All source records currently say `downloaded: false`.

Source families: Rocketbox (MIT), Quaternius UBC Standard and Universal Animation Libraries 1/2 (item-level CC0 pages), MakeHuman, VRoid, and Mixamo. Generator products do not have downloadable character libraries until individual exports are produced. Mixamo requires an Adobe account, and paid tiers are outside this capture.

**Next legitimate operation:** acquire source binaries from provider-controlled URLs/flows and update the private archive receipts; do not advance a source record from `source-enumerated` to `validated` without actual file inspection.
