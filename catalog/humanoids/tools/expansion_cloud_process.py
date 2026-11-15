#!/usr/bin/env python3
"""Cloud/local acquisition & GLB2 packing for expansion humanoid packs.

Handles:
  - PolygonalMind 100 Avatars R1 (tag 230412.1) -> normalize 100 .vrm -> GLB 2.0
  - PolygonalMind 100 Avatars R2 (tag 230412.2) -> normalize 100 .vrm -> GLB 2.0
  - Kenney Mini Characters & Blocky Characters -> extract & pack GLB 2.0 + triage aids
  - Direct downloads + integrity hashing for XYZ, GDQuest, OGA FPS Arms, Kenney FBX packs
"""
from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import math
import os
import re
import shutil
import struct
import subprocess
import urllib.request
import zipfile
from pathlib import Path

UA = "Mozilla/5.0 (compatible; HumanoidLibraryBuilder/1.0)"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip()).strip("_").lower()
    return re.sub(r"_+", "_", s) or "asset"


def download_file(url: str, dest: Path, headers: dict[str, str] | None = None) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    req_headers = {"User-Agent": UA}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=120) as resp, dest.open("wb") as out:
        shutil.copyfileobj(resp, out, length=1 << 20)
    return dest


def fetch_text(url: str, headers: dict[str, str] | None = None) -> str:
    req_headers = {"User-Agent": UA}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", "replace")


def resolve_kenney_zip_url(asset_slug: str) -> str:
    page_url = f"https://kenney.nl/assets/{asset_slug}"
    html = fetch_text(page_url)
    m = re.search(r"data-download-id=['\"]([a-fA-F0-9]+)['\"]", html)
    if not m:
        raise RuntimeError(f"Could not find data-download-id on {page_url}")
    dl_id = m.group(1)
    api_url = f"https://kenney.nl/download-link/{dl_id}"
    payload = json.loads(fetch_text(api_url, headers={"Referer": page_url}))
    dl_url = payload.get("url")
    if not dl_url:
        raise RuntimeError(f"Kenney download-link returned no URL for {asset_slug}: {payload}")
    return dl_url


def safe_extract_zip(zip_path: Path, dest_dir: Path) -> None:
    dest_root = dest_dir.resolve()
    dest_root.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            target = (dest_root / info.filename).resolve()
            if not str(target).startswith(str(dest_root) + os.sep) and target != dest_root:
                raise ValueError(f"Blocked unsafe zip path: {info.filename}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, target.open("wb") as dst:
                shutil.copyfileobj(src, dst)


def parse_glb_chunks(data: bytes) -> tuple[dict, bytes]:
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError("Invalid GLB magic header")
    version, total_len = struct.unpack_from("<II", data, 4)
    if version != 2 or total_len > len(data):
        raise ValueError(f"Invalid GLB header version={version} length={total_len} file={len(data)}")
    offset = 12
    json_chunk = None
    bin_chunk = b""
    while offset + 8 <= total_len:
        chunk_len, chunk_tag = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk_data = data[offset : offset + chunk_len]
        offset += chunk_len
        if chunk_tag == b"JSON" and json_chunk is None:
            json_chunk = json.loads(chunk_data.decode("utf-8"))
        elif chunk_tag == b"BIN\x00" and not bin_chunk:
            bin_chunk = chunk_data
    if json_chunk is None:
        raise ValueError("GLB missing JSON chunk")
    return json_chunk, bin_chunk


def write_glb_bytes(gltf: dict, bin_bytes: bytes, out_path: Path) -> None:
    bin_buf = bytearray(bin_bytes)
    while len(bin_buf) % 4 != 0:
        bin_buf.append(0)
    if gltf.get("buffers"):
        gltf["buffers"][0]["byteLength"] = len(bin_buf)
    else:
        gltf["buffers"] = [{"byteLength": len(bin_buf)}]
    json_bytes = bytearray(json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    while len(json_bytes) % 4 != 0:
        json_bytes.append(0x20)
    has_bin = len(bin_buf) > 0
    total_len = 12 + 8 + len(json_bytes) + (8 + len(bin_buf) if has_bin else 0)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("wb") as out:
        out.write(struct.pack("<III", 0x46546C67, 2, total_len))
        out.write(struct.pack("<I4s", len(json_bytes), b"JSON"))
        out.write(json_bytes)
        if has_bin:
            out.write(struct.pack("<I4s", len(bin_buf), b"BIN\x00"))
            out.write(bin_buf)


def pack_gltf_to_glb(gltf_path: Path, out_glb_path: Path, uri_fixes: dict[str, str] | None = None) -> dict:
    gltf = copy.deepcopy(json.loads(gltf_path.read_text(encoding="utf-8")))
    gltf_dir = gltf_path.parent
    bin_chunks = bytearray()
    buffers = gltf.get("buffers", [])
    if len(buffers) > 1:
        raise ValueError(f"Expected <=1 buffer in {gltf_path}, got {len(buffers)}")
    for buf in buffers:
        uri = buf.get("uri", "")
        if uri.startswith("data:"):
            raw = base64.b64decode(uri.split(",", 1)[1])
        elif uri:
            raw = (gltf_dir / uri).read_bytes()
        else:
            raw = b""
        bin_chunks.extend(raw)
        while len(bin_chunks) % 4 != 0:
            bin_chunks.append(0)
        buf.pop("uri", None)
    buffer_views = gltf.setdefault("bufferViews", [])
    for img in gltf.get("images", []):
        uri = img.get("uri")
        if not uri:
            continue
        if uri.startswith("data:"):
            header, b64 = uri.split(",", 1)
            raw_img = base64.b64decode(b64)
            mime = header.split(";")[0].replace("data:", "") or "image/png"
        else:
            resolved = uri_fixes.get(uri, uri) if uri_fixes else uri
            img_path = gltf_dir / resolved
            if not img_path.exists():
                raise FileNotFoundError(f"Missing image URI {img_path} in {gltf_path}")
            raw_img = img_path.read_bytes()
            ext = img_path.suffix.lower()
            mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
        while len(bin_chunks) % 4 != 0:
            bin_chunks.append(0)
        offset = len(bin_chunks)
        bin_chunks.extend(raw_img)
        bv_idx = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(raw_img)})
        img.pop("uri", None)
        img["bufferView"] = bv_idx
        img["mimeType"] = mime
    write_glb_bytes(gltf, bytes(bin_chunks), out_glb_path)
    return extract_glb_stats(out_glb_path)


def extract_glb_stats(glb_path: Path) -> dict:
    data = glb_path.read_bytes()
    gltf, _ = parse_glb_chunks(data)
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])
    skins = gltf.get("skins", [])
    nodes = gltf.get("nodes", [])
    anims = gltf.get("animations", [])
    images = gltf.get("images", [])
    external = [
        x.get("uri")
        for x in gltf.get("buffers", []) + images
        if x.get("uri") and not x["uri"].startswith("data:")
    ]
    tris = 0
    mins = [math.inf, math.inf, math.inf]
    maxs = [-math.inf, -math.inf, -math.inf]
    for mesh in meshes:
        for prim in mesh.get("primitives", []):
            if "indices" in prim:
                tris += accessors[prim["indices"]].get("count", 0) // 3
            else:
                pos_idx = prim.get("attributes", {}).get("POSITION")
                if pos_idx is not None:
                    tris += accessors[pos_idx].get("count", 0) // 3
            pos_idx = prim.get("attributes", {}).get("POSITION")
            if pos_idx is not None:
                acc = accessors[pos_idx]
                if "min" in acc and "max" in acc:
                    for i in range(3):
                        mins[i] = min(mins[i], float(acc["min"][i]))
                        maxs[i] = max(maxs[i], float(acc["max"][i]))
    dims = [round(max(0.0, maxs[i] - mins[i]), 4) if math.isfinite(mins[i]) else 0.0 for i in range(3)]
    joint_names = []
    joint_count = 0
    if skins:
        j_indices = skins[0].get("joints", [])
        joint_count = len(j_indices)
        joint_names = [nodes[idx].get("name", f"joint_{idx}") for idx in j_indices if idx < len(nodes)]
    return {
        "bytes": glb_path.stat().st_size,
        "sha256": hashlib.sha256(data).hexdigest(),
        "mesh_count": len(meshes),
        "primitive_count": sum(len(m.get("primitives", [])) for m in meshes),
        "triangle_count": tris,
        "skin_count": len(skins),
        "joint_count": joint_count,
        "joint_names": joint_names,
        "image_count": len(images),
        "texture_count": len(gltf.get("textures", [])),
        "material_count": len(gltf.get("materials", [])),
        "animation_count": len(anims),
        "animation_names": [a.get("name", f"anim_{i}") for i, a in enumerate(anims)],
        "dimensions_m": dims,
        "external_uris": external,
        "extensions_used": gltf.get("extensionsUsed", []),
        "extensions_required": gltf.get("extensionsRequired", []),
    }


def normalize_vrm_to_glb(vrm_bytes: bytes, out_glb_path: Path) -> tuple[dict, dict]:
    gltf, bin_bytes = parse_glb_chunks(vrm_bytes)
    gltf = copy.deepcopy(gltf)
    vrm_ext = gltf.get("extensions", {}).pop("VRM", None) or gltf.get("extensions", {}).pop("VRMC_vrm", None) or {}
    humanoid_bones = {}
    if isinstance(vrm_ext, dict):
        hb_list = vrm_ext.get("humanoid", {}).get("humanBones", [])
        nodes = gltf.get("nodes", [])
        if isinstance(hb_list, list):
            for entry in hb_list:
                bone_key = entry.get("bone")
                node_idx = entry.get("node")
                if bone_key and isinstance(node_idx, int) and 0 <= node_idx < len(nodes):
                    humanoid_bones[bone_key] = nodes[node_idx].get("name", f"node_{node_idx}")
        elif isinstance(hb_list, dict):
            for bone_key, entry in hb_list.items():
                node_idx = entry.get("node") if isinstance(entry, dict) else None
                if isinstance(node_idx, int) and 0 <= node_idx < len(nodes):
                    humanoid_bones[bone_key] = nodes[node_idx].get("name", f"node_{node_idx}")
    if "extensions" in gltf and not gltf["extensions"]:
        gltf.pop("extensions")
    for list_key in ("extensionsUsed", "extensionsRequired"):
        if list_key in gltf:
            gltf[list_key] = [e for e in gltf[list_key] if not e.startswith(("VRM", "VRMC_"))]
            if not gltf[list_key]:
                gltf.pop(list_key)
    # Remove any external image URIs if already embedded, otherwise validate
    write_glb_bytes(gltf, bin_bytes, out_glb_path)
    stats = extract_glb_stats(out_glb_path)
    meta = {
        "vrm_title": (vrm_ext.get("meta", {}) or {}).get("title") if isinstance(vrm_ext, dict) else None,
        "vrm_author": (vrm_ext.get("meta", {}) or {}).get("author") if isinstance(vrm_ext, dict) else None,
        "vrm_license": (vrm_ext.get("meta", {}) or {}).get("licenseName") if isinstance(vrm_ext, dict) else None,
        "humanoid_bone_map": humanoid_bones,
    }
    return stats, meta


def process_polygonalmind_r1_or_r2(round_num: int, work_dir: Path, out_dir: Path) -> dict:
    if round_num == 1:
        source_id = "polygonalmind-100-avatars-r1"
        tag = "230412.1"
        zip_name = "2003_100AvatarsR1AssetPack.zip"
    else:
        source_id = "polygonalmind-100-avatars-r2"
        tag = "230412.2"
        zip_name = "2103_100AvatarsR2AssetPack.zip"

    orig_dir = work_dir / "originals" / source_id
    orig_dir.mkdir(parents=True, exist_ok=True)
    zip_url = f"https://github.com/PolygonalMind/initiative-opensource-release/releases/download/{tag}/{zip_name}"
    lic_url = "https://raw.githubusercontent.com/PolygonalMind/initiative-opensource-release/main/License.md"
    zip_path = download_file(zip_url, orig_dir / zip_name)
    lic_path = download_file(lic_url, orig_dir / "License.md")

    glb_dir = out_dir / "processed-glb" / source_id
    glb_dir.mkdir(parents=True, exist_ok=True)

    records = []
    skipped = []
    seen_slugs = set()
    with zipfile.ZipFile(zip_path) as zf:
        vrm_entries = sorted(n for n in zf.namelist() if n.lower().endswith(".vrm") and not n.endswith("/"))
        for entry in vrm_entries:
            p = Path(entry)
            raw_slug = slugify(p.stem)
            slug = raw_slug
            if slug in seen_slugs:
                slug = f"{raw_slug}_{len(seen_slugs)}"
            seen_slugs.add(slug)
            glb_name = f"{slug}.glb"
            glb_path = glb_dir / glb_name
            vrm_bytes = zf.read(entry)
            try:
                stats, vrm_meta = normalize_vrm_to_glb(vrm_bytes, glb_path)
                assert not stats["external_uris"], f"External URIs remain: {stats['external_uris']}"
                assert stats["primitive_count"] > 0, "Zero primitives"
                assert stats["skin_count"] > 0 and stats["joint_count"] > 0, "Missing humanoid skin/joints"
                records.append({
                    "asset_id": f"{source_id}/character/{slug}",
                    "display_name": p.stem,
                    "source_id": source_id,
                    "asset_type": "character",
                    "category": "voxel_stylized_avatar",
                    "skeleton_family": "polygonalmind-vrm-humanoid",
                    "source_rel_path": entry,
                    "processed_glb_rel": f"{source_id}/{glb_name}",
                    "vrm_meta": vrm_meta,
                    **stats,
                })
            except Exception as exc:
                skipped.append({"entry": entry, "error": str(exc)})

    manifest = {
        "source_id": source_id,
        "release_tag": tag,
        "archive_basename": zip_name,
        "archive_bytes": zip_path.stat().st_size,
        "archive_sha256": sha256_file(zip_path),
        "license_basename": "License.md",
        "license_sha256": sha256_file(lic_path),
        "vrm_entries_found": len(vrm_entries),
        "admitted_count": len(records),
        "skipped": skipped,
        "records": records,
    }
    return manifest


def pack_glb_external_images(src_glb: Path, out_glb: Path) -> dict:
    gltf, bin_bytes = parse_glb_chunks(src_glb.read_bytes())
    gltf = copy.deepcopy(gltf)
    bin_chunks = bytearray(bin_bytes)
    buffer_views = gltf.setdefault("bufferViews", [])
    changed = False
    for img in gltf.get("images", []):
        uri = img.get("uri")
        if not uri:
            continue
        if uri.startswith("data:"):
            header, b64 = uri.split(",", 1)
            raw_img = base64.b64decode(b64)
            mime = header.split(";")[0].replace("data:", "") or "image/png"
        else:
            img_path = src_glb.parent / uri
            if not img_path.exists():
                raise FileNotFoundError(f"Missing external GLB image {img_path} from {src_glb}")
            raw_img = img_path.read_bytes()
            ext = img_path.suffix.lower()
            mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
        while len(bin_chunks) % 4 != 0:
            bin_chunks.append(0)
        offset = len(bin_chunks)
        bin_chunks.extend(raw_img)
        bv_idx = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(raw_img)})
        img.pop("uri", None)
        img["bufferView"] = bv_idx
        img["mimeType"] = mime
        changed = True
    if changed:
        write_glb_bytes(gltf, bytes(bin_chunks), out_glb)
    else:
        out_glb.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_glb, out_glb)
    return extract_glb_stats(out_glb)


def process_kenney_glb_pack(slug_name: str, source_id: str, category: str, skeleton_family: str, work_dir: Path, out_dir: Path) -> dict:
    orig_dir = work_dir / "originals" / source_id
    orig_dir.mkdir(parents=True, exist_ok=True)
    zip_url = resolve_kenney_zip_url(slug_name)
    zip_path = download_file(zip_url, orig_dir / f"{source_id}.zip")
    ext_dir = work_dir / "extracted" / source_id
    if not ext_dir.exists():
        safe_extract_zip(zip_path, ext_dir)
    lic_files = list(ext_dir.rglob("License.txt")) + list(ext_dir.rglob("license.txt"))
    lic_sha = sha256_file(lic_files[0]) if lic_files else None

    glb_dir = out_dir / "processed-glb" / source_id
    glb_dir.mkdir(parents=True, exist_ok=True)
    records = []
    rejected = []

    for glb_src in sorted(ext_dir.rglob("*.glb")):
        stem = glb_src.stem
        rel = str(glb_src.relative_to(ext_dir))
        if stem.startswith(("aid-", "aid_")):
            rejected.append({"source_rel_path": rel, "reason": "mobility_aid_or_prop_not_humanoid_rig"})
            continue
        slug = slugify(stem)
        dest = glb_dir / f"{slug}.glb"
        stats = pack_glb_external_images(glb_src, dest)
        assert not stats["external_uris"], f"External URIs in {dest}: {stats['external_uris']}"
        records.append({
            "asset_id": f"{source_id}/character/{slug}",
            "display_name": stem,
            "source_id": source_id,
            "asset_type": "character",
            "category": category,
            "skeleton_family": skeleton_family,
            "source_rel_path": rel,
            "processed_glb_rel": f"{source_id}/{slug}.glb",
            **stats,
        })
    return {
        "source_id": source_id,
        "archive_basename": zip_path.name,
        "archive_bytes": zip_path.stat().st_size,
        "archive_sha256": sha256_file(zip_path),
        "license_basename": lic_files[0].name if lic_files else None,
        "license_sha256": lic_sha,
        "admitted_count": len(records),
        "rejected": rejected,
        "records": records,
    }


def download_direct_inputs(work_dir: Path, out_dir: Path) -> dict:
    manifests = {}
    # 1. PolygonalMind XYZ
    xyz_dir = work_dir / "originals" / "polygonalmind-xyz-creatures"
    xyz_zip = download_file(
        "https://github.com/PolygonalMind/initiative-opensource-release/releases/download/230526/2006_XYZAssetPack.zip",
        xyz_dir / "2006_XYZAssetPack.zip",
    )
    xyz_lic = download_file(
        "https://raw.githubusercontent.com/PolygonalMind/initiative-opensource-release/main/License.md",
        xyz_dir / "License.md",
    )
    safe_extract_zip(xyz_zip, work_dir / "extracted" / "polygonalmind-xyz-creatures")
    manifests["polygonalmind-xyz-creatures"] = {
        "archive_basename": xyz_zip.name,
        "archive_bytes": xyz_zip.stat().st_size,
        "archive_sha256": sha256_file(xyz_zip),
        "license_basename": "License.md",
        "license_sha256": sha256_file(xyz_lic),
    }

    # 2. GDQuest Open 3D Mannequin
    gdq_dir = work_dir / "originals" / "gdquest-open-3d-mannequin"
    gdq_glb = download_file(
        "https://raw.githubusercontent.com/gdquest-demos/godot-3d-mannequin/master/godot/assets/3d/mannequiny/mannequiny-0.3.0.glb",
        gdq_dir / "mannequiny-0.3.0.glb",
    )
    gdq_blend = download_file(
        "https://github.com/gdquest-demos/godot-3d-mannequin/releases/download/v0.4.0/mannequiny-0.4.0.blend",
        gdq_dir / "mannequiny-0.4.0.blend",
    )
    gdq_lic = download_file(
        "https://raw.githubusercontent.com/gdquest-demos/godot-3d-mannequin/master/LICENSE",
        gdq_dir / "LICENSE",
    )
    manifests["gdquest-open-3d-mannequin"] = {
        "archive_basename": gdq_blend.name,
        "archive_bytes": gdq_blend.stat().st_size,
        "archive_sha256": sha256_file(gdq_blend),
        "secondary_original_basename": gdq_glb.name,
        "secondary_original_bytes": gdq_glb.stat().st_size,
        "secondary_original_sha256": sha256_file(gdq_glb),
        "license_basename": "LICENSE",
        "license_sha256": sha256_file(gdq_lic),
    }

    # 3. OGA Rigged FPS Arms
    oga_dir = work_dir / "originals" / "oga-rigged-fps-arms"
    oga_7z = download_file(
        "https://opengameart.org/sites/default/files/fps%20arms.7z",
        oga_dir / "fps_arms.7z",
    )
    oga_ext = work_dir / "extracted" / "oga-rigged-fps-arms"
    oga_ext.mkdir(parents=True, exist_ok=True)
    subprocess.run(["7z", "x", "-y", f"-o{oga_ext}", str(oga_7z)], check=True)
    manifests["oga-rigged-fps-arms"] = {
        "archive_basename": "fps_arms.7z",
        "archive_bytes": oga_7z.stat().st_size,
        "archive_sha256": sha256_file(oga_7z),
    }

    # 4. Kenney 5 packs
    manifests["kenney-mini-characters"] = process_kenney_glb_pack(
        "mini-characters", "kenney-mini-characters", "miniature_animated_humanoid", "kenney-mini-rig", work_dir, out_dir
    )
    manifests["kenney-blocky-characters"] = process_kenney_glb_pack(
        "blocky-characters", "kenney-blocky-characters", "blocky_node_animated_humanoid", "kenney-blocky-nodes", work_dir, out_dir
    )
    for slug_name, src_id in [
        ("animated-characters-protagonists", "kenney-animated-protagonists"),
        ("animated-characters-retro", "kenney-animated-retro"),
        ("animated-characters-survivors", "kenney-animated-survivors"),
    ]:
        zurl = resolve_kenney_zip_url(slug_name)
        odir = work_dir / "originals" / src_id
        zp = download_file(zurl, odir / f"{src_id}.zip")
        ed = work_dir / "extracted" / src_id
        if not ed.exists():
            safe_extract_zip(zp, ed)
        lics = list(ed.rglob("License.txt")) + list(ed.rglob("license.txt"))
        manifests[src_id] = {
            "archive_basename": zp.name,
            "archive_bytes": zp.stat().st_size,
            "archive_sha256": sha256_file(zp),
            "license_basename": lics[0].name if lics else None,
            "license_sha256": sha256_file(lics[0]) if lics else None,
        }
    return manifests


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", required=True, choices=["pm_r1", "pm_r2", "direct_prepare"])
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()

    work_dir = Path(args.work_dir).resolve()
    out_dir = Path(args.out_dir).resolve()
    rep_dir = out_dir / "reports"
    rep_dir.mkdir(parents=True, exist_ok=True)

    if args.task == "pm_r1":
        res = process_polygonalmind_r1_or_r2(1, work_dir, out_dir)
        (rep_dir / "pm_r1_manifest.json").write_text(json.dumps(res, indent=2) + "\n")
        print(json.dumps({"task": "pm_r1", "admitted": res["admitted_count"], "skipped": len(res["skipped"])}))
        if res["admitted_count"] < 100 or res["skipped"]:
            raise SystemExit(f"pm_r1 incomplete: {res['skipped']}")
    elif args.task == "pm_r2":
        res = process_polygonalmind_r1_or_r2(2, work_dir, out_dir)
        (rep_dir / "pm_r2_manifest.json").write_text(json.dumps(res, indent=2) + "\n")
        print(json.dumps({"task": "pm_r2", "admitted": res["admitted_count"], "skipped": len(res["skipped"])}))
        if res["admitted_count"] < 100 or res["skipped"]:
            raise SystemExit(f"pm_r2 incomplete: {res['skipped']}")
    elif args.task == "direct_prepare":
        res = download_direct_inputs(work_dir, out_dir)
        (rep_dir / "direct_prepare_manifest.json").write_text(json.dumps(res, indent=2) + "\n")
        print(json.dumps({"task": "direct_prepare", "sources": list(res.keys())}))


if __name__ == "__main__":
    main()
