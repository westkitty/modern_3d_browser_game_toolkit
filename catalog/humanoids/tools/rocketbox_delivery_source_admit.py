#!/usr/bin/env python3
"""Cloud-only historical Delivery_Male_01 source admission (no Drive credentials).

Checks individually SHA256 and GitBlob SHA1 against source-preservation receipt.
Does not claim that Drive-hosted source ZIP has been re-downloaded for SHA256.
"""
import hashlib
import json
from pathlib import Path
ROOT=Path("/tmp/rocketbox-delivery")
PLAN=json.loads(Path("catalog/humanoids/rocketbox-delivery-male01-plan.json").read_text())
assert PLAN["source_commit"]=="0943055db6ec570bcef9f2c8b41c9e5467c808f9"
assert PLAN["asset_id"]=="rocketbox/professions/delivery_male_01"
assert PLAN["source_private_archive_preupload_sha256"]=="454cbf72c52bd3a076d4f7650f66b364ed5ca5bf2eb319979d4c4f7e80bad924"
records=[]
for source in PLAN["source_files"]+[{"path":PLAN["license_path"],"bytes":1066,"sha256":PLAN["license_sha256"]}]:
    original=ROOT/"cloud-artifact"/source["path"]
    assert original.is_file(),f"Missing exact cloud artifact file {source['path']}"
    content=original.read_bytes()
    assert len(content)==source["bytes"] and hashlib.sha256(content).hexdigest()==source["sha256"],f"Original SHA mismatch: {original}"
    if "git_blob_sha" in source:
        blob=hashlib.sha1(b"blob "+str(len(content)).encode()+b"\0"+content).hexdigest()
        assert blob==source["git_blob_sha"],f"Git blob mismatch {original}"
    elif source["path"]==PLAN["license_path"]:
        assert b"Copyright (c) 2020 Microsoft" in content and b"MIT License" in content
    suffix=source["path"].removeprefix("originals/rocketbox/")
    dest=ROOT/"originals"/"Rocketbox"/suffix
    assert not dest.exists(),f"Would overwrite staged source: {dest}"
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(content)
    records.append({"source_path":source["path"],"bytes":len(content),"sha256":source["sha256"],
                    "git_blob_sha":source.get("git_blob_sha"),"cloud_artifact_byte_identical_to_archived_source_manifest":True})
assert len(records)==10
evid=ROOT/"evidence";evid.mkdir(parents=True,exist_ok=True)
(evid/"SOURCE_EQUIVALENCE_REPORT.json").write_text(json.dumps({
    "schema":"delivery_male_01_source_sha256_equivalence_v1",
    "source_commit":PLAN["source_commit"],
    "source_sha256_receipt":"historical private Drive archive pre-upload manifest",
    "private_Drive_original_zip_preupload_sha256":PLAN["source_private_archive_preupload_sha256"],
    "cloud_artifact_from_GitHub_Actions_run":PLAN["github_actions_originals_run"],
    "originals_modified":False,"all_source_files_exact_sha256_and_gitblob":True,
    "Google_Drive_credentials_sent_to_runner":False,
    "postupload_Drive_original_zip_SHA_roundtrip":"NOT_PERFORMED",
    "files":records},indent=2)+"\n")
print("DELIVERY_ORIGINALS_EQUIVALENT_WITH_MIT",len(records),flush=True)
