#!/usr/bin/env python3
"""Bounded, pinned, source-preserving public Rocketbox acquisition for CI."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.request
from datetime import datetime, timezone

SOURCE_REPO = "microsoft/Microsoft-Rocketbox"
SOURCE_SHA = "0943055db6ec570bcef9f2c8b41c9e5467c808f9"
AVATARS = (
    ("Adults", "Male_Adult_01", "full"),
    ("Adults", "Female_Adult_01", "full"),
    ("Professions", "Delivery_Male_01", "full"),
    ("Professions", "Medical_Female_01", "fbx-only"),
)
ANIMATIONS = ("m_idle_breathe_01.max.fbx", "f_idle_breathe_01.max.fbx")
MAX_FILE = 30_000_000
MAX_BATCH = 350_000_000
ROOT = Path(os.environ.get("ROCKETBOX_OUTPUT", "/tmp/rocketbox-batch")).resolve()
ORIGINALS = ROOT / "originals" / "rocketbox"
EVIDENCE = ROOT / "evidence"
session_headers = {"User-Agent": "westkitty-ThreeJS-Humanoid-Asset-Catalog"}
files = []
excluded = []
total = 0

def fetch(url):
    request = urllib.request.Request(url, headers=session_headers)
    return urllib.request.urlopen(request, timeout=35)

def get_directory(path):
    url = f"https://api.github.com/repos/{SOURCE_REPO}/contents/{path}?ref={SOURCE_SHA}"
    with fetch(url) as response:
        result = json.load(response)
    if not isinstance(result, list):
        raise RuntimeError(f"Expected GitHub directory response for {path}")
    return result

def store(path, size, kind):
    global total
    if not re.fullmatch(r"[A-Za-z0-9_./-]+", path) or ".." in Path(path).parts:
        raise RuntimeError("Unsafe relative source path")
    if size <= 0 or size > MAX_FILE or total + size > MAX_BATCH:
        raise RuntimeError("Source size/batch budget exceeded: " + path)
    url = f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_SHA}/{path}"
    relative = Path(path).relative_to("Assets")
    target = ORIGINALS / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise RuntimeError("Unexpected existing path: " + str(target))
    partial = target.with_name(target.name + ".partial")
    sha = hashlib.sha256()
    count = 0
    with fetch(url) as remote, partial.open("xb") as out:
        while True:
            chunk = remote.read(1 << 20)
            if not chunk:
                break
            count += len(chunk)
            if count > size:
                raise RuntimeError("Response larger than source metadata: " + path)
            sha.update(chunk)
            out.write(chunk)
    if count != size:
        raise RuntimeError(f"Source size mismatch for {path}: {count} != {size}")
    if target.suffix.lower() == ".fbx":
        prefix = partial.open("rb").read(24)
        if not (prefix.startswith(b"Kaydara FBX Binary") or prefix.startswith(b"; FBX")):
            raise RuntimeError("Not an FBX: " + path)
    if target.suffix.lower() == ".tga":
        with partial.open("rb") as stream:
            header = stream.read(18)
        if len(header) != 18 or int.from_bytes(header[12:14], "little") == 0 or int.from_bytes(header[14:16], "little") == 0:
            raise RuntimeError("Invalid TGA header: " + path)
    partial.replace(target)
    total += count
    files.append({"source_path": path, "archive_relative_path": "originals/rocketbox/" + str(relative),
                  "bytes": count, "sha256": sha.hexdigest(), "format": target.suffix.lower(),
                  "kind": kind, "source_url": url, "state": "runner_acquired_drive_pending"})

def from_directory(path, kind, extensions):
    for entry in get_directory(path):
        if entry.get("type") != "file":
            continue
        name = entry["name"]
        if not re.fullmatch(r"[A-Za-z0-9_. -]+", name):
            raise RuntimeError("Unsafe source filename")
        suffix = Path(name).suffix.lower()
        if suffix not in extensions:
            excluded.append({"source_path": path + "/" + name, "reason": "not required for FBX/texture browser pipeline"})
            continue
        store(path + "/" + name, int(entry["size"]), kind)

for group, name, scope in AVATARS:
    base = f"Assets/Avatars/{group}/{name}"
    from_directory(base + "/Export", "character-fbx", {".fbx"})
    if scope == "full":
        from_directory(base + "/Textures", "character-texture", {".tga", ".png"})
    preview = base + "/" + name + ".png"
    parent = get_directory(base)
    found = next((p for p in parent if p.get("name") == name + ".png" and p.get("type") == "file"), None)
    if found:
        store(preview, int(found["size"]), "character-preview")

animation_dir = "Assets/Animations/all_animations_max_motextr_static"
for name in ANIMATIONS:
    entries = get_directory(animation_dir)
    match = next((x for x in entries if x.get("name") == name and x.get("type") == "file"), None)
    if not match:
        raise RuntimeError("Specified animation absent from pinned source: " + name)
    store(animation_dir + "/" + name, int(match["size"]), "humanoid-animation-fbx")

with fetch(f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_SHA}/LICENSE.md") as stream:
    license_text = stream.read()
if not license_text.startswith(b"MIT License") or b"Copyright (c) 2020 Microsoft" not in license_text:
    raise RuntimeError("Unexpected repository license")
(ORIGINALS / "LICENSE.md").write_bytes(license_text)
license_sha = hashlib.sha256(license_text).hexdigest()
files.append({"source_path": "LICENSE.md", "archive_relative_path": "originals/rocketbox/LICENSE.md",
              "bytes": len(license_text), "sha256": license_sha, "format": ".md",
              "kind": "license", "state": "runner_acquired_drive_pending"})
EVIDENCE.mkdir(parents=True, exist_ok=True)
receipt = {
    "schema": "threejs-rocketbox-source-acquisition-v1",
    "source_repository": SOURCE_REPO, "source_commit": SOURCE_SHA,
    "retrieved_utc": datetime.now(timezone.utc).isoformat(),
    "github_run_id": os.environ.get("GITHUB_RUN_ID"), "github_sha": os.environ.get("GITHUB_SHA"),
    "license": {"name": "MIT", "source_url": f"https://github.com/{SOURCE_REPO}/blob/{SOURCE_SHA}/LICENSE.md",
                "sha256": license_sha, "attribution": "Copyright (c) 2020 Microsoft; include MIT text"},
    "avatar_scope": [{"name": name, "scope": scope} for _, name, scope in AVATARS],
    "animation_scope": list(ANIMATIONS),
    "file_count": len(files), "total_source_bytes": sum(f["bytes"] for f in files),
    "files": files, "excluded": excluded,
    "archive_state": "runner_downloaded_waiting_for_verified_Google_Drive_upload",
    "model_validation": "FBX/TGA signature and source-byte sizes only; no GLB/visual test implied"
}
(EVIDENCE / "source_receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
(EVIDENCE / "SHA256SUMS.txt").write_text(
    "".join(f["sha256"] + "  " + f["archive_relative_path"] + "\n" for f in files)
)
print(json.dumps({"source_files": len(files), "total_bytes": receipt["total_source_bytes"],
                  "avatars": [x["name"] for x in receipt["avatar_scope"]], "animations": list(ANIMATIONS),
                  "skipped_files": len(excluded)}))
