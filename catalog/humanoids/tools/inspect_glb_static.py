#!/usr/bin/env python3
"""Conservative GLB structural test; deliberately not a browser or visual test."""
import hashlib, json, os, pathlib, struct, sys
from datetime import datetime, timezone
root = pathlib.Path(os.environ.get("ROCKETBOX_OUTPUT", "/tmp/rocketbox-batch")).resolve()
processed = root / "processed-glb"
evidence = root / "evidence"
evidence.mkdir(parents=True, exist_ok=True)
reports = []
for file in sorted(processed.glob("*.glb")):
    report={"model":file.stem, "path":str(file.relative_to(root)), "size":file.stat().st_size,
            "sha256":hashlib.sha256(file.read_bytes()).hexdigest(),"verdict":"failed"}
    try:
        data=file.read_bytes()
        assert len(data)>=20 and data[:4]==b"glTF","not a GLB"
        version,length=struct.unpack_from("<II",data,4)
        assert version==2 and length==len(data),"invalid GLB version or length"
        size,tag=struct.unpack_from("<I4s",data,12)
        assert tag==b"JSON" and size>0 and 20+size<=length,"missing JSON chunk"
        gltf=json.loads(data[20:20+size].decode("utf-8"))
        assert gltf.get("asset",{}).get("version")=="2.0","invalid glTF"
        meshes=gltf.get("meshes",[])
        skins=gltf.get("skins",[])
        images=gltf.get("images",[])
        textures=gltf.get("textures",[])
        animations=gltf.get("animations",[])
        nodes=gltf.get("nodes",[])
        external=[x.get("uri") for x in gltf.get("buffers",[])+images if x.get("uri") and not x["uri"].startswith("data:")]
        skinned_nodes=sum(1 for n in nodes if "skin" in n and "mesh" in n)
        joints=sum(len(s.get("joints",[])) for s in skins)
        mesh_primitives=sum(len(m.get("primitives",[])) for m in meshes)
        report.update({"mesh_count":len(meshes), "primitive_count":mesh_primitives,
                       "node_count":len(nodes), "skins":len(skins), "joint_references":joints,
                       "skinned_mesh_nodes":skinned_nodes, "materials":len(gltf.get("materials",[])),
                       "images":len(images), "textures":len(textures),
                       "animations":len(animations),
                       "animation_names":[a.get("name","") for a in animations],
                       "external_uris":external, "extensions_used":gltf.get("extensionsUsed",[])})
        assert mesh_primitives>0, "no geometry"
        assert len(skins)>0 and joints>0 and skinned_nodes>0,"no usable skin attachment"
        assert not external, "unbundled external dependency"
        report["verdict"]="static_glb_structure_pass"
        report["material_test"]="images_present" if images else "NO_EMBEDDED_IMAGES_CHECK_MATERIALS"
        report["animation_test"]="clips_enumerated" if animations else "NO_CLIPS_IN_THIS_MODEL"
    except Exception as exc:
        report["error"]=str(exc)
    reports.append(report)
out={"generated_utc":datetime.now(timezone.utc).isoformat(),"reports":reports,
     "release_verdict":"PARTIAL" if reports else "FAIL",
     "limitations":["No Three.js GLTFLoader/browser smoke performed", "No rendered visual, animation-retarget, performance, or unload test performed",
                    "GLB metadata checks do not establish proper texture appearance or animation playback"]}
(evidence/"glb_static_validation.json").write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({"models":len(reports),"passes":sum(r["verdict"]=="static_glb_structure_pass" for r in reports),
                  "summaries":[{"model":r["model"],"verdict":r["verdict"],"skins":r.get("skins"),
                                "images":r.get("images"),"animations":r.get("animations")} for r in reports]}))
