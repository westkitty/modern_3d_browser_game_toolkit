# Acquisition, Licensing & Private Recovery Policy (`catalog/humanoids/`)

## 1. Public GitHub vs Private Google Drive Boundary
- **Public GitHub (`catalog/humanoids/`):** Contains lightweight JSON catalogs (`sources.json`, `catalog.json`, `rocketbox-characters.json`, `characters-extended.json`, `compatibility-matrix.json`), the reusable JS/TS helper library (`lib/humanoid-library.js`), standalone local browser/inspector (`inspector.html`), validation tools (`tools/`), and documentation.
- **Forbidden in Public GitHub:** Large `.glb` / `.zip` / `.fbx` binaries, OAuth tokens, signed URLs, or Google Drive folder/file IDs (`archive_drive_file_id` is strictly `null` across all public JSON records).
- **Private Google Drive (`GPT/ThreeJS_Humanoid_Library/`):** Holds all immutable original ZIPs, processed GLB 2.0 assets, WebGL2 QA render PNGs, private CSV/JSON master indexes, and Drive upload receipts:
  - `ARCHIVE/2026-11-13/` — Microsoft Rocketbox (115 avatars, originals, GLBs, 230 PNGs, V4 receipts).
  - `ARCHIVE/2026-11-14/` — 9 multi-source CC0 packs (9 original ZIPs, 181 processed GLBs, 34 QA PNGs, master index & receipts).

---

## 2. Licensing Summary & Redistribution Guardrails

| Source Pack | Verified License | Permitted Use & Restrictions |
| :--- | :--- | :--- |
| **Microsoft Rocketbox** (`0943055d`) | **MIT License** | Commercial/non-commercial use permitted with MIT copyright & permission notice preserved. |
| **KayKit Adventurers (2.0 FREE)**, **Skeletons (1.1 FREE)**, **Character Animations (1.1 FREE)** | **CC0-1.0** (`License.txt` in each ZIP) | Public domain dedication (FREE editions). Paid EXTRA/SOURCE tiers are separate and not included. |
| **Quaternius Universal Base Characters**, **Modular Fantasy Outfits**, **UAL1**, **UAL2** (`Standard` editions) | **CC0-1.0** (`License_Standard.txt` / `License.txt`) | Standard free subsets only. **Never mix or relabel Quaternius QAL-restricted animations as CC0.** |
| **Quaternius Ultimate Modular Women** & **RPG Characters** | **CC0-1.0** (`License.txt`) | Full free releases from official `quaternius.com` links. (Note UMW `License.txt` contains an upstream author typo naming "Ultimate Modular Males" while applying CC0-1.0.) |
| **MakeHuman**, **VRoid Studio**, **Adobe Mixamo** | Account / Generator / Platform Terms | Retained as reference metadata only. Third-party VRoid models and Mixamo assets are **NOT** treated as unrestricted redistributable CC0 packs. |

---

## 3. Recovering Assets from Private Google Drive
1. Authenticate `rclone` with the authorized Google Drive remote (`gdrive:`) or use your authorized Drive UI.
2. Identify the active `GPT` folder ID dated `2026-08-27`:
   ```bash
   rclone lsjson gdrive: --dirs-only
   ```
3. Restore Rocketbox (`2026-11-13`) or Multi-Source (`2026-11-14`) GLBs locally:
   ```bash
   rclone copy --drive-root-folder-id <GPT_FOLDER_ID> \
     gdrive:ThreeJS_Humanoid_Library/ARCHIVE/2026-11-14/processed-glb/kaykit/adventurers/characters/ \
     ./assets/characters/
   ```
4. Verify SHA-256 checksums against `processed_glb_sha256` in `catalog.json` / `characters-extended.json` / `rocketbox-characters.json`.
