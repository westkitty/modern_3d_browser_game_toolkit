#!/usr/bin/env python3
"""Complete ONE historical Rocketbox source set from exact pinned official Git blobs.

Runs only on a disposable GitHub Actions runner. It leaves the historical
Google Drive FBX-only archive unchanged. Public Git source is admitted only if
each byte count, source Git blob SHA1 and file signature match the frozen plan.
Existing historical FBXs are compared against the original GitHub artifact
(where present) to independently catch source identity drift.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import time
import urllib.error
import urllib.parse
import urllib.request
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path("/tmp/rocketbox-medical-female01")
PLAN=Path("catalog/humanoids/rocketbox-medical-female01-completion-plan.json")
COMMIT="0943055db6ec570bcef9f2c8b41c9e5467c808f9"
DEST=ROOT/"originals"/"Rocketbox"
EVID=ROOT/"evidence"
ORIG=ROOT/"cloud-artifact"
ARCH=ROOT/"source-archives"
MIB=1024*1024
NAME="Medical_Female_01"
EVID.mkdir(parents=True,exist_ok=True)
ARCH.mkdir(parents=True,exist_ok=True)
p=json.loads(PLAN.read_text())
assert p["asset_id"]=="rocketbox/professions/medical_female_01"
assert p["pinned_source_commit"]==COMMIT and len(p["original_files"])==10
assert len([x for x in p["original_files"] if x["path"].endswith(".tga")])==7
assert p["historical_archive_sha256"]=="10628087353b653c4c22ac9070dda31e3ba7e265ddc4956a6c0b9342e2330f20"
assert p["historical_archive_content_scope"]=="FBX_only; no textures"
def sha256_bytes(data):return hashlib.sha256(data).hexdigest()
def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode("ascii")+b"\0"+data).hexdigest()
def fetch(path,max_bytes=18*MIB):
    raw="https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/"+COMMIT+"/"+urllib.parse.quote(path,safe="/")
    error=None
    for attempt in range(4):
        try:
            req=urllib.request.Request(raw,headers={"User-Agent":"Rocketbox-Source-Completion/1.0"})
            with urllib.request.urlopen(req,timeout=75) as response:
                data=response.read(max_bytes+1)
            if len(data)>max_bytes:raise RuntimeError("Official file exceeds declared safe limit")
            return data
        except (OSError,TimeoutError,urllib.error.HTTPError) as exc:
            error=exc
            if isinstance(exc,urllib.error.HTTPError) and exc.code in (401,403,404,410,451):
                raise RuntimeError("Official source access blocked: "+path) from exc
            if attempt<3:time.sleep(2*(attempt+1))
    raise RuntimeError("Could not fetch official source "+path+": "+str(error))
license_=fetch("LICENSE.md",max_bytes=100_000)
assert license_.startswith(b"MIT License") and b"Copyright (c) 2020 Microsoft" in license_
lic_hash=sha256_bytes(license_)
processed=[];old_matched=[]
for item in p["original_files"]:
    source=item["path"];relative=PurePosixPath(source)
    assert not relative.is_absolute() and ".." not in relative.parts
    assert source.startswith("Assets/Avatars/Professions/"+NAME+"/")
    assert relative.suffix.lower() in (".fbx",".tga",".png")
    data=fetch(source)
    assert len(data)==item["bytes"],"Pinned original size mismatch: "+source
    assert git_blob(data)==item["git_blob_sha"],"Pinned Git blob mismatch: "+source
    if relative.suffix.lower()==".fbx":
        assert data.startswith(b"Kaydara FBX Binary"),"FBX file signature mismatch"
    if relative.suffix.lower()==".png":
        assert data.startswith(b"\x89PNG\r\n\x1a\n"),"Source preview PNG signature mismatch"
    if relative.suffix.lower()==".tga":
        assert len(data)>=18 and int.from_bytes(data[12:14],"little")>0 and int.from_bytes(data[14:16],"little")>0,"Source TGA dimension invalid"
    dest=DEST/source.removeprefix("Assets/")
    dest.parent.mkdir(parents=True,exist_ok=True)
    if dest.exists():raise RuntimeError("Would overwrite source file "+str(dest))
    dest.write_bytes(data)
    historic=ORIG/"originals"/"rocketbox"/source.removeprefix("Assets/")
    if historic.is_file():
        past=historic.read_bytes()
        assert past==data,"Historical original differed from pinned official Git blob: "+source
        old_matched.append(source)
    processed.append({**item,"sha256":sha256_bytes(data),
                      "historical_cloud_artifact_byte_match":historic.is_file()})
    print("OFFICIAL_SOURCE_GITBLOB_SHA256_PASS",relative.name,len(data),flush=True)
assert len(processed)==10 and sum(x["path"].endswith(".tga") for x in processed)==7
assert len([x for x in old_matched if x.endswith(".fbx")])>=1,"No old FBX source equivalence evidence"
filename=f"Rocketbox_{NAME}_Complete_Source_2026-11-14.zip"
zipfile=ARCH/filename
if zipfile.exists():raise RuntimeError("Refusing source archive overwrite")
with ZipFile(zipfile,"x",ZIP_DEFLATED,compresslevel=6) as archive:
    for item in processed:
        archive.write(DEST/item["path"].removeprefix("Assets/"),"Rocketbox/"+item["path"].removeprefix("Assets/"))
    archive.writestr("Rocketbox/LICENSE.md",license_)
    archive.writestr("Rocketbox/SOURCE_COMPLETION_PROVENANCE.json",json.dumps({
       "asset_id":p["asset_id"],"pinned_commit":COMMIT,
       "historic_fbx_only_archive_name":p["historical_archive_name"],
       "historic_fbx_only_archive_preupload_sha256":p["historical_archive_sha256"],
       "original_files":processed,"license_sha256":lic_hash,
       "original_archive_preserved":True,"new_source_archive_additive":True},indent=2)+"\n")
assert zipfile.stat().st_size<100*MIB,"Archive exceeds Google Drive file limit"
with ZipFile(zipfile) as archive:
    assert archive.testzip() is None,"ZIP CRC failure"
    for item in processed:
        value=archive.read("Rocketbox/"+item["path"].removeprefix("Assets/"))
        assert sha256_bytes(value)==item["sha256"],"Archived original differs"
    assert sha256_bytes(archive.read("Rocketbox/LICENSE.md"))==lic_hash
archive_sha=sha256_bytes(zipfile.read_bytes())
report={"schema":"rocketbox_medical_female01_source_completion_v1",
        "source_commit":COMMIT,"asset_id":p["asset_id"],"original_source_files":processed,
        "source_file_count":len(processed),"fbx_files":2,"textures_tga":7,"source_preview_pngs":1,
        "historical_archive_source_completeness":"FBX_ONLY_NOT_MODIFIED",
        "old_archive_original_fbx_comparison":old_matched,
        "original_file_bytes":sum(x["bytes"] for x in processed),
        "license":"MIT Copyright (c) 2020 Microsoft","license_sha256":lic_hash,
        "new_archive_filename":filename,"new_archive_bytes":zipfile.stat().st_size,
        "new_archive_sha256":archive_sha,
        "new_archive_unzipped_member_SHA256_verified":True,
        "github_actions_run_id":os.environ.get("GITHUB_RUN_ID"),
        "Google_Drive_new_archive_uploaded":"NOT_PERFORMED_YET",
        "Google_Drive_historical_archive_preserved":True,
        "postupload_drive_sha256_roundtrip":"NOT_PERFORMED"}
(EVID/"MEDICAL_FEMALE01_SOURCE_COMPLETION_REPORT.json").write_text(json.dumps(report,indent=2)+"\n")
(EVID/"MEDICAL_FEMALE01_SOURCE_SHA256SUMS.txt").write_text("\n".join(f"{x['sha256']}  {x['path']}" for x in processed)+"\n")
print("TEN_OFFICIAL_SOURCE_FILES_COMPLETE",filename,report["new_archive_bytes"],archive_sha,flush=True)
