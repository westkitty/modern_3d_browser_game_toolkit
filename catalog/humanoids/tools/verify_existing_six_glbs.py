#!/usr/bin/env python3
"""Assert six existing GLB bytes reproduce the already archived Drive manifests."""
from pathlib import Path
import hashlib,json,shutil
R=Path("/tmp/rocketbox-b02-completion")
files={
"Male_Adult_01":("b01","733d6b0396893d4d0111e39ecc247618436b88ec1f1cee74e026c1356000c44c"),
"Female_Adult_01":("b01","4dd78525aa1175af4e87683e44b21cbfe655c6c6b126282032e7a6353801a40d"),
"Male_Adult_08":("male-adult-08","7d0531e7062d7c0e598cf4325f1cff26a1934f2b2af8c780a5a6b7f7c8471ef4"),
"Construction_Female_01":("construction-female-01","7fc6a1575fdfffb50de3a33f3a317e72c8db10b2d794e9a570f7ab77bebd86bc"),
"Fire_Male_04":("fire-male-04","b5bc8f04bd2612a27d8bf9bab4bda6f107706c91045f45f96bb088deab91d1fe"),
"Sports_Female_01":("sports-female-01","7d24da445ab90166e5e782c3527d027da2091c23519fb28393fa46db3be9e357")
}
target=R/"qa-glbs";target.mkdir(parents=True,exist_ok=True)
out=[]
for name,(group,expected) in files.items():
 src=list((R/"runner-input"/"existing"/group).rglob(name+".glb"))
 if len(src)!=1:raise RuntimeError("Expected one existing GLB copy: "+name+"; found "+str(src))
 with src[0].open("rb") as f: h=hashlib.file_digest(f,"sha256").hexdigest()
 if h!=expected:raise RuntimeError("Existing GLB SHA-256 mismatch: "+name)
 dst=target/(name+".glb")
 if dst.exists():raise RuntimeError("Refusing duplicate GLB placement")
 shutil.copy2(src[0],dst)
 out.append({"name":name,"sha256":h,"bytes":dst.stat().st_size,
             "source_runner_artifact":group,"archive_identity":"matches previously recorded private Drive GLB SHA-256"})
print(json.dumps({"existing_six_sha256_pass":len(out),"names":[o["name"] for o in out]}),flush=True)
(R/"evidence"/"EXISTING_SIX_SHA256_PROOF.json").write_text(json.dumps({"existing":out,"webgl_test":"pending"},indent=2)+"\n")
