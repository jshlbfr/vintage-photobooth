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
const report={counts:[],flashes:[],layouts:[],checks:[],exports:[],errors};
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
   if(shot){const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(out+'/m5-'+l.route.slice(1)+'-'+width+'.png',Buffer.from(image.data,'base64'));}
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
   await click('.setup-continue');await route('/capture');await waitFor(`document.querySelectorAll('.filter-thumbnail img').length===9`,'filter thumbnails');
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
 const upload=async (count,target=count)=>{
   await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=160;c.height=200;const x=c.getContext('2d');x.fillStyle='#bf806b';x.fillRect(0,0,160,200);x.fillStyle='#334455';x.fillRect(0,0,60,100);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();for(let i=0;i<${count};i++)d.items.add(new File([b],'test'+i+'.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitCount(target);
 };

 const rect=selector=>evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};})()`);
 const drag=async(selector,dx,dy,touch=false)=>{
   const p=await rect(selector);
   if(touch){await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});for(let i=1;i<=6;i++)await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+dx*i/6,y:p.y+dy*i/6,id:1}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
   else{await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});for(let i=1;i<=6;i++)await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+dx*i/6,y:p.y+dy*i/6,buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+dx,y:p.y+dy,button:'left',clickCount:1});}
   await delay(100);
 };
 const setInput=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await delay(100);};
 const decorations=()=>evaluate(`[...document.querySelectorAll('.customize-preview [data-decoration-id]')].map(e=>({id:e.dataset.decorationId,transform:e.getAttribute('transform'),html:e.innerHTML}))`);
 const byText=text=>evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)}).click()`);
 await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out+'/downloads'});
 for(const count of (process.env.EDITOR_COUNTS?.split(',').map(Number)??[1,2,4,5,6,8,10,12])){
   console.log('M5 editor/export',count);await start(count,1);
   if(count===2)await click('[aria-label="Silver screen"]');
   if(count===2){await upload(1);await click('[aria-label="Original"]');await upload(1,2);}else await upload(count);await click('.choose-frame');await route('/customize');await evaluate('document.fonts.ready');
   await click('[aria-label="Add heart sticker"]');await click('[aria-label="Add heart sticker"]');await click('[aria-label="Add camera sticker"]');
   const initial=await decorations();assert(initial.length===3&&new Set(initial.map(e=>e.id)).size===3,'independent stickers');assert(new Set(initial.map(e=>e.transform)).size===3,'stacked additions');
   await drag('.editor-object:last-of-type',20,25);const moved=await decorations();assert(JSON.stringify(moved)!==JSON.stringify(initial),'mouse move failed');
   await drag('.editor-handle.resize',15,18);await drag('.editor-handle.rotate',20,5);
   await byText('Send backward');
   await click('.add-text');await setInput('.editor-inspector textarea','Summer\nmemories');
   await setInput('.editor-inspector select','script');await click('[aria-label="Text color #702C2B"]');
   await setInput('[aria-label="Decoration rotation"]','-12');await setInput('[aria-label="Decoration size"]','90');
   if(count===8){const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(out+'/m5-editor-selected.png',Buffer.from(shot.data,'base64'));}
   const edited=await decorations();assert(edited.length===4&&edited.some(e=>e.html.includes('memories')),'text missing');
   await byText('Undo');await byText('Redo');assert(JSON.stringify(await decorations())===JSON.stringify(edited),'undo redo mismatch');
   await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Done')?.click()`);const beforeColor=await decorations();await click('[aria-label="Vanilla"]');assert(JSON.stringify(await decorations())===JSON.stringify(beforeColor),'color moved decorations');
   await click('[aria-label="Next frame"]');if(count===8){for(let f=0;f<9;f++){await center('.customize-preview');await click('[aria-label="Next frame"]');}}assert(JSON.stringify(await decorations()).includes('Summer'),'frame deleted decoration');
   await layout(1440,1024,count===8);await center('.customize-preview');await layout(1366,768,count===8);await center('.customize-preview');
   await layout(390,844,count===8);await evaluate(`window.pointerLog=[];for(const t of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(t,e=>pointerLog.push({t:e.type,p:e.pointerType,b:e.button,x:e.clientX,y:e.clientY,target:e.target.getAttribute('class')}),true);`);const beforeTouch=JSON.stringify(await decorations());await drag('.editor-object:last-of-type',10,15,true);assert(JSON.stringify(await decorations())!==beforeTouch,'touch move failed '+JSON.stringify(await evaluate('({events:pointerLog,scrollY,body:document.body.innerText})')));await layout(320,844,count===8);await layout(1440);
   const final=await decorations();
   await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print complete');await delay(400);assert(await evaluate(`location.pathname==='/print'&&!document.querySelector('.editor-layer')`),'Print selection/redirect');
   assert(await evaluate(`document.querySelectorAll('.print-output [data-decoration-id]').length===4`),'Print lost decoration');
   await click('.print-continuation a');await route('/results');assert(await evaluate(`!document.querySelector('.selection-controls')&&document.querySelectorAll('.results-strip [data-decoration-id]').length===4`),'Results lost decoration');
   await click('.result-action-primary');await waitFor(`document.querySelector('.preview-note').textContent.includes('Check your downloads')`,'PNG render',30000);
   const png=await evaluate(`(async()=>{const b=[...qa.urls.values()].findLast(b=>b.type==='image/png');if(!b)throw Error('No PNG');const im=await createImageBitmap(b);const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const corner=[...ctx.getImageData(0,0,1,1).data];const svg=document.querySelector('.results-strip svg'),box=svg.viewBox.baseVal;const samples=[...svg.querySelectorAll('clipPath[id*="-slot-"] rect')].map(r=>[...ctx.getImageData(Math.floor((Number(r.getAttribute('x'))+Number(r.getAttribute('width'))*.8)*c.width/box.width),Math.floor((Number(r.getAttribute('y'))+Number(r.getAttribute('height'))*.2)*c.height/box.height),1,1).data]);im.close();const data=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b);});return {width:c.width,height:c.height,corner,samples,bytes:b.size,data};})()`);
   assert(png.width>700&&png.height>1000&&png.width*png.height<=8010000,'resolution');assert(png.corner[3]===0,'export includes page background');if(count===2){assert(Math.max(...png.samples[0].slice(0,3))-Math.min(...png.samples[0].slice(0,3))<4,'monochrome export failed');assert(Math.max(...png.samples[1].slice(0,3))-Math.min(...png.samples[1].slice(0,3))>25,'Original inherited another photo filter');}
   await writeFile(out+'/m5-export-'+count+'.png',Buffer.from(png.data,'base64'));delete png.data;report.exports.push({count,...png});
   const cached=await evaluate('qa.urls.size');await click('.result-action-primary');await delay(200);assert(await evaluate('qa.urls.size')===cached,'cache leak');
   await click('a[href="/customize"].result-action');await route('/customize');assert(JSON.stringify(await decorations())===JSON.stringify(final),'Edit Again flattened/moved composition');
   await evaluate(`document.querySelector('.editor-object').focus()`);await byText('Delete decoration');assert((await decorations()).length===3,'delete failed');
   await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');await click('.print-continuation a');await route('/results');
   await click('a[href="/camera"].result-action');await route('/camera');await waitFor('qa.urls.size===0','Take Another cleanup');
   report.counts.push(count);
 }
 await start(4,3);await click('.capture-actions button:last-child');await waitFor(`!!document.querySelector('.screen-flash')`,'flash begins');await click('[aria-label="Pause capture"]');await waitCount(1);await waitFor(`document.querySelector('.capture-actions button:last-child').textContent==='Resume'`,'finish then pause');await delay(1000);assert(await progress()===1,'pause ghost shutter');await click('.capture-actions button:last-child');await waitCount(4);await assertFlash(4);
 await start(1,1);await click('[aria-label="Screen flash"]');await click('.capture-actions button:last-child');await waitCount(1);assert(await evaluate('qa.flashes.length===0'),'disabled flash');
 assert(networkRequests.every(r=>r.method==='GET'&&(r.url.startsWith(origin+'/')||r.url.startsWith('blob:')||r.url.startsWith('data:'))),'media upload or external request');
 assert(!networkRequests.some(r=>r.url.includes('/frames/')),'custom frames used');assert(errors.length===0,'browser errors');
 console.log(JSON.stringify({counts:report.counts,exports:report.exports,layouts:report.layouts.length,errors},null,2));
} finally {await writeFile(out+'/m5-report.json',JSON.stringify(report,null,2));browser.kill();for(const promise of pending.values())clearTimeout(promise.timer);}
