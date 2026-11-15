#!/usr/bin/env python3
"""Acquire eight exact Rocketbox source sets on an ephemeral GitHub-hosted runner.

Outputs one immutable, verified ZIP per avatar and an independent batch receipt.
Original FBX and texture bytes are never modified. No local Mac is used.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.request
from zipfile import ZipFile, ZIP_DEFLATED

SOURCE_REPO = "microsoft/Microsoft-Rocketbox"
SOURCE_SHA = "0943055db6ec570bcef9f2c8b41c9e5467c808f9"
SELECTED = (
    ("Adults", "Male_Adult_08"),
    ("Adults", "Female_Adult_11"),
    ("Professions", "Business_Male_04"),
    ("Professions", "Construction_Female_01"),
    ("Professions", "Fire_Male_04"),
    ("Professions", "Medical_Male_02"),
    ("Professions", "Sports_Female_01"),
    ("Professions", "Security_Male_01"),
)
OUT = Path(os.environ.get("ROCKETBOX_OUTPUT", "/tmp/rocketbox-batch02")).resolve()
ORIGINALS = OUT / "originals" / "rocketbox"
PACKAGES = OUT / "source-packages"
EVIDENCE = OUT / "evidence"
PER_FILE_LIMIT = 30_000_000
PER_AVATAR_LIMIT = 180_000_000
BATCH_LIMIT = 1_400_000_000
ZIP_LIMIT = 100 * 1024 * 1024
HEADERS = {"User-Agent": "westkitty-ThreeJS-Humanoid-Library-b02"}
READ_BYTES = 1024 * 1024
total = 0

def get(url):
    for attempt in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=45)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)

def gh_folder(path):
    url = f"https://api.github.com/repos/{SOURCE_REPO}/contents/{path}?ref={SOURCE_SHA}"
    with get(url) as stream:
        entries = json.load(stream)
    if not isinstance(entries, list):
        raise RuntimeError("Not a GitHub source directory: " + path)
    return entries

def sha256_stream(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(READ_BYTES), b""):
            digest.update(chunk)
    return digest.hexdigest()

def download(path, expected):
    global total
    if not re.fullmatch(r"[A-Za-z0-9_./ -]+", path) or ".." in Path(path).parts:
        raise RuntimeError("Unsafe source path")
    if expected <= 0 or expected > PER_FILE_LIMIT or total + expected > BATCH_LIMIT:
        raise RuntimeError("Source file/batch quota exceeded: " + path)
    target = ORIGINALS / Path(path).relative_to("Assets")
    if target.exists():
        raise RuntimeError("Unexpected pre-existing source destination")
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_name(target.name + ".partial")
    url = f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_SHA}/{path}"
    count = 0
    digest = hashlib.sha256()
    with get(url) as response, temp.open("xb") as out:
        for chunk in iter(lambda: response.read(READ_BYTES), b""):
            count += len(chunk)
            if count > expected:
                raise RuntimeError("Oversize HTTP response: " + path)
            digest.update(chunk)
            out.write(chunk)
    if count != expected:
        raise RuntimeError(f"Source byte count mismatch: {path}, {count} != {expected}")
    with temp.open("rb") as stream:
        head = stream.read(32)
    if target.suffix.lower() == ".fbx":
        if not (head.startswith(b"Kaydara FBX Binary") or head.startswith(b"; FBX")):
            raise RuntimeError("Wrong FBX signature: " + path)
    elif target.suffix.lower() == ".png":
        if not head.startswith(b"\x89PNG\r\n\x1a\n"):
            raise RuntimeError("Wrong PNG signature: " + path)
    elif target.suffix.lower() == ".tga":
        if len(head) < 18 or int.from_bytes(head[12:14], "little") == 0 or int.from_bytes(head[14:16], "little") == 0:
            raise RuntimeError("Wrong TGA signature: " + path)
    temp.rename(target)
    total += count
    return {"source_path": path,
            "archive_path": "Rocketbox/" + str(Path(path).relative_to("Assets")),
            "source_url": url, "bytes": count, "sha256": digest.hexdigest(),
            "kind": target.suffix.lower().lstrip(".")}, target

def main():
    PACKAGES.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    with get(f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_SHA}/LICENSE.md") as response:
        license_bytes = response.read()
    if not (license_bytes.startswith(b"MIT License") and b"Copyright (c) 2020 Microsoft" in license_bytes):
        raise RuntimeError("Microsoft MIT license content mismatch")
    license_sha = hashlib.sha256(license_bytes).hexdigest()
    avatars = []
    excluded_all = []
    for category, name in SELECTED:
        base = f"Assets/Avatars/{category}/{name}"
        inventory = []
        excluded = []
        for sub in ("Export", "Textures"):
            for ent in gh_folder(base + "/" + sub):
                if ent.get("type") != "file":
                    continue
                filename = ent["name"]
                if not re.fullmatch(r"[A-Za-z0-9_. -]+", filename):
                    raise RuntimeError("Unsafe source filename " + filename)
                ext = Path(filename).suffix.lower()
                if (sub == "Export" and ext != ".fbx") or (sub == "Textures" and ext not in (".tga", ".png")):
                    excluded.append(base + "/" + sub + "/" + filename)
                    continue
                inventory.append((base + "/" + sub + "/" + filename, int(ent["size"])))
        for ent in gh_folder(base):
            if ent.get("type") == "file" and ent.get("name") == name + ".png":
                inventory.append((base + "/" + name + ".png", int(ent["size"])))
        if not any(p.endswith(".fbx") for p, _ in inventory):
            raise RuntimeError("No avatar FBX " + name)
        if not any(p.lower().endswith((".tga", ".png")) and "/Textures/" in p for p, _ in inventory):
            raise RuntimeError("No avatar texture " + name)
        expected = sum(n for _, n in inventory)
        if expected > PER_AVATAR_LIMIT:
            raise RuntimeError("Oversized avatar; refuse unbounded intake " + name)
        files = []
        local = {}
        for path, n in inventory:
            record, actual = download(path, n)
            files.append(record)
            local[record["archive_path"]] = actual
        license_path = "Rocketbox/LICENSE.md"
        license_rec = {"source_path":"LICENSE.md", "archive_path":license_path, "bytes":len(license_bytes),
                       "sha256":license_sha,"kind":"license"}
        files.append(license_rec)
        source_record = {
            "schema":"rocketbox-b02-avatar-originals-v1",
            "source_repository":SOURCE_REPO,"source_commit":SOURCE_SHA,
            "avatar":name,"category":category,
            "rights":"MIT; preserve Microsoft copyright and license notice",
            "license_sha256":license_sha,"files":files,
            "excluded_nonmodel_paths":excluded,
            "source_byte_count":sum(x["bytes"] for x in files),
            "archive_state":"runner_verified_drive_pending"
        }
        filename = f"Rocketbox_{name}_Originals_Batch02_2026-11-13.zip"
        zip_path = PACKAGES / filename
        with ZipFile(zip_path, "x", ZIP_DEFLATED, compresslevel=6) as zipf:
            for archive_path, actual in local.items():
                zipf.write(actual, archive_path)
            zipf.writestr(license_path, license_bytes)
            zipf.writestr("Rocketbox/PROVENANCE_Batch02.json", json.dumps(source_record, indent=2) + "\n")
        if zip_path.stat().st_size > ZIP_LIMIT:
            raise RuntimeError(f"Drive 100 MiB limit breached for {name}: {zip_path.stat().st_size}")
        # Independent re-read of compressed contents proves bytes survive packaging.
        with ZipFile(zip_path) as zipf:
            if zipf.testzip() is not None:
                raise RuntimeError("ZIP CRC integrity failure: " + name)
            members = set(zipf.namelist())
            for entry in files:
                if entry["archive_path"] not in members:
                    raise RuntimeError("Missing archive member")
                actual_data = zipf.read(entry["archive_path"])
                if len(actual_data) != entry["bytes"] or hashlib.sha256(actual_data).hexdigest() != entry["sha256"]:
                    raise RuntimeError("Original hash mismatch after archive: " + entry["archive_path"])
        avatars.append({"name":name, "category":category, "archive_filename":filename,
                        "archive_sha256":sha256_stream(zip_path),
                        "archive_bytes":zip_path.stat().st_size,
                        "source_file_count":len(files),
                        "original_bytes":sum(x["bytes"] for x in files),
                        "source_files":files,"excluded_nonmodel_paths":excluded,
                        "github_artifact_name":"rocketbox-b02-source-"+name.lower().replace("_","-"),
                        "archive_state":"runner_verified_drive_pending"})
        excluded_all.extend(excluded)
        print(json.dumps({"acquired":name,"archive_bytes":zip_path.stat().st_size,
                          "source_files":len(files),"uncompressed_source_bytes":sum(x["bytes"] for x in files)}),flush=True)
    if len(avatars)!=8:
        raise RuntimeError("Expected exactly eight distinct avatars")
    receipt={
        "schema":"threejs-humanoid-batch02-source-receipt-v1",
        "source_repository":SOURCE_REPO,"source_commit":SOURCE_SHA,
        "github_run_id":os.environ.get("GITHUB_RUN_ID"),
        "rights":{"license":"MIT","license_original_sha256":license_sha,
                  "copyright":"Copyright (c) 2020 Microsoft",
                  "license_url":f"https://github.com/{SOURCE_REPO}/blob/{SOURCE_SHA}/LICENSE.md"},
        "archive_target":"Existing private Drive ThreeJS_Humanoid_Library / ARCHIVE/2026-11-13/originals",
        "source_set_count":len(avatars),"source_uncompressed_bytes":sum(x["original_bytes"] for x in avatars),
        "avatars":avatars,"excluded_nonmodel_paths":excluded_all,
        "validation":"verified source sizes, signatures, SHA-256, ZIP CRC and archive member SHA-256; Google Drive not yet written",
        "retrieved_utc":__import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    }
    (EVIDENCE/"BATCH02_RUNNER_SOURCE_RECEIPT.json").write_text(json.dumps(receipt,indent=2)+"\n")
    print(json.dumps({"status":"runner-source-verified","avatars":len(avatars),
                      "source_uncompressed_bytes":receipt["source_uncompressed_bytes"],
                      "archives":[{"name":x["name"],"size":x["archive_bytes"]} for x in avatars]}),flush=True)

if __name__ == "__main__":
    main()
