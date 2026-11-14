#!/usr/bin/env python3
"""Acquire one of eleven frozen Rocketbox remainder groups on a disposable GitHub runner.

Read the pinned Git-blob source inventory. Download ONLY non-acquired character
FBXs, textures and previews. Preserve every source byte. Emit <100MiB
Drive-ready transport bundles, original-file hashes and reconstructible receipts.
This code never contacts private Google Drive or updates GitHub catalog state.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sys
import time
import urllib.error
import urllib.request
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED

SOURCE_REPO = "microsoft/Microsoft-Rocketbox"
COMMIT = "0943055db6ec570bcef9f2c8b41c9e5467c808f9"
GIB = 1024 ** 3
MIB = 1024 ** 2
MAX_SOURCE_FILE = 30 * MIB
MAX_GROUP = 1_400_000_000
SAFE_ARCHIVE = 86 * MIB
SAFE_PACK = 87 * MIB
DRIVE_LIMIT = 100 * MIB
HEADERS = {"User-Agent": "StinkyWeasel-ThreeJS-Humanoid-Archive/3.0", "Accept": "application/octet-stream"}
SOURCES = {"fbx", "tga", "png"}
PLAN_PATH = Path("catalog/humanoids/rocketbox-remaining-103-plan.json")
READ = 1024 * 1024

def raw_get(url, target=None, max_bytes=MAX_SOURCE_FILE):
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=65) as response:
                content = bytearray() if target is None else None
                count = 0
                output = target.open("xb") if target is not None else None
                try:
                    while True:
                        chunk = response.read(READ)
                        if not chunk:
                            break
                        count += len(chunk)
                        if count > max_bytes:
                            raise RuntimeError(f"Provider response larger than the source cap: {url}")
                        if output:
                            output.write(chunk)
                        else:
                            content.extend(chunk)
                finally:
                    if output:
                        output.close()
                return bytes(content) if target is None else count
        except (TimeoutError, urllib.error.HTTPError, urllib.error.URLError, OSError) as error:
            if target is not None and target.exists():
                target.unlink()
            if attempt == 3:
                raise
            if isinstance(error, urllib.error.HTTPError) and error.code in (401, 403, 404, 410, 451):
                raise
            time.sleep(2 * (attempt + 1))

def sha256_file(p: Path):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for piece in iter(lambda: f.read(READ), b""):
            h.update(piece)
    return h.hexdigest()

def git_blob_sha(path: Path, n: int):
    h = hashlib.sha1()
    h.update(b"blob " + str(n).encode("ascii") + b"\0")
    with path.open("rb") as f:
        for piece in iter(lambda: f.read(READ), b""):
            h.update(piece)
    return h.hexdigest()

def valid_signature(p: Path):
    with p.open("rb") as f:
        header=f.read(32)
    ext=p.suffix.lower()
    if ext == ".fbx":
        return header.startswith(b"Kaydara FBX Binary") or header.startswith(b"; FBX")
    if ext == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".tga":
        return len(header) >= 18 and int.from_bytes(header[12:14],"little")>0 and int.from_bytes(header[14:16],"little")>0
    return False

def check_zip(path: Path, records: list[dict], license_sha: str):
    with ZipFile(path) as z:
        if z.testzip() is not None:
            raise RuntimeError("Corrupt source ZIP: "+str(path))
        names = z.namelist()
        if len(names) != len(set(names)):
            raise RuntimeError("Duplicate ZIP path")
        for record in records:
            name = "Rocketbox/" + record["path"].removeprefix("Assets/")
            data = z.read(name)
            if len(data) != record["bytes"] or hashlib.sha256(data).hexdigest() != record["sha256"]:
                raise RuntimeError("Original member checksum drift: "+name)
        if hashlib.sha256(z.read("Rocketbox/LICENSE.md")).hexdigest()!=license_sha:
            raise RuntimeError("MIT license missing from package")

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--group", type=int, required=True)
    a.add_argument("--root", default="/tmp/rocketbox-remaining")
    args=a.parse_args()
    base=Path(args.root).resolve()/("group-"+str(args.group))
    originals=base/"raw"
    source_packages=base/"source-zips"
    packs=base/"packs"
    evidence=base/"evidence"
    for folder in (originals,source_packages,packs,evidence):
        folder.mkdir(parents=True,exist_ok=True)
    plan=json.loads(PLAN_PATH.read_text())
    if plan["schema"]!="rocketbox_remaining_103_pinned_source_plan_v1" or plan["source_commit"]!=COMMIT or len(plan["avatars"])!=103 or len(plan["batches"])!=11:
        raise RuntimeError("Pinned source plan differs from known 103-source baseline")
    if args.group<0 or args.group>=len(plan["batches"]):
        raise RuntimeError("Invalid batch index")
    batch=plan["batches"][args.group]
    avatar_map={x["asset_id"]:x for x in plan["avatars"]}
    if len(batch["models"])>10 or batch["index"]!=args.group or not batch["models"]:
        raise RuntimeError("Source group metadata invalid")
    observed_source_bytes=sum(avatar_map[id]["total_source_bytes"] for id in batch["models"])
    if observed_source_bytes>MAX_GROUP:
        raise RuntimeError("Group exceeds fixed admission budget")
    license_data=raw_get(f"https://raw.githubusercontent.com/{SOURCE_REPO}/{COMMIT}/LICENSE.md",max_bytes=200_000)
    if not license_data.startswith(b"MIT License") or b"Copyright (c) 2020 Microsoft" not in license_data:
        raise RuntimeError("Source MIT license validation failed")
    license_sha=hashlib.sha256(license_data).hexdigest()
    completed=[]
    blocked=[]
    inner_zips=[]
    total_downloaded=0
    for source_id in batch["models"]:
        rec=avatar_map[source_id]
        folder=rec["source_directory"]
        label=folder.rsplit("/",1)[-1]
        files=rec["expected_files"]
        if not files or len(files)!=len({x["path"] for x in files}):
            raise RuntimeError("Invalid file inventory for "+label)
        actual=[]
        try:
            for f in files:
                source_path=f["path"]
                parts=PurePosixPath(source_path)
                if not source_path.startswith(folder+"/") or parts.is_absolute() or ".." in parts.parts or parts.suffix.lower().lstrip(".") not in SOURCES:
                    raise RuntimeError("Invalid source inventory path: "+source_path)
                if f["bytes"]<=0 or f["bytes"]>MAX_SOURCE_FILE:
                    raise RuntimeError("Source file exceeds 30 MiB cap: "+source_path)
                target=originals/source_path.removeprefix("Assets/")
                target.parent.mkdir(parents=True,exist_ok=True)
                source_url=f"https://raw.githubusercontent.com/{SOURCE_REPO}/{COMMIT}/{source_path}"
                n=raw_get(source_url,target,max_bytes=MAX_SOURCE_FILE)
                if n!=f["bytes"] or not valid_signature(target):
                    raise RuntimeError("File byte count or format signature mismatch: "+source_path)
                blob_sha=git_blob_sha(target,n)
                if blob_sha!=f["git_blob_sha"]:
                    raise RuntimeError("Git upstream blob SHA mismatch: "+source_path)
                computed=sha256_file(target)
                actual.append({"path":source_path,"bytes":n,"git_blob_sha":blob_sha,"sha256":computed})
                total_downloaded+=n
                if total_downloaded>MAX_GROUP:
                    raise RuntimeError("Group source-byte budget exceeded")
            # Attempt a complete per-avatar archive. For unusually large avatars,
            # split along file boundaries and preserve an explicit part count.
            contents=[(x,originals/x["path"].removeprefix("Assets/")) for x in actual]
            desired_name=f"Rocketbox_{label}_Originals_Remaining_Group{args.group:02d}.zip"
            candidate=source_packages/desired_name
            make_source_zip(candidate,contents,source_id,COMMIT,license_data,1,1)
            if candidate.stat().st_size <= SAFE_ARCHIVE:
                chunks=[(candidate,contents)]
            else:
                candidate.unlink() # only ephemeral oversized candidate, never a source original
                # Bound raw source bytes per piece. Every source file is <=30 MiB,
                # hence each compressed part is guaranteed below upload cap.
                pieces=[]
                current=[]
                current_size=0
                for entry in contents:
                    size=entry[0]["bytes"]
                    if current and current_size+size > 65*MIB:
                        pieces.append(current);current=[];current_size=0
                    current.append(entry);current_size+=size
                if current:
                    pieces.append(current)
                chunks=[]
                for i,piece in enumerate(pieces,1):
                    name=f"Rocketbox_{label}_Originals_Remaining_Group{args.group:02d}_Part{i:02d}-of-{len(pieces):02d}.zip"
                    dest=source_packages/name
                    make_source_zip(dest,piece,source_id,COMMIT,license_data,i,len(pieces))
                    if dest.stat().st_size>SAFE_ARCHIVE:
                        raise RuntimeError("Part exceeds controlled archive size: "+name)
                    chunks.append((dest,piece))
            allchunks=[]
            for output,piece in chunks:
                check_zip(output,[x[0] for x in piece],license_sha)
                digest=sha256_file(output)
                info={"name":output.name,"bytes":output.stat().st_size,
                      "sha256":digest,"files":[x[0] for x in piece]}
                allchunks.append(info)
                inner_zips.append(info)
            completed.append({"asset_id":source_id,"directory":folder,"source_file_count":len(actual),
                              "original_bytes":sum(x["bytes"] for x in actual),
                              "source_files":actual,"source_zips":allchunks,
                              "status":"runner_source_verified_drive_pending"})
            print("ORIGINAL_VERIFIED",source_id,len(actual),len(allchunks),sum(x["bytes"] for x in actual),flush=True)
        except Exception as e:
            blocked.append({"asset_id":source_id,"reason":str(e),"partial_files_downloaded":len(actual),
                            "status":"runner_source_incomplete_not_archive_eligible"})
            print("BLOCKED_SOURCE",source_id,str(e),flush=True)
            # Fail safely and preserve any complete other models.
    # Greedy packing of immutable ZIPs under 87 MiB, with pack receipts.
    pack_groups=[]
    next_pack=[];next_size=0
    for rec in inner_zips:
        if rec["bytes"]>SAFE_PACK:
            blocked.append({"asset_id":"archive:"+rec["name"],"reason":"source part unexpectedly too large for transport pack"})
            continue
        if next_pack and next_size+rec["bytes"]>SAFE_PACK:
            pack_groups.append(next_pack);next_pack=[];next_size=0
        next_pack.append(rec);next_size+=rec["bytes"]
    if next_pack:
        pack_groups.append(next_pack)
    if len(pack_groups)>20:
        raise RuntimeError("Fixed workflow exposes maximum 20 transport-pack artifact slots")
    pack_info=[]
    for index,items in enumerate(pack_groups,1):
        filename=f"pack-{index:02d}.zip"
        target=packs/filename
        pack_receipt={"schema":"rocketbox_source_transport_pack_v1","group":args.group,
                      "source_commit":COMMIT,"archive_members":[
                          {"name":x["name"],"sha256":x["sha256"],"bytes":x["bytes"],
                           "source_files":x["files"]} for x in items]}
        with ZipFile(target,"x",ZIP_STORED) as archive:
            for item in items:
                archive.write(source_packages/item["name"],item["name"])
            archive.writestr("PACK_RECEIPT.json",json.dumps(pack_receipt,indent=2)+"\n")
        if target.stat().st_size > SAFE_PACK+1*MIB or target.stat().st_size>=DRIVE_LIMIT:
            raise RuntimeError("Transport package exceeded Drive upload safety budget")
        with ZipFile(target) as archive:
            if archive.testzip() is not None:
                raise RuntimeError("Transport pack failed CRC check")
            for item in items:
                if hashlib.sha256(archive.read(item["name"])).hexdigest()!=item["sha256"]:
                    raise RuntimeError("Inner original source archive lost bytes")
        pack_info.append({"name":filename,"sha256":sha256_file(target),
                          "bytes":target.stat().st_size,
                          "asset_ids":list(dict.fromkeys(x["asset_id"] for a in completed for x in [a] if any(z["name"] in [i["name"] for i in items] for z in a["source_zips"]))),
                          "inner_archives":[x["name"] for x in items],
                          "state":"runner_verified_drive_pending"})
    receipts={"schema":"rocketbox_remaining_group_receipt_v1",
              "source_repo":SOURCE_REPO,"source_commit":COMMIT,"group":args.group,
              "expected_source_ids":batch["models"],"successful_source_count":len(completed),
              "expected_source_count":len(batch["models"]),"blocked_count":len(blocked),
              "source_verified_bytes":sum(x["original_bytes"] for x in completed),
              "source_license":"MIT Copyright (c) 2020 Microsoft",
              "license_sha256":license_sha,"completed":completed,"blocked":blocked,
              "packs":pack_info,"github_run_id":os.environ.get("GITHUB_RUN_ID"),
              "transfer_status":"source_verified_on_runner_not_yet_archived_to_drive",
              "safety_notes":["No raw files modified","Cloud GitHub runner only","Drive transfer not performed inside runner",
                              "Outer GitHub Actions artifact ZIP wraps each pack-NN.zip",
                              "No GLB conversion or Three.js runtime smoke performed for these sources"]}
    (evidence/"GROUP_SOURCE_RECEIPT.json").write_text(json.dumps(receipts,indent=2)+"\n")
    (evidence/"PACK_SHA256SUMS.txt").write_text("".join(x["sha256"]+"  "+x["name"]+"\n" for x in pack_info))
    print(json.dumps({"group":args.group,"models":len(completed),
                      "packs":len(pack_info),"expected":len(batch["models"]),
                      "blocked":blocked,"runner_source_bytes":receipts["source_verified_bytes"],
                      "transport_packs":[{"name":p["name"],"bytes":p["bytes"]} for p in pack_info]}),flush=True)
    if blocked or len(completed)!=len(batch["models"]):
        return 2
    return 0

def make_source_zip(dest,contents,asset_id,source_sha,license_data,part,total_parts):
    entry={"schema":"rocketbox_original_source_archive_v1","asset_id":asset_id,
           "source_repository":SOURCE_REPO,"source_commit":source_sha,
           "part":part,"part_count":total_parts,
           "files":[x[0] for x in contents],
           "rights":"MIT; Microsoft 2020; original source bytes preserved"}
    with ZipFile(dest,"x",ZIP_DEFLATED,compresslevel=6) as z:
        for record,path in contents:
            z.write(path,"Rocketbox/"+record["path"].removeprefix("Assets/"))
        z.writestr("Rocketbox/LICENSE.md",license_data)
        z.writestr("Rocketbox/SOURCE_PROVENANCE.json",json.dumps(entry,indent=2)+"\n")
    return dest

if __name__=="__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print("FATAL_GROUP_ERROR",str(exc),file=sys.stderr,flush=True)
        sys.exit(3)
