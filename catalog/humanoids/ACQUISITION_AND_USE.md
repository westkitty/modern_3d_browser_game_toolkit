# Acquisition, archival and use contract

## Hard boundary
An item is **not** an available character merely because its source URL appears in the catalog. Source statuses are descriptive, and `archive_status` may only change after a provider-confirmed Drive write of the real bytes. No placeholder geometry, preview PNG, or source webpage counts as a downloaded model.

## Verified source acquisition
1. Verify item-level provider license and archive terms, product page and provider-generated version identifier.
2. Download a source ZIP/FBX/glTF/VRM through the official allowed mechanism; stop at account, payment or click-through barriers.
3. Store an unchanged original outside public runtime trees. Compute SHA-256 and byte count; check archive paths/types before opening.
4. Record filename, provider URL, source version, acquired date, license evidence, Drive file ID in **private** archive record, hash and size.
5. Convert FBX/glTF/VRM as applicable. For Three.js, prefer self-contained GLB with measured compression; VRM may need extension-preserving handling instead of naïve GLB conversion.
6. Inspect rig and skinning, humanoid proportions, facing/up axis, textures, materials, animation clips, scale and bound count.
7. Prove GLTFLoader load, animation playback, unload/reload, no external references and size/performance budgets in a real application.
8. Only then set `conversion_glb: validated` and make a project-owned, pinned runtime copy.

## License and browser guardrails
- Rocketbox MIT: include its license/copyright notice in distributions.
- The specified Quaternius Standard packs explicitly say CC0 on their item pages, but **newer Quaternius QAL packs must not be assumed CC0**, nor distributed as raw pack files under QAL.
- MakeHuman is a generator; core exports and user-installed community assets must be checked separately.
- VRoid is a generator, not a free third-party avatar redistribution right.
- Mixamo needs authenticated Adobe access; raw animation/avatar pack republication is not automatically allowed.
- Public browser GLBs are extractable. Confirm that this distribution is allowed for each item before deployment.

## Proposed archival layout (private Google Drive)
`GPT/ThreeJS_Humanoid_Library/ARCHIVE/<YYYY-MM-DD>/originals/{rocketbox,quaternius,makehuman,vroid,mixamo}/`
`GPT/ThreeJS_Humanoid_Library/ARCHIVE/<YYYY-MM-DD>/processed-glb/`
`GPT/ThreeJS_Humanoid_Library/ARCHIVE/<YYYY-MM-DD>/manifests/`
`GPT/ThreeJS_Humanoid_Library/_STATE/`

## Source snapshot
- Rocketbox: https://github.com/microsoft/Microsoft-Rocketbox (archived, master branch, MIT).
- Base: https://quaternius.itch.io/universal-base-characters
- UAL1: https://quaternius.itch.io/universal-animation-library
- UAL2: https://quaternius.itch.io/universal-animation-library-2
- MakeHuman: https://www.makehumancommunity.org/
- VRoid Studio: https://vroid.com/en/studio
- Mixamo: https://www.mixamo.com/
