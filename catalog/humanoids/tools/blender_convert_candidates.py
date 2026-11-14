#!/usr/bin/env python3
"""Blender runner-only candidate conversion. Never modifies original Rocketbox files."""
import argparse
import json
from pathlib import Path
import shutil
import sys
import traceback

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("--root", required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
root = Path(args.root).resolve()
originals = root / "originals" / "rocketbox" / "Avatars"
working = root / "working"
processed = root / "processed-glb"
processed.mkdir(parents=True, exist_ok=True)
result = {"tool": "Blender", "version": bpy.app.version_string,
          "status": "candidate_only", "browser_loader_proof": "not_performed",
          "visual_review": "not_performed", "records": []}
for category, name in [("Adults", "Male_Adult_01"), ("Adults", "Female_Adult_01")]:
    record = {"name": name, "state": "pending"}
    try:
        source = originals / category / name
        fbx = source / "Export" / (name + ".fbx")
        if not fbx.is_file():
            raise RuntimeError("Missing source FBX")
        wdir = working / name
        wdir.mkdir(parents=True, exist_ok=True)
        work_fbx = wdir / fbx.name
        shutil.copy2(fbx, work_fbx)
        for image in (source / "Textures").glob("*"):
            if image.suffix.lower() in (".tga", ".png"):
                shutil.copy2(image, wdir / image.name)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(work_fbx), use_image_search=True)
        before = {"mesh_objects": 0, "armatures": 0, "armature_bones": 0, "materials": 0}
        for obj in bpy.data.objects:
            if obj.type == "MESH":
                before["mesh_objects"] += 1
            if obj.type == "ARMATURE":
                before["armatures"] += 1
                before["armature_bones"] += len(obj.data.bones)
        before["materials"] = len(bpy.data.materials)
        if before["mesh_objects"] == 0:
            raise RuntimeError("No mesh after FBX import")
        for img in bpy.data.images:
            if img.source == "FILE":
                candidate = wdir / Path(bpy.path.abspath(img.filepath)).name
                if candidate.exists():
                    img.filepath = str(candidate)
                    try:
                        img.reload()
                    except Exception:
                        pass
        out = processed / (name + ".glb")
        if out.exists():
            raise RuntimeError("Refusing to overwrite existing GLB")
        bpy.ops.export_scene.gltf(filepath=str(out), export_format="GLB",
                                  export_skins=True, export_animations=True)
        if not out.exists() or out.stat().st_size <= 1024:
            raise RuntimeError("Missing or empty GLB export")
        record.update({"state": "exported_unvalidated", "output": str(out.relative_to(root)),
                       "bytes": out.stat().st_size, "fbx_import": before})
    except Exception as exc:
        record.update({"state": "conversion_failed", "error": str(exc)})
        traceback.print_exc()
    result["records"].append(record)
(root / "evidence" / "conversion_report.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
