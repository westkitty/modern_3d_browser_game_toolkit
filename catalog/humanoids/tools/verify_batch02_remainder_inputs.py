#!/usr/bin/env python3
"""Admit four cloud-artifact copies only if hashes match independently read private Drive originals."""
import hashlib,json,os,pathlib,zipfile
ROOT=pathlib.Path("/tmp/rocketbox-b02-completion")
DEST=ROOT/"originals"
EVID=ROOT/"evidence"
EVID.mkdir(parents=True,exist_ok=True)
DRIVE_VERIFIED_SHA={
 "Female_Adult_11":"6d019ca6bd0172e2e7fd61745bd3fa5492b4d3e5550740b3ca13ad2a9baea681",
 "Business_Male_04":"b6e3c3b44aa5099af978b53c00a55deac08c846f41a7091e541b6751fd849742",
 "Medical_Male_02":"7ddcda30800cde8a451faaa49e716baecda49e07a735b7a4002c2973964a2267",
 "Security_Male_01":"ce6fc21bfad6f2500af7baa9146431a7f0a19602a41987e89e76027e8d4a7a12"}
names=list(DRIVE_VERIFIED_SHA)
report={"input_identity":"earlier GitHub Actions source artifact ZIPs; SHA256 identical to private Google Drive ZIPs independently retrieved and rehashed in initiating ChatGPT session",
        "source_commit":"0943055db6ec570bcef9f2c8b41c9e5467c808f9",
        "source_archives":[],"original_files_intact":True,
        "google_drive_raw_transfer_into_ci":False}
sha=lambda data:hashlib.sha256(data).hexdigest()
for name in names:
    archive=ROOT/"runner-input"/"source"/name/f"Rocketbox_{name}_Originals_Batch02_2026-11-13.zip"
    if not archive.is_file():raise RuntimeError(f"Source GitHub artifact missing: {name}")
    with archive.open("rb") as f:
        h=hashlib.file_digest(f,"sha256").hexdigest()
    if h!=DRIVE_VERIFIED_SHA[name]:raise RuntimeError("CI input hash differs from actual retrieved Drive archive "+name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        members=z.namelist()
        if len(members)!=len(set(members)):raise RuntimeError("duplicate ZIP paths")
        for p in members:
            part=pathlib.PurePosixPath(p)
            if part.is_absolute() or ".." in part.parts or part.parts[0]!="Rocketbox":
                raise RuntimeError("unsafe archive member")
            if part.suffix.lower() not in (".fbx",".png",".tga",".md",".json"):
                raise RuntimeError("unexpected source file type "+p)
        p=json.loads(z.read("Rocketbox/PROVENANCE_Batch02.json"))
        if p["avatar"]!=name or p["source_commit"]!=report["source_commit"]:
            raise RuntimeError("source identity mismatch")
        if b"Copyright (c) 2020 Microsoft" not in z.read("Rocketbox/LICENSE.md"):
            raise RuntimeError("MIT copyright notice absent")
        for item in p["files"]:
            payload=z.read(item["archive_path"])
            if len(payload)!=item["bytes"] or sha(payload)!=item["sha256"]:
                raise RuntimeError("source file hash failure: "+item["archive_path"])
        # Extractions happen only into disposable runner staging, originals in Drive remain untouched.
        for item in p["files"]:
            local=DEST/item["archive_path"]
            local.parent.mkdir(parents=True,exist_ok=True)
            bytes_=z.read(item["archive_path"])
            if local.exists() and sha(local.read_bytes())!=sha(bytes_):
                raise RuntimeError("source identity collision during extraction")
            if not local.exists():local.write_bytes(bytes_)
    report["source_archives"].append({"name":name,"sha256":h,"source_filename":archive.name,"bytes":archive.stat().st_size,
                                     "original_file_count":len(p["files"]),"sha256_all_members_verified":True})
    print("ADMITTED_CLOUD_SOURCE_MATCHING_DRIVE_SHA256",name,archive.stat().st_size,flush=True)
assert len(report["source_archives"])==4
(EVID/"DRIVE_SOURCE_EQUALITY_PROOF.json").write_text(json.dumps(report,indent=2)+"\n")
