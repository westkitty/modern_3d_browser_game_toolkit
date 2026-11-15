#!/usr/bin/env python3
"""Blender batch conversion & triage for expansion sources.

Run via:
  blender -b --factory-startup --python catalog/humanoids/tools/expansion_blender_jobs.py -- --mode direct_blender --work-dir ... --out-dir ...
  blender -b --factory-startup --python catalog/humanoids/tools/expansion_blender_jobs.py -- --mode barnabe --src-dir ... --out-dir ...
  blender -b --factory-startup --python catalog/humanoids/tools/expansion_blender_jobs.py -- --mode quaternius_fbx --src-dir ... --out-dir ...
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import shutil
import struct
import sys
from pathlib import Path

import bpy


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip()).strip("_").lower()
    return re.sub(r"_+", "_", s) or "asset"


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def normalize_materials(texture_path: Path | None = None, pack_images: bool = True) -> None:
    img_obj = None
    if texture_path and texture_path.exists():
        img_obj = bpy.data.images.load(str(texture_path), check_existing=True)
        try:
            img_obj.pack()
        except Exception:
            pass

    for mat in bpy.data.materials:
        if hasattr(mat, "blend_method"):
            mat.blend_method = "OPAQUE"
        if not mat.use_nodes:
            mat.use_nodes = True
        nt = mat.node_tree
        if not nt:
            continue
        bsdf = None
        for node in nt.nodes:
            if node.type == "BSDF_PRINCIPLED":
                bsdf = node
                if "Alpha" in node.inputs:
                    for link in list(node.inputs["Alpha"].links):
                        nt.links.remove(link)
                    node.inputs["Alpha"].default_value = 1.0
        if img_obj and bsdf:
            tex_nodes = [n for n in nt.nodes if n.type == "TEX_IMAGE"]
            if tex_nodes:
                tex_node = tex_nodes[0]
            else:
                tex_node = nt.nodes.new("ShaderNodeTexImage")
            tex_node.image = img_obj
            for link in list(bsdf.inputs["Base Color"].links):
                nt.links.remove(link)
            nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])

    if pack_images:
        for img in bpy.data.images:
            if img.source == "FILE" and not img.packed_file:
                try:
                    img.pack()
                except Exception:
                    pass


def export_glb(out_path: Path, export_animations: bool = True) -> dict:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    kwargs = dict(
        filepath=str(out_path),
        export_format="GLB",
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=export_animations,
        export_skins=True,
        export_apply=False,
    )
    try:
        bpy.ops.export_scene.gltf(**kwargs, export_image_format="AUTO")
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)
    return parse_glb_summary(out_path)


def parse_glb_summary(glb_path: Path) -> dict:
    data = glb_path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError(f"Invalid GLB: {glb_path}")
    size, _ = struct.unpack_from("<I4s", data, 12)
    gltf = json.loads(data[20 : 20 + size].decode("utf-8"))
    accessors = gltf.get("accessors", [])
    meshes = gltf.get("meshes", [])
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
    for m in meshes:
        for p in m.get("primitives", []):
            if "indices" in p:
                tris += accessors[p["indices"]].get("count", 0) // 3
            pos_i = p.get("attributes", {}).get("POSITION")
            if pos_i is not None:
                acc = accessors[pos_i]
                if "indices" not in p:
                    tris += acc.get("count", 0) // 3
                if "min" in acc and "max" in acc:
                    for i in range(3):
                        mins[i] = min(mins[i], float(acc["min"][i]))
                        maxs[i] = max(maxs[i], float(acc["max"][i]))
    dims = [round(max(0.0, maxs[i] - mins[i]), 4) if math.isfinite(mins[i]) else 0.0 for i in range(3)]
    j_indices = skins[0].get("joints", []) if skins else []
    return {
        "bytes": glb_path.stat().st_size,
        "sha256": hashlib.sha256(data).hexdigest(),
        "mesh_count": len(meshes),
        "primitive_count": sum(len(m.get("primitives", [])) for m in meshes),
        "triangle_count": tris,
        "skin_count": len(skins),
        "joint_count": len(j_indices),
        "joint_names": [nodes[idx].get("name", "") for idx in j_indices if idx < len(nodes)],
        "image_count": len(images),
        "texture_count": len(gltf.get("textures", [])),
        "material_count": len(gltf.get("materials", [])),
        "animation_count": len(anims),
        "animation_names": [a.get("name", f"anim_{i}") for i, a in enumerate(anims)],
        "dimensions_m": dims,
        "external_uris": external,
    }


def is_xyz_bipedal_humanoid(bones: list[str]) -> tuple[bool, str]:
    lower = [b.lower() for b in bones]
    has_left_arm = any("arm.l" in b or "upperarm.l" in b for b in lower) and any("hand.l" in b for b in lower)
    has_right_arm = any("arm.r" in b or "upperarm.r" in b for b in lower) and any("hand.r" in b for b in lower)
    has_legs = any("upleg.l" in b for b in lower) and any("upleg.r" in b for b in lower) and any("foot.l" in b for b in lower) and any("foot.r" in b for b in lower)
    bad_tokens = (
        "tail", "wing", "tentacle", "frontleg", "backleg", "middleleg",
        "front_thigh", "claw", "fin", "trunk", "shell", "stem", "leaf", "flowerpot",
    )
    found_bad = sorted({tok for b in lower for tok in bad_tokens if tok in b})
    if found_bad:
        return False, f"non_humanoid_bones:{','.join(found_bad)}"
    if not (has_left_arm and has_right_arm and has_legs):
        return False, "missing_biped_arm_or_leg_hierarchy"
    return True, "biped_arm_hand_upleg_foot_verified"


def process_xyz(work_dir: Path, out_dir: Path) -> dict:
    src_root = work_dir / "extracted" / "polygonalmind-xyz-creatures" / "2006_XYZAssetPack"
    models_dir = src_root / "Models"
    tex_dir = src_root / "Textures"
    glb_dir = out_dir / "processed-glb" / "polygonalmind-xyz-creatures"
    glb_dir.mkdir(parents=True, exist_ok=True)

    admitted = []
    rejected = []
    for fbx_path in sorted(models_dir.glob("*.fbx")):
        clear_scene()
        bpy.ops.import_scene.fbx(filepath=str(fbx_path))
        arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
        bones = [b.name for b in arms[0].data.bones] if arms else []
        ok, reason = is_xyz_bipedal_humanoid(bones)
        prefix = fbx_path.stem.split("_")[0]
        tex_matches = sorted(tex_dir.glob(f"{prefix}_*"))
        tex_path = tex_matches[0] if tex_matches else None
        if not ok:
            rejected.append({
                "source_rel_path": str(fbx_path.relative_to(src_root.parent)),
                "name": fbx_path.stem,
                "bone_count": len(bones),
                "bones_sample": bones[:16],
                "reason": reason,
            })
            continue
        normalize_materials(texture_path=tex_path)
        slug = slugify(fbx_path.stem.removesuffix("_Art"))
        glb_path = glb_dir / f"{slug}.glb"
        stats = export_glb(glb_path, export_animations=True)
        assert not stats["external_uris"]
        assert stats["primitive_count"] > 0 and stats["skin_count"] > 0
        admitted.append({
            "asset_id": f"polygonalmind-xyz-creatures/character/{slug}",
            "display_name": fbx_path.stem.removesuffix("_Art"),
            "source_id": "polygonalmind-xyz-creatures",
            "asset_type": "character",
            "category": "stylized_bipedal_creature_humanoid",
            "skeleton_family": "polygonalmind-xyz-biped",
            "triage_reason": reason,
            "source_rel_path": str(fbx_path.relative_to(src_root.parent)),
            "processed_glb_rel": f"polygonalmind-xyz-creatures/{slug}.glb",
            **stats,
        })
    return {
        "source_id": "polygonalmind-xyz-creatures",
        "inspected_fbx_count": len(admitted) + len(rejected),
        "admitted_count": len(admitted),
        "rejected_count": len(rejected),
        "rejected": rejected,
        "records": admitted,
    }


def process_gdquest(work_dir: Path, out_dir: Path) -> dict:
    orig_dir = work_dir / "originals" / "gdquest-open-3d-mannequin"
    glb_dir = out_dir / "processed-glb" / "gdquest-open-3d-mannequin"
    glb_dir.mkdir(parents=True, exist_ok=True)
    records = []

    # 1. Existing v0.3.0 animated GLB from repo
    g03 = glb_dir / "mannequiny_v0_3_0_rigged.glb"
    shutil.copy2(orig_dir / "mannequiny-0.3.0.glb", g03)
    s03 = parse_glb_summary(g03)
    records.append({
        "asset_id": "gdquest-open-3d-mannequin/character/mannequiny_v0_3_0_rigged",
        "display_name": "Mannequiny v0.3.0 (Rigged + 10 Animations)",
        "source_id": "gdquest-open-3d-mannequin",
        "asset_type": "character",
        "category": "mannequin_reference_humanoid",
        "skeleton_family": "gdquest-mannequiny-45",
        "source_rel_path": "godot/assets/3d/mannequiny/mannequiny-0.3.0.glb",
        "processed_glb_rel": "gdquest-open-3d-mannequin/mannequiny_v0_3_0_rigged.glb",
        **s03,
    })

    # 2. v0.4.0 .blend -> rigged GLB + rig-free mesh-only GLB
    blend_v04 = orig_dir / "mannequiny-0.4.0.blend"
    clear_scene()
    bpy.ops.wm.open_mainfile(filepath=str(blend_v04))
    normalize_materials()
    # Delete non-mesh/armature helper cameras/lights/widgets before GLB export
    for obj in list(bpy.data.objects):
        if obj.type not in ("MESH", "ARMATURE", "EMPTY"):
            bpy.data.objects.remove(obj, do_unlink=True)
        elif obj.type == "MESH" and obj.name.startswith(("WGT-", "CS_")):
            bpy.data.objects.remove(obj, do_unlink=True)
    # Unhide any hidden deform meshes/armatures
    for obj in bpy.data.objects:
        obj.hide_set(False)
        obj.hide_viewport = False
    g04_rig = glb_dir / "mannequiny_v0_4_0_rigged.glb"
    s04_rig = export_glb(g04_rig, export_animations=True)
    records.append({
        "asset_id": "gdquest-open-3d-mannequin/character/mannequiny_v0_4_0_rigged",
        "display_name": "Mannequiny v0.4.0 (Rigged Blender Release)",
        "source_id": "gdquest-open-3d-mannequin",
        "asset_type": "character",
        "category": "mannequin_reference_humanoid",
        "skeleton_family": "gdquest-mannequiny-v04-rig",
        "source_rel_path": "mannequiny-0.4.0.blend",
        "processed_glb_rel": "gdquest-open-3d-mannequin/mannequiny_v0_4_0_rigged.glb",
        **s04_rig,
    })

    # Export rig-free mesh variant cleanly by baking current pose & stripping armature
    clear_scene()
    bpy.ops.wm.open_mainfile(filepath=str(blend_v04))
    normalize_materials()
    for obj in list(bpy.data.objects):
        if obj.type != "MESH" or obj.name.startswith(("WGT-", "CS_")):
            if obj.type != "ARMATURE":
                bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in list(bpy.data.objects):
        if obj.type == "MESH":
            obj.hide_set(False)
            obj.hide_viewport = False
            for mod in list(obj.modifiers):
                if mod.type == "ARMATURE":
                    obj.modifiers.remove(mod)
            if obj.parent and obj.parent.type == "ARMATURE":
                mw = obj.matrix_world.copy()
                obj.parent = None
                obj.matrix_world = mw
    for obj in list(bpy.data.objects):
        if obj.type == "ARMATURE":
            bpy.data.objects.remove(obj, do_unlink=True)
    g04_mesh = glb_dir / "mannequiny_v0_4_0_mesh_only.glb"
    s04_mesh = export_glb(g04_mesh, export_animations=False)
    records.append({
        "asset_id": "gdquest-open-3d-mannequin/base_mesh/mannequiny_v0_4_0_mesh_only",
        "display_name": "Mannequiny v0.4.0 (Rig-Free Reference Mesh)",
        "source_id": "gdquest-open-3d-mannequin",
        "asset_type": "base_mesh",
        "category": "rig_free_humanoid_base_mesh",
        "skeleton_family": "none-rig-free",
        "source_rel_path": "mannequiny-0.4.0.blend",
        "processed_glb_rel": "gdquest-open-3d-mannequin/mannequiny_v0_4_0_mesh_only.glb",
        **s04_mesh,
    })
    return {"source_id": "gdquest-open-3d-mannequin", "admitted_count": len(records), "records": records}


def process_oga_fps_arms(work_dir: Path, out_dir: Path) -> dict:
    ext_dir = work_dir / "extracted" / "oga-rigged-fps-arms"
    glb_dir = out_dir / "processed-glb" / "oga-rigged-fps-arms"
    glb_dir.mkdir(parents=True, exist_ok=True)
    tex = next(ext_dir.rglob("new_diff.png"), None)
    blend = next(ext_dir.rglob("FPS ARMS RIG 1 test anim.blend"), None) or next(ext_dir.rglob("FPS ARMS RIG 1.blend"), None)
    clear_scene()
    if blend:
        bpy.ops.wm.open_mainfile(filepath=str(blend))
        for obj in list(bpy.data.objects):
            if obj.type not in ("MESH", "ARMATURE", "EMPTY"):
                bpy.data.objects.remove(obj, do_unlink=True)
    else:
        fbx = next(ext_dir.rglob("*.fbx"))
        bpy.ops.import_scene.fbx(filepath=str(fbx))
    normalize_materials(texture_path=tex)
    out_glb = glb_dir / "fps_arms_rigged.glb"
    stats = export_glb(out_glb, export_animations=True)
    assert stats["primitive_count"] > 0 and stats["skin_count"] > 0
    rec = {
        "asset_id": "oga-rigged-fps-arms/partial_rig/fps_arms_rigged",
        "display_name": "FPS Arms Rigged (First-Person Partial Arms)",
        "source_id": "oga-rigged-fps-arms",
        "asset_type": "partial_humanoid_fps_arms",
        "category": "first_person_arms_rig",
        "skeleton_family": "oga-fps-arms-rig",
        "source_rel_path": blend.name if blend else "fps_arms.7z",
        "processed_glb_rel": "oga-rigged-fps-arms/fps_arms_rigged.glb",
        **stats,
    }
    return {"source_id": "oga-rigged-fps-arms", "admitted_count": 1, "records": [rec]}


def process_kenney_fbx_packs(work_dir: Path, out_dir: Path) -> list[dict]:
    pack_specs = [
        ("kenney-animated-protagonists", "animated_protagonist_humanoid"),
        ("kenney-animated-retro", "animated_retro_humanoid"),
        ("kenney-animated-survivors", "animated_survivor_humanoid"),
    ]
    results = []
    for source_id, category in pack_specs:
        ext_dir = work_dir / "extracted" / source_id
        model_fbx = next(ext_dir.rglob("Model/characterMedium.fbx"))
        anim_fbxs = sorted(ext_dir.glob("Animations/*.fbx"))
        skin_pngs = sorted(p for p in (ext_dir / "Skins").glob("*.png") if p.is_file())
        glb_dir = out_dir / "processed-glb" / source_id
        glb_dir.mkdir(parents=True, exist_ok=True)
        records = []
        for skin_png in skin_pngs:
            clear_scene()
            bpy.ops.import_scene.fbx(filepath=str(model_fbx))
            main_arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
            if not main_arm.animation_data:
                main_arm.animation_data_create()
            # Import each animation clip cleanly and attach as NLA track on main_arm
            for afbx in anim_fbxs:
                clip_name = slugify(afbx.stem)
                before_objs = set(bpy.data.objects)
                before_acts = set(bpy.data.actions)
                bpy.ops.import_scene.fbx(filepath=str(afbx))
                new_objs = [o for o in bpy.data.objects if o not in before_objs]
                new_acts = [a for a in bpy.data.actions if a not in before_acts]
                chosen_act = None
                for o in new_objs:
                    if o.type == "ARMATURE" and o.animation_data and o.animation_data.action:
                        chosen_act = o.animation_data.action
                        break
                if not chosen_act and new_acts:
                    chosen_act = new_acts[0]
                if chosen_act:
                    chosen_act.name = clip_name
                    track = main_arm.animation_data.nla_tracks.new()
                    track.name = clip_name
                    track.strips.new(clip_name, int(chosen_act.frame_range[0]), chosen_act)
                for o in new_objs:
                    bpy.data.objects.remove(o, do_unlink=True)
            main_arm.animation_data.action = None
            normalize_materials(texture_path=skin_png)
            slug = slugify(skin_png.stem)
            out_glb = glb_dir / f"{slug}.glb"
            stats = export_glb(out_glb, export_animations=True)
            assert not stats["external_uris"]
            assert stats["primitive_count"] > 0 and stats["skin_count"] > 0 and stats["animation_count"] >= 3
            records.append({
                "asset_id": f"{source_id}/character/{slug}",
                "display_name": f"{skin_png.stem} ({source_id.replace('kenney-animated-', '').title()})",
                "source_id": source_id,
                "asset_type": "character",
                "category": category,
                "skeleton_family": "kenney-character-medium-fbx",
                "source_rel_path": f"Model/characterMedium.fbx + Skins/{skin_png.name}",
                "processed_glb_rel": f"{source_id}/{slug}.glb",
                **stats,
            })
        results.append({"source_id": source_id, "admitted_count": len(records), "records": records})
    return results


def process_barnabe(src_dir: Path, out_dir: Path) -> dict:
    glb_dir = out_dir / "processed-glb" / "barnabe-wild-lowpoly-character"
    glb_dir.mkdir(parents=True, exist_ok=True)
    records = []
    # Export char_rigged - IK no floor.blend (static rig) and mocap_preview.blend (animated rig)
    candidates = [
        ("char_rigged_ik", "Barnabe Wild Low-Poly Character (IK Rig)", "char_rigged - IK no floor.blend", "character"),
        ("mocap_preview", "Barnabe Wild Low-Poly Character (Mocap Preview)", "mocap_preview.blend", "character"),
    ]
    for slug, disp, fname, atype in candidates:
        bpath = next(src_dir.rglob(fname))
        clear_scene()
        bpy.ops.wm.open_mainfile(filepath=str(bpath))
        normalize_materials()
        for obj in list(bpy.data.objects):
            if obj.type not in ("MESH", "ARMATURE", "EMPTY"):
                bpy.data.objects.remove(obj, do_unlink=True)
            elif obj.type == "MESH" and (obj.name.startswith(("WGT-", "CS_")) or "floor" in obj.name.lower()):
                bpy.data.objects.remove(obj, do_unlink=True)
        for obj in bpy.data.objects:
            obj.hide_set(False)
            obj.hide_viewport = False
        out_glb = glb_dir / f"{slug}.glb"
        stats = export_glb(out_glb, export_animations=True)
        assert not stats["external_uris"] and stats["primitive_count"] > 0
        records.append({
            "asset_id": f"barnabe-wild-lowpoly-character/{atype}/{slug}",
            "display_name": disp,
            "source_id": "barnabe-wild-lowpoly-character",
            "asset_type": atype,
            "category": "ik_rigged_lowpoly_humanoid",
            "skeleton_family": "barnabe-wild-ik-rig",
            "source_rel_path": fname,
            "processed_glb_rel": f"barnabe-wild-lowpoly-character/{slug}.glb",
            **stats,
        })
    return {"source_id": "barnabe-wild-lowpoly-character", "admitted_count": len(records), "records": records}


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=["direct_blender", "barnabe"])
    ap.add_argument("--work-dir", default="")
    ap.add_argument("--src-dir", default="")
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args(argv)

    out_dir = Path(args.out_dir).resolve()
    rep_dir = out_dir / "reports"
    rep_dir.mkdir(parents=True, exist_ok=True)

    if args.mode == "direct_blender":
        work_dir = Path(args.work_dir).resolve()
        xyz_res = process_xyz(work_dir, out_dir)
        gdq_res = process_gdquest(work_dir, out_dir)
        oga_res = process_oga_fps_arms(work_dir, out_dir)
        ken_res = process_kenney_fbx_packs(work_dir, out_dir)
        summary = {
            "xyz": xyz_res,
            "gdquest": gdq_res,
            "oga_fps_arms": oga_res,
            "kenney_fbx": ken_res,
        }
        (rep_dir / "direct_blender_manifest.json").write_text(json.dumps(summary, indent=2) + "\n")
        print(json.dumps({
            "xyz_admitted": xyz_res["admitted_count"],
            "xyz_rejected": xyz_res["rejected_count"],
            "gdquest": gdq_res["admitted_count"],
            "oga": oga_res["admitted_count"],
            "kenney_fbx": sum(k["admitted_count"] for k in ken_res),
        }))
    elif args.mode == "barnabe":
        res = process_barnabe(Path(args.src_dir).resolve(), out_dir)
        (rep_dir / "barnabe_manifest.json").write_text(json.dumps(res, indent=2) + "\n")
        print(json.dumps({"barnabe_admitted": res["admitted_count"]}))


if __name__ == "__main__":
    main()
