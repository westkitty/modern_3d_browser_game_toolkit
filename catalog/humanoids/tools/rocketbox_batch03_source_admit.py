#!/usr/bin/env python3
"""Admit exact SHA-pinned Rocketbox source ZIPs from earlier cloud artifacts.

GitHub Actions input artifact bytes are compared to original ZIP SHA-256 values
stored in the pre-upload private Drive source receipts. Private identifiers and
credential material are not needed in the cloud job. Source originals remain
untouched; only verified temporary working copies are extracted.
"""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile

ROOT=Path("/tmp/rocketbox-b03")
PLAN=Path("catalog/humanoids/rocketbox-conversion-batch03.json")
SHA=lambda b:hashlib.sha256(b).hexdigest()
def verify():
    p=json.loads(PLAN.read_text())
    assert p["source_commit"]=="0943055db6ec570bcef9f2c8b41c9e5467c808f9"
    assert p["catalog_base_browser_tested"]==10 and len(p["models"])==10
    results=[]
    for m in p["models"]:
        result={"name":m["name"],"asset_id":m["asset_id"],"status":"SOURCE_UNVERIFIED"}
        pack_name=m["actions_artifact_name"]
        artifact=ROOT/"artifact-input"/pack_name/("pack-%02d.zip" % m["pack"])
        if not artifact.is_file():
            raise RuntimeError("Missing exact authorized cloud source artifact "+str(artifact))
        with zipfile.ZipFile(artifact) as envelope:
            if envelope.testzip() is not None:raise RuntimeError("Corrupt source pack "+pack_name)
            members=envelope.namelist()
            if m["source_zip_name"] not in members:raise RuntimeError("Source archive absent from pack "+m["source_zip_name"])
            packed=envelope.read(m["source_zip_name"])
        if SHA(packed)!=m["source_zip_sha256"]:
            raise RuntimeError("Original archived source ZIP SHA mismatch "+m["name"])
        with zipfile.ZipFile(io.BytesIO(packed)) as z:
            if z.testzip() is not None:raise RuntimeError("Invalid source archive "+m["name"])
            names=z.namelist()
            if len(names)!=len(set(names)):raise RuntimeError("Duplicate member names "+m["name"])
            if SHA(z.read("Rocketbox/LICENSE.md"))!=SHA(z.read("Rocketbox/LICENSE.md")):
                raise RuntimeError("License content mismatch")
            license_bytes=z.read("Rocketbox/LICENSE.md")
            if not license_bytes.startswith(b"MIT License") or b"Copyright (c) 2020 Microsoft" not in license_bytes:
                raise RuntimeError("Invalid or missing Microsoft source MIT notice")
            provenance=json.loads(z.read("Rocketbox/SOURCE_PROVENANCE.json"))
            if provenance["asset_id"]!=m["asset_id"] or provenance["source_commit"]!=p["source_commit"]:
                raise RuntimeError("Original asset identity or source commit mismatch")
            expected={x["path"]:x for x in m["expected_files"]}
            witnessed={x["path"]:x for x in provenance["files"]}
            if set(witnessed)!=set(expected):raise RuntimeError("Unexpected original file set "+m["name"])
            if len(expected)!=m["source_file_count"]:raise RuntimeError("Source file count drift")
            for path,entry in expected.items():
                if witnessed[path]["git_blob_sha"]!=entry["git_blob_sha"] or witnessed[path]["bytes"]!=entry["bytes"]:
                    raise RuntimeError("Git blob identity mismatch "+path)
                member="Rocketbox/"+path.removeprefix("Assets/")
                pp=PurePosixPath(member)
                if pp.is_absolute() or ".." in pp.parts or pp.parts[0]!="Rocketbox" or pp.suffix.lower() not in [".fbx",".png",".tga"]:
                    raise RuntimeError("Unsafe source member "+member)
                b=z.read(member)
                digest=SHA(b)
                if len(b)!=entry["bytes"] or digest!=witnessed[path]["sha256"]:
                    raise RuntimeError("Original source SHA-256 mismatch "+path)
                actual_blob=hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
                if actual_blob!=entry["git_blob_sha"]:
                    raise RuntimeError("Actual original file differs from authoritative pinned Git blob "+path)
                out=ROOT/"originals"/member
                out.parent.mkdir(parents=True,exist_ok=True)
                if out.exists():
                    raise RuntimeError("Duplicate extraction destination")
                out.write_bytes(b)
            # exact archived license is retained separately, never repackaged as public raw asset
            l=ROOT/"originals"/"Rocketbox"/"LICENSE.md"
            if l.exists() and l.read_bytes()!=license_bytes:
                raise RuntimeError("Inconsistent MIT source notice between source archives")
            l.parent.mkdir(parents=True,exist_ok=True)
            if not l.exists():l.write_bytes(license_bytes)
            result.update({"status":"SOURCE_PROVED_HASH_EQUAL_TO_ARCHIVED_PREUPLOAD_ZIP",
                           "archive_name":m["source_zip_name"],"archive_sha256":SHA(packed),
                           "original_file_count":len(expected),
                           "raw_bytes":sum(x["bytes"] for x in expected.values()),
                           "upstream_Git_blobs_verified":True,"original_SHA256_per_file_verified":True,
                           "license_sha256":SHA(license_bytes)})
        results.append(result)
        print("SOURCE_HASH_EQUIVALENCE_PASS",m["name"],result["raw_bytes"],flush=True)
    assert len(results)==10
    e=ROOT/"evidence";e.mkdir(parents=True,exist_ok=True)
    (e/"SOURCE_EQUIVALENCE_REPORT.json").write_text(json.dumps({
        "schema":"rocketbox_batch03_source_equality_v1","source_commit":p["source_commit"],
        "originals_modified":False,
        "input":"earlier GitHub Actions artifact pack, identical per-avatar source ZIP SHA256 as Drive pre-upload original archive receipts",
        "drive_postupload_full_sha256":"NOT_PERFORMED",
        "license":"MIT Copyright (c) 2020 Microsoft",
        "files":results},indent=2)+"\n")
    print("ALL_TEN_SOURCES_HASH_VERIFIED")
if __name__=="__main__":
    try:verify()
    except Exception as exc:
        print("SOURCE_ADMISSION_FAILED",repr(exc),file=sys.stderr)
        sys.exit(2)
