import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const LIST=['Medical_Female_01'];
const PAGE='/catalog/humanoids/tools/render_qa_medical_female01.html';
const EVID='catalog/humanoids/medical-female01-qa-evidence';
const PNG_DIR=EVID+'/screenshots';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(PNG_DIR,{recursive:true});
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const failures=[],results=[],screenshots=[];
function reject(msg){throw Error(msg)}
async function main(){
  let target=null;
  for(let i=0;i<80;i++){
    try{
      const req=await fetch('http://127.0.0.1:9222/json/list',{signal:AbortSignal.timeout(2000)});
      const pages=await req.json();
      target=pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
      if(target)break;
    }catch{}
    await sleep(300);
  }
  if(!target)reject('Chrome CDP target unavailable');
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,rejectPromise)=>{
    const t=setTimeout(()=>rejectPromise(Error('CDP connection timeout')),12000);
    socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
    socket.addEventListener('error',()=>{clearTimeout(t);rejectPromise(Error('CDP connection error'))},{once:true});
  });
  let id=0;
  const pending=new Map();
  socket.addEventListener('message',e=>{
    let o;try{o=JSON.parse(e.data)}catch{return}
    if(!o.id||!pending.has(o.id))return;
    const p=pending.get(o.id);pending.delete(o.id);clearTimeout(p.timer);
    if(o.error)p.reject(Error(JSON.stringify(o.error)));
    else p.resolve(o.result);
  });
  const call=(method,params={})=>new Promise((resolve,rejectPromise)=>{
    const token=++id;
    const timer=setTimeout(()=>{pending.delete(token);rejectPromise(Error(method+' timeout'))},15000);
    pending.set(token,{resolve,reject:rejectPromise,timer});
    socket.send(JSON.stringify({id:token,method,params}));
  });
  const evaluate=async expression=>{
    const response=await call('Runtime.evaluate',{expression,returnByValue:true});
    return response?.result?.value;
  };
  try{
    await call('Page.enable');await call('Runtime.enable');
    for(const name of LIST){
      const link='http://127.0.0.1:8911'+PAGE+'?model='+encodeURIComponent(name);
      await call('Page.navigate',{url:link});
      let report=null;
      const deadline=Date.now()+120000;
      while(Date.now()<deadline){
        try{
          const raw=await evaluate("document.querySelector('#qa-result')?.textContent || ''");
          if(typeof raw==='string'&&raw.startsWith('{')){
            const candidate=JSON.parse(raw);
            if(candidate.model===name&&candidate.finished){report=candidate;break}
          }
        }catch{}
        await sleep(650);
      }
      if(!report){failures.push({name,error:'Browser did not finish in 120 seconds'});continue}
      results.push(report);
      if(report.status!=='THREEJS_RENDER_ANIMATION_RELOAD_PASS_WITH_LIMITATIONS'){
        failures.push({name,error:report.error||report.status});continue;
      }
      if(report.revision!=='185'||report.views?.length!==2||report.clips<1||report.bones<40){
        failures.push({name,error:'Browser report invariant mismatch'});continue;
      }
      for(const label of ['positive_z_oblique','negative_z_oblique']){
        const data=await evaluate('window.__qaFrames?.['+JSON.stringify(label)+'] || null');
        if(typeof data!=='string'||!data.startsWith('data:image/png;base64,'))reject('Screenshot missing '+name+' '+label);
        const png=Buffer.from(data.slice('data:image/png;base64,'.length),'base64');
        if(png.length<12000||png.toString('hex',0,8)!=='89504e470d0a1a0a')reject('Invalid or empty PNG '+name+' '+label);
        if(png.readUInt32BE(16)!==768||png.readUInt32BE(20)!==768)reject('Unexpected screenshot dimensions');
        const file=path.join(PNG_DIR,name+'__'+label+'.png');
        fs.writeFileSync(file,png,{flag:'wx'});
        screenshots.push({name,view:label,file:path.basename(file),bytes:png.length,sha256:shaFile(file),
                         visible_pixel_fraction_estimate:report.views.find(x=>x.view===label)?.visible_pixel_fraction_estimate});
      }
      console.log('MODEL_BROWSER_RENDER_PASS',name,report.bones,report.clips,report.bounds_m,report.views?.map(x=>x.triangles));
    }
  }finally{socket.close()}
  const proof={
    schema:'rocketbox-medical_female01-conversion-visual-qa-v1',
    date_utc:new Date().toISOString(),
    source:'GitHub Actions Ubuntu Chromium SwiftShader WebGL2 Three.js r185 actual GLB render',
    source_inputs:'Official pinned Git blob SHA-1 and individual source SHA-256 verified on runner; original archived FBX copies independently matched against previous GitHub Actions artifact; old Drive archive not replaced',
    source_archive_transfer_note:'Runner fetches exact official pinned Git blobs, compares historical FBX source bytes against an earlier Actions artifact; no private Drive credentials or downloads',
    visual_approval:'NOT_GRANTED_AUTOMATED_VISUAL_EVIDENCE_ONLY',
    models:results,images:screenshots,failures,
    original_sources_modified:false,
    screenshot_required:LIST.length*2,
    runtime_release_tested:false,
    limitations:['No human scene-by-scene visual signoff','No physical mobile device','No sustained GPU memory/lifecycle baseline','No animation retarget quality judgment','Silhouette pixel check does not prove correct texture or clothing appearance']
  };
  fs.writeFileSync(EVID+'/medical_female01_visual_report.json',JSON.stringify(proof,null,2)+'\n');
  fs.writeFileSync(EVID+'/SCREENSHOT_SHA256SUMS.txt',screenshots.map(i=>i.sha256+'  screenshots/'+i.file).join('\n')+'\n');
  console.log('BROWSER_QA_RESULT',JSON.stringify({models:results.length,screenshots:screenshots.length,failures:failures.length,views:2}));
  if(failures.length||results.length!==LIST.length||screenshots.length!==LIST.length*2)reject('One or more browser/visual evidence acceptance checks failed');
}
try{await main()}catch(e){
  fs.mkdirSync(EVID,{recursive:true});
  fs.writeFileSync(EVID+'/BROWSER_QA_FAILURE.json',JSON.stringify({error:String(e),utc:new Date().toISOString()},null,2)+'\n');
  console.error(String(e));process.exitCode=1;
}