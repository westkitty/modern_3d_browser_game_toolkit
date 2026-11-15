#!/usr/bin/env python3
"""Blender 4.x cloud-only conversion of ten SHA-verified original Rocketbox FBXs.

All FBX and textures are copied to isolated workdirs. Archive source bytes are
never modified. Converts candidates only; static, browser and visual gates are
separate and do not imply production release.
"""
import bpy
import hashlib
import json
from pathlib import Path
import shutil
import sys
import traceback

ROOT=Path("/tmp/rocketbox-medical-female01")
PLAN=Path("catalog/humanoids/rocketbox-medical-female01-completion-plan.json")
SOURCE=ROOT/"originals"/"Rocketbox"/"Avatars"
WORK=ROOT/"working"
OUTPUT=ROOT/"processed-glb"
EVID=ROOT/"evidence"
for p in (WORK,OUTPUT,EVID):p.mkdir(parents=True,exist_ok=True)
plan=json.loads(PLAN.read_text())
results=[]
assert plan["asset_id"]=="rocketbox/professions/medical_female_01"
for item in [{"name":"Medical_Female_01","asset_id":plan["asset_id"],"category":"Professions"}]:
    name=item["name"]
    result={"name":name,"asset_id":item["asset_id"],"state":"CONVERSION_PENDING"}
    try:
        src=SOURCE/item["category"]/name
        main=src/"Export"/(name+".fbx")
        tex=src/"Textures"
        if not main.is_file() or not tex.is_dir() or not any(tex.glob("*.tga")):
            raise RuntimeError("Missing original FBX or textures")
        w=WORK/name
        w.mkdir(parents=True,exist_ok=False)
        copied=w/main.name
        shutil.copy2(main,copied)
        for f in tex.iterdir():
            if f.is_file() and f.suffix.lower() in (".tga",".png"):
                shutil.copy2(f,w/f.name)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(copied),use_image_search=True)
        meshes=[o for o in bpy.data.objects if o.type=="MESH"]
        armatures=[o for o in bpy.data.objects if o.type=="ARMATURE"]
        if not meshes or not armatures or max(len(a.data.bones) for a in armatures)<40:
            raise RuntimeError("No usable skinned human FBX rig after Blender import")
        for image in bpy.data.images:
            if image.source=="FILE":
                p=w/Path(bpy.path.abspath(image.filepath)).name
                if p.exists():
                    image.filepath=str(p)
                    try:image.reload()
                    except Exception:pass
        dest=OUTPUT/(name+".glb")
        if dest.exists():raise RuntimeError("Would overwrite a preexisting converted model")
        bpy.ops.export_scene.gltf(filepath=str(dest),export_format="GLB",
                                  export_skins=True,export_animations=True)
        if not dest.is_file() or dest.stat().st_size<1024:
            raise RuntimeError("GLB not exported")
        sha=hashlib.sha256()
        with dest.open("rb") as f:
            for b in iter(lambda:f.read(1048576),b""):sha.update(b)
        result.update({"state":"EXPORTED_NOT_YET_VALIDATED","glb_name":dest.name,
                       "glb_bytes":dest.stat().st_size,"glb_sha256":sha.hexdigest(),
                       "imported_meshes":len(meshes),"imported_armatures":len(armatures),
                       "max_imported_armature_bones":max(len(a.data.bones) for a in armatures),
                       "imported_materials":len(bpy.data.materials),
                       "original_FBX_copied":True,"source_files_unchanged":True})
    except Exception as e:
        result.update({"state":"CONVERSION_FAILED","error":str(e)})
        traceback.print_exc()
    results.append(result)
    print("MODEL_CONVERSION",name,result["state"],flush=True)
report={"schema":"rocketbox_medical_female01_conversion_v1","Blender_version":bpy.app.version_string,
        "pinned_source_commit":plan["pinned_source_commit"],"source_master_bytes_modified":False,
        "models":results,"visual_approval":"NOT_PERFORMED",
        "browser_validation":"SEPARATE_WORKFLOW_STEP"}
(EVID/"MEDICAL_FEMALE01_CONVERSION_REPORT.json").write_text(json.dumps(report,indent=2)+"\n")
assert len(results)==1 and results[0]["state"]=="EXPORTED_NOT_YET_VALIDATED",results
print("MEDICAL_FEMALE01_CONVERSION_EXPORTED_UNVALIDATED",results[0]["glb_bytes"])
