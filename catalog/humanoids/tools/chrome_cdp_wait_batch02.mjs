import fs from "node:fs";
const ROOT = "catalog/humanoids/qa-evidence";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const targetTail = "/catalog/humanoids/tools/browser_smoke_batch02.html";
const started = Date.now();
async function getTarget() {
  const response = await fetch("http://127.0.0.1:9222/json/list", {signal: AbortSignal.timeout(5000)});
  if (!response.ok) throw Error("Chrome debug server " + response.status);
  const pages = await response.json();
  return pages.find(page => page.type === "page" && page.url.endsWith(targetTail));
}
async function main() {
  let target;
  while (!target && Date.now()-started < 20000) {
    try { target = await getTarget(); } catch {}
    if (!target) await sleep(350);
  }
  if (!target?.webSocketDebuggerUrl) throw Error("Browser target missing");
  const websocket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>reject(Error("CDP websocket timeout")),10000);
    websocket.addEventListener("open",()=>{clearTimeout(timer);resolve()},{once:true});
    websocket.addEventListener("error",(e)=>{clearTimeout(timer);reject(Error("CDP websocket error"))},{once:true});
  });
  let serial=0;
  const pending = new Map();
  websocket.addEventListener("message", event => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }
    if (!payload.id || !pending.has(payload.id)) return;
    const p=pending.get(payload.id);pending.delete(payload.id);
    if (payload.error) p.reject(Error(JSON.stringify(payload.error)));
    else p.resolve(payload.result);
  });
  function call(method,params={}) {
    return new Promise((resolve,reject)=>{
      const id=++serial;
      pending.set(id,{resolve,reject});
      websocket.send(JSON.stringify({id,method,params}));
      setTimeout(()=>{
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(Error("CDP "+method+" timeout"));
      },10000);
    });
  }
  try {
    await call("Runtime.enable");
    let latest="";
    const deadline=Date.now()+90000;
    while(Date.now()<deadline){
      const r=await call("Runtime.evaluate",{expression:"document.querySelector('#qa-result')?.textContent || ''",returnByValue:true});
      latest=r?.result?.value||"";
      if (latest.startsWith("{")) {
        let parsed;
        try {parsed=JSON.parse(latest);}catch{}
        if(parsed?.finished){
          fs.mkdirSync(ROOT,{recursive:true});
          fs.writeFileSync(ROOT+"/browser_smoke_result.json", JSON.stringify(parsed,null,2)+"\n");
          console.log(JSON.stringify(parsed,null,2));
          const good=parsed.overall==="PASS_WITH_LIMITATIONS" &&
            parsed.modelResults?.length===4 &&
            parsed.modelResults.every(x=>x.status==="THREEJS_LOADER_RENDER_MIXER_RELOAD_PASS");
          if(!good) throw Error("Browser completed with a failed loader, animation, render or reload assertion");
          return;
        }
      }
      await sleep(700);
    }
    throw Error("Browser did not finish within 90 seconds; last DOM state: "+latest.slice(0,1500));
  } finally {websocket.close();}
}
try{await main();}
catch(err){
  fs.mkdirSync(ROOT,{recursive:true});
  fs.writeFileSync(ROOT+"/cdp_failure.json",JSON.stringify({error:String(err),time:new Date().toISOString()},null,2)+"\n");
  console.error(String(err));process.exitCode=1;
}
