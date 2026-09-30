// Optional integration check: uses Chromium synthetic devices, never a physical camera.
// Run against npm run start -- --port 3003; set CHROMIUM_PATH to an installed executable.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve('.review');
const origin = new URL(process.env.PHOTOBOOTH_URL ?? 'http://127.0.0.1:3003').origin;
const executable = process.env.CHROMIUM_PATH;
if (!executable) throw new Error('Set CHROMIUM_PATH to a Chromium or chrome-headless-shell executable. Start the production server first.');
await mkdir(resolve(out, 'media-browser-profile'), { recursive: true });
await mkdir(resolve(out, 'tmp'), { recursive: true });
const browser = spawn(executable, [
  '--headless', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--remote-debugging-pipe', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-breakpad', '--disable-crash-reporter',
  '--use-mock-keychain', '--disable-sync', `--user-data-dir=${out}/media-browser-profile`,
  `--disk-cache-dir=${out}/media-browser-cache`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], env: { ...process.env, TMPDIR: `${out}/tmp/` } });
let stderr = '';
browser.stderr.on('data', chunk => { stderr += chunk; });
let nextId = 0;
let buffer = '';
const pending = new Map();
const errors = [];
const networkRequests = [];
browser.stdio[4].on('data', chunk => {
  buffer += chunk.toString();
  let delimiter;
  while ((delimiter = buffer.indexOf('\0')) >= 0) {
    const raw = buffer.slice(0, delimiter);
    buffer = buffer.slice(delimiter + 1);
    if (!raw) continue;
    const message = JSON.parse(raw);
    if (message.id && pending.has(message.id)) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(promise.timer);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
      else promise.resolve(message.result);
    }
    if (message.method === 'Network.requestWillBeSent') networkRequests.push({url:message.params.request.url,method:message.params.request.method});
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry);
  }
});
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => reject(new Error(`Timeout: ${method}, ${params.expression?.slice(0,250)}. ${stderr.slice(-1500)}`)), 15000);
    pending.set(id, { resolve, reject, timer });
    browser.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const report={counts:[],flashes:[],layouts:[],checks:[],errors};
try {
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cdp=(method,params={})=>send(method,params,sessionId);
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const assert=(v,m)=>{if(!v)throw new Error(m);};
 const waitFor=async(expression,name,timeout=15000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await delay(60);}throw new Error('Timeout '+name+': '+await evaluate('document.body.innerText'));};
 const route=path=>waitFor(`location.pathname===${JSON.stringify(path)}`,path);
 const click=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(60);};
 const choose=async(label,value)=>{await evaluate(`[...document.querySelectorAll('[aria-label="${label}"] button')].find(b=>b.textContent===${JSON.stringify(value)}).click()`);await delay(60);};
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Network.enable');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.qa={calls:[],tracks:[],urls:new Map(),revoked:[],flashes:[],shots:[],ticks:[],denyAudio:false,print:0};window.print=()=>qa.print++;
 const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
 navigator.mediaDevices.getUserMedia=async c=>{qa.calls.push(c);if(c.audio&&qa.denyAudio)throw new DOMException('Denied','NotAllowedError');const s=await gum(c);qa.tracks.push(...s.getTracks());return s;};
 const make=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=make(b);qa.urls.set(u,b);return u;};URL.revokeObjectURL=u=>{qa.urls.delete(u);qa.revoked.push(u);revoke(u);};
 const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(source instanceof HTMLVideoElement&&this.canvas.width>1000){qa.shots.push({at:performance.now(),flash:!!document.querySelector('.screen-flash'),width:this.canvas.width,filter:document.querySelector('.filter-option[aria-pressed=true]')?.getAttribute('aria-label')});}return draw.call(this,source,...args);};
 document.addEventListener('DOMContentLoaded',()=>new MutationObserver(records=>{
   for(const r of records){for(const node of r.addedNodes){if(node.nodeType===1&&node.matches('.screen-flash')){const s=getComputedStyle(node),b=node.getBoundingClientRect();qa.flashes.push({at:performance.now(),color:s.backgroundColor,opacity:s.opacity,z:s.zIndex,position:s.position,pointer:s.pointerEvents,x:b.x,y:b.y,w:b.width,h:b.height,vw:innerWidth,vh:innerHeight,parent:node.parentElement.tagName});}}
   for(const node of r.removedNodes){if(node.nodeType===1&&node.matches('.screen-flash')){qa.flashes.at(-1).duration=performance.now()-qa.flashes.at(-1).at;}}}
   const n=document.querySelector('.countdown')?.textContent;if(n&&qa.ticks.at(-1)!==n)qa.ticks.push(n);
 }).observe(document.body,{subtree:true,childList:true,characterData:true}));
 `});
 const layout=async(width,height=1024,shot=false)=>{
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(140);
   const l=await evaluate(`({route:location.pathname,width:innerWidth,height:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,clips:document.querySelectorAll('svg.photo-strip clipPath').length})`);
   assert(l.sw<=width,'horizontal overflow '+JSON.stringify(l));if(width>=1100)assert(l.sh<=height,'desktop vertical overflow '+JSON.stringify(l));report.layouts.push(l);
   if(width>=1100&&l.route==='/capture'){
     const g=await evaluate(`(()=>{const p=document.querySelector('.capture-panel').getBoundingClientRect(),s=document.querySelector('.capture-strip svg > rect').getBoundingClientRect(),b=document.querySelector('.choose-frame').getBoundingClientRect();return {dy:Math.abs(p.y+p.height/2-s.y-s.height/2),gap:b.y-s.bottom};})()`);
     assert(g.dy<1&&g.gap>=8,'full-panel strip centering '+JSON.stringify(g));
   }
   if(width>=1100&&l.route==='/customize'){
     const g=await evaluate(`(()=>{const p=document.querySelector('.frame-carousel').getBoundingClientRect(),s=document.querySelector('.frame-template svg > rect').getBoundingClientRect();return {top:s.top-p.top,bottom:p.bottom-s.bottom};})()`);
     assert(g.top>=-1&&g.bottom>=-1,'frame picker overflow '+JSON.stringify(g));
   }
   if(shot){const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(out+'/m4-'+l.route.slice(1)+'-'+width+'.png',Buffer.from(image.data,'base64'));}
 };
 const center=async selector=>{
   const g=await evaluate(`(()=>{const a=document.querySelector('${selector}').getBoundingClientRect(),b=document.querySelector('${selector} svg > rect').getBoundingClientRect();return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2)};})()`);assert(g.dx<1&&g.dy<1,'centering '+selector+JSON.stringify(g));
 };
 const progress=()=>evaluate(`Number(document.querySelector('.capture-counter strong').textContent.split('/')[0])`);
 const waitCount=count=>waitFor(`document.querySelector('.capture-counter strong')?.textContent.startsWith('${count}/')`,'photo '+count,90000);
 const start=async(count,timer=1)=>{
   await cdp('Page.navigate',{url:origin+'/'});await waitFor(`!!document.querySelector('.landing-start a')`,'landing');assert(await evaluate('qa.calls.length===0'),'landing permission');
   await click('.landing-start a');await route('/camera');await choose('Photo count',String(count));await choose('Timer',timer+'s');
   await click('.camera-empty button');await waitFor(`document.querySelector('video')?.readyState>=2&&!document.querySelector('.camera-empty')`,'camera');
   assert(await evaluate(`getComputedStyle(document.querySelector('video')).filter==='none'&&!document.querySelector('.live-filter-canvas')`),'Original has processing');
   await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
   await click('.setup-continue');await route('/capture');await waitFor(`document.querySelectorAll('.filter-thumbnail img').length===10`,'filter thumbnails');
   assert(await evaluate(`document.querySelector('[aria-label="Original"]').getAttribute('aria-pressed')==='true'`),'Original default');
   await center('.capture-strip');await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
 };
 const assertFlash=async expected=>{
   await delay(200);const q=await evaluate(`({flashes:qa.flashes,shots:qa.shots,ticks:qa.ticks})`);
   assert(q.shots.length===expected&&q.flashes.length===expected,'flash/shot mismatch '+JSON.stringify(q));
   for(const f of q.flashes)assert(f.color==='rgb(255, 255, 255)'&&f.opacity==='1'&&f.position==='fixed'&&f.z==='2147483647'&&f.parent==='BODY'&&f.x===0&&f.y===0&&f.w===f.vw&&f.h===f.vh&&f.duration>=350&&f.duration<550&&f.pointer==='none','flash style/timing '+JSON.stringify(f));
   assert(q.shots.every(s=>s.flash),'video sampled before flash');
   q.shots.forEach((shot,i)=>{const before=shot.at-q.flashes[i].at,after=q.flashes[i].duration-before;assert(before>=110&&after>=230,'flash illumination/hold timing '+before+'/'+after);});assert(!q.ticks.includes('1'),'countdown displayed 1');report.flashes.push(q);
 };
 const upload=async count=>{
   await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=160;c.height=200;const x=c.getContext('2d');x.fillStyle='#bf806b';x.fillRect(0,0,160,200);x.fillStyle='#334455';x.fillRect(0,0,60,100);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();for(let i=0;i<${count};i++)d.items.add(new File([b],'test'+i+'.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitCount(count);
 };
 for(const count of [1,2,4,5,6,8,10,12]){
   console.log('M4 count',count);await start(count,[4,6,8,12].includes(count)?3:1);
   if(count===1){await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await click('.capture-actions button:last-child');await waitCount(1);await assertFlash(1);await cdp('Emulation.setEmulatedMedia',{features:[]});}
   else if([4,6,8,12].includes(count)){
     await click('.capture-actions button:last-child');
     if(count===8){
       await delay(250);await click('[aria-label="Pause capture"]');await waitFor(`document.querySelector('.capture-actions button:last-child').textContent==='Resume'`,'pause');await delay(1200);assert(await progress()===0,'ghost capture after pause');
       await click('[aria-label="Golden Hour"]');await click('.capture-actions button:last-child');await waitCount(3);await click('[aria-label="Pause capture"]');await waitFor(`document.querySelector('.capture-actions button:last-child').textContent==='Resume'`,'pause three');assert(await progress()===3,'pause lost count');
       await click('[aria-label="Mono"]');await click('.capture-actions button:last-child');
     }
     await waitCount(count);await waitFor(`!!document.querySelector('a.choose-frame')`,'sequence complete');await assertFlash(count);
   } else await upload(count);
   await center('.capture-strip');await layout(1440,1024,count===8);
   const composition=await evaluate(`({box:document.querySelector('.capture-strip svg').getAttribute('viewBox'),slots:[...document.querySelectorAll('.capture-strip clipPath[id*="-slot-"] rect')].map(n=>({x:n.getAttribute('x'),y:n.getAttribute('y')}))})`);
   assert(new Set(composition.slots.map(s=>s.x)).size===(count>=6?2:1),'wrong columns');
   if(count===8){await waitFor(`document.querySelectorAll('.capture-strip image').length===8`,'processed images');assert(await evaluate(`JSON.stringify([...document.querySelectorAll('.capture-strip image')].map(n=>n.dataset.filter))===JSON.stringify(['golden-hour','golden-hour','golden-hour','mono','mono','mono','mono','mono'])`),'per-capture filter lost');}
   await click('.choose-frame');await route('/customize');assert(await evaluate(`qa.tracks.every(t=>t.readyState==='ended')`),'hardware remained on');
   for(let f=0;f<9;f++){await center('.customize-preview');await click('[aria-label="Next frame"]');}
   await click('[aria-label="Vanilla"]');await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
   await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');await delay(400);assert(await evaluate(`location.pathname==='/print'`),'print auto navigated');
   assert(await evaluate(`document.querySelector('.print-output svg').getAttribute('viewBox')===${JSON.stringify(composition.box)}`),'print geometry changed');
   await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
   await click('.print-continuation a');await route('/results');await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
   assert(await evaluate(`document.querySelector('.results-strip svg').getAttribute('viewBox')===${JSON.stringify(composition.box)}`),'results geometry changed');
   const calls=await evaluate('qa.calls.length');await click('a[href="/customize"].result-action');await route('/customize');assert(await evaluate(`qa.calls.length===${calls}`),'Edit Again permission');
   const privacy=await evaluate(`({print:qa.print,frames:performance.getEntriesByType('resource').some(e=>e.name.includes('/frames/'))})`);assert(!privacy.print&&!privacy.frames,'unexpected print/custom frame');
   report.counts.push(count);
 }
 console.log('M4 manual/filter/timer checks');
 await start(4,1);await click('[aria-label="Screen flash"]');await click('.capture-actions button:last-child');await waitCount(1);await delay(1500);assert(await progress()===1,'manual continued');assert(await evaluate('qa.flashes.length===0'),'flash off');
 await click('[aria-label="Golden Hour"]');await click('.capture-actions button:last-child');await waitCount(2);
 await click('[aria-label="Mono"]');await click('.capture-actions button:last-child');await waitCount(3);
 await click('[aria-label="Original"]');await click('.capture-actions button:last-child');await waitCount(4);await waitFor(`document.querySelectorAll('.capture-strip image').length===4`,'filters');
 assert(await evaluate(`JSON.stringify([...document.querySelectorAll('.capture-strip image')].map(n=>n.dataset.filter))===JSON.stringify(['original','golden-hour','mono','original'])`),'manual filter assignment');
 await click('.capture-feedback button');await waitCount(0);await waitFor(`![...qa.urls.values()].some(b=>b.type.startsWith('video/'))`,'motion cleanup');
 for(const timer of [5,10]){
   await start(2,timer);await click('.capture-actions button:last-child');await waitCount(2);await assertFlash(2);
   const ticks=await evaluate('qa.ticks');assert(ticks.includes(String(timer))&&ticks.includes('Smile!')&&!ticks.includes('1'),'timer copy');
 }
 await start(1,1);await click('.capture-counter .back-link');await route('/camera');await evaluate('qa.denyAudio=true');await click('[aria-label="Live Moment Audio"]');await waitFor(`document.querySelector('.audio-status').textContent.includes('silent')`,'audio fallback');
 const audioCalls=await evaluate('qa.calls.filter(c=>c.audio).length');await click('[aria-label="Live Moment Audio"]');await click('[aria-label="Live Moment Audio"]');assert(await evaluate(`qa.calls.filter(c=>c.audio).length===${audioCalls}`),'repeated mic prompt');
 await click('.setup-continue');await route('/capture');await click('.capture-actions button:last-child');await waitCount(1);await assertFlash(1);
 await click('.choose-frame');await route('/customize');await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');await click('.print-continuation a');await route('/results');await click('a[href="/camera"].result-action');await route('/camera');
 await waitFor('qa.urls.size===0','Take Another URLs');assert(await evaluate(`qa.tracks.every(t=>t.readyState==='ended')`),'Take Another hardware');
 assert(networkRequests.every(r=>r.method==='GET'&&(r.url.startsWith(origin+'/')||r.url.startsWith('blob:')||r.url.startsWith('data:'))),'unexpected outbound request');
 report.checks=['all counts shared across four stages','1s manual','3/5/10 continuous','pause during countdown','pause after 3/resume with filter change','Original pixel pipeline','manual per-photo filters','flash disabled','flash enabled with reduced motion','audio denial without repeat prompt','URL/track cleanup','desktop and mobile layouts','Print explicit continuation','no media uploads/custom frames'];
 console.log(JSON.stringify({counts:report.counts,flashCases:report.flashes.map(f=>f.flashes.length),layouts:report.layouts.length,errors},null,2));if(errors.length)process.exitCode=1;
} finally {await writeFile(out+'/m4-report.json',JSON.stringify(report,null,2));browser.kill();for(const promise of pending.values())clearTimeout(promise.timer);}
