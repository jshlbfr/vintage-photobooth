// Optional integration check: uses Chromium synthetic devices, never a physical camera.
// Run against npm run start -- --port 3003; set CHROMIUM_PATH to an installed executable.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import './register-typescript.mjs';
const {processPixels}=await import('../lib/filters/engine.ts');
const {FILTER_PRESETS}=await import('../lib/filters/presets.ts');

const out = resolve('.review/m6');
const origin = new URL(process.env.PHOTOBOOTH_URL ?? 'http://127.0.0.1:3003').origin;
const executable = process.env.CHROMIUM_PATH;
if (!executable) throw new Error('Set CHROMIUM_PATH to a Chromium or chrome-headless-shell executable. Start the production server first.');
await mkdir(resolve(out, 'media-browser-profile'), { recursive: true });
await mkdir(resolve(out, 'tmp'), { recursive: true });
await mkdir(resolve(out, 'downloads'), { recursive: true });
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
 window.qa={beats:0,calls:[],tracks:[],urls:new Map(),revoked:[],flashes:[],shots:[],ticks:[],denyAudio:false,print:0};window.print=()=>qa.print++;setInterval(()=>qa.beats++,16);
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
 const waitCount=count=>waitFor(`document.querySelector('.capture-counter strong')?.textContent.startsWith('${count}/')`,'photo '+count,90000);
 const start=async(count,timer=1,audio='off')=>{
   await cdp('Page.navigate',{url:origin+'/'});await waitFor(`!!document.querySelector('.landing-start a')`,'landing');assert(await evaluate('qa.calls.length===0'),'landing permission');
   await click('.landing-start a');await route('/camera');await choose('Photo count',String(count));await choose('Timer',timer+'s');
   if(audio!=='off'){if(audio==='denied')await evaluate('qa.denyAudio=true');await click('[aria-label=\"Live Moment Audio\"]');await waitFor("!document.querySelector('.audio-status').textContent.includes('Waiting')",'microphone');}
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
 const upload=async (count,target=count)=>{
   await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=160;c.height=200;const x=c.getContext('2d');x.fillStyle='#bf806b';x.fillRect(0,0,160,200);x.fillStyle='#334455';x.fillRect(0,0,60,100);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();for(let i=0;i<${count};i++)d.items.add(new File([b],'test'+i+'.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitCount(target);
 };

 const action=async title=>{await evaluate(`[...document.querySelectorAll('.result-action')].find(b=>b.textContent.includes(${JSON.stringify(title)})).click()`);await delay(60);};
 const results=async()=>{await click('.choose-frame');await route('/customize');await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print finished');await delay(200);assert(await evaluate(`location.pathname==='/print'&&qa.print===0`),'Print behavior');await click('.print-continuation a');await route('/results');};
 const close=()=>click('[aria-label="Close media preview"]');
 const blobData=url=>evaluate(`(async()=>{const b=qa.urls.get(${JSON.stringify(url)});return {type:b.type,size:b.size,data:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.slice(f.result.indexOf(';base64,')+8));f.readAsDataURL(b);})};})()`);
 const saveDownload=async(selector,name,expected)=>{
   await cdp('Runtime.evaluate',{expression:`document.querySelector(${JSON.stringify(selector)}).click()`,userGesture:true});let bytes;
   for(let i=0;i<100;i++){try{bytes=await readFile(out+'/downloads/'+name);if(bytes.equals(expected))break;}catch{}await delay(60);}
   assert(bytes?.equals(expected),'download bytes differ '+name+' saved='+bytes?.length+' expected='+expected.length);
 };
 await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out+'/downloads'});
 const {decode,decodeFrames}=await import('modern-gif');
 for(const count of [4,12]){
   console.log('M6 GIF',count);await start(count);
   if(count===4){
     await evaluate(`qa.previewFrames=0;const previous=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.classList.contains('live-filter-canvas'))qa.previewFrames++;return previous.apply(this,args);};`);
     for(const name of ['Classic','Chrome','Velvet','Emerald','Golden Hour','Flash 2000','Disposable','Night Flash','Mono']){
       await click('[aria-label="'+name+'"]');await waitFor(`document.querySelector('.live-filter-canvas')?.style.visibility==='visible'`,'live '+name);
       const before=await evaluate('qa.previewFrames');await delay(1100);const frames=await evaluate('qa.previewFrames')-before;assert(frames>=8,'lagging filter '+name+': '+frames);report.checks.push({filter:name,framesPer1_1Seconds:frames});
     }
     await click('[aria-label="Original"]');assert(await evaluate(`!document.querySelector('.live-filter-canvas')`),'Original preview processed');
     await waitFor(`[...document.querySelectorAll('.filter-thumbnail img')].every(i=>i.complete&&i.naturalWidth>0)`,'all ten thumbnails');
     assert(await evaluate(`document.querySelector('[aria-label="Original"] img').src.startsWith('blob:')`),'Original thumbnail not from local camera');
   }
   const colors=[],expected=[];
   for(let i=0;i<count;i++){
     const rgb=[60+i*13,150-i*6,95+i*7];colors.push(rgb);
     const preset=count===12?FILTER_PRESETS[i%10]:FILTER_PRESETS[i===0?9:0];
     await click('[aria-label="'+preset.name+'"]');
     const pixels=Uint8ClampedArray.from({length:200*240*4},(_,j)=>j%4===3?255:rgb[j%4]);processPixels(pixels,200,240,preset.id);expected.push([...pixels.slice((120*200+100)*4,(120*200+100)*4+3)]);
     await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=200;c.height=240;const x=c.getContext('2d');x.fillStyle='rgb(${rgb})';x.fillRect(0,0,200,240);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();d.items.add(new File([b],'photo.png',{type:'image/png'}));const el=document.querySelector('input[type=file]');el.files=d.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitCount(i+1);
   }
   await results();await action('Download Photo');await waitFor(`document.querySelector('.preview-note').textContent.includes('Check your downloads')`,'filtered PNG',30000);
   const pngSamples=await evaluate(`(async()=>{const b=[...qa.urls.values()].findLast(b=>b.type==='image/png'),im=await createImageBitmap(b),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const svg=document.querySelector('.results-strip svg'),box=svg.viewBox.baseVal;const samples=[...svg.querySelectorAll('clipPath[id*="-slot-"] rect')].map(r=>[...x.getImageData(Math.floor((Number(r.getAttribute('x'))+Number(r.getAttribute('width'))*.5)*c.width/box.width),Math.floor((Number(r.getAttribute('y'))+Number(r.getAttribute('height'))*.5)*c.height/box.height),1,1).data].slice(0,3));im.close();return samples;})()`);
   pngSamples.forEach((s,i)=>s.forEach((v,k)=>assert(Math.abs(v-expected[i][k])<=7,'PNG per-photo filter '+i+' '+s+' expected '+expected[i])));
   const t=Date.now(),beats=await evaluate('qa.beats');await action('Generate GIF');
   await waitFor(`!!document.querySelector('a[download="vintage-photobooth.gif"]')`,'GIF ready',90000);
   const src=await evaluate(`document.querySelector('.gif-preview').src`),blob=await blobData(src),bytes=Buffer.from(blob.data,'base64');
   const gif=decode(bytes),frames=decodeFrames(bytes);assert(frames.length===count&&gif.looped&&gif.loopCount===0,'GIF sequence/loop');
   assert(frames.every(f=>f.delay===650),'GIF timing');assert(gif.width===480&&gif.height<=640,'GIF dimensions');
   const samples=frames.map(f=>[...f.data.slice((Math.floor(f.height/2)*f.width+Math.floor(f.width/2))*4,(Math.floor(f.height/2)*f.width+Math.floor(f.width/2))*4+3)]);
   samples.forEach((s,i)=>s.forEach((v,k)=>assert(Math.abs(v-expected[i][k])<=8,'GIF order/filter '+i+' '+s+' expected '+expected[i])));
   const heartbeats=await evaluate('qa.beats')-beats;assert(heartbeats>5,'GIF blocked UI');
   await saveDownload('a[download="vintage-photobooth.gif"]','vintage-photobooth.gif',bytes);
   await writeFile(out+'/sequence-'+count+'.gif',bytes);
   report.exports.push({count,width:gif.width,height:gif.height,delay:650,bytes:bytes.length,ms:Date.now()-t,heartbeats,samples});
   for(const width of [1440,390,320]){await layout(width,844);assert(await evaluate(`(()=>{const d=document.querySelector('dialog').getBoundingClientRect();return d.x>=0&&d.right<=innerWidth&&d.bottom<=innerHeight;})()`),'modal overflow');}
   if(count===12){const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(out+'/gif-mobile.png',Buffer.from(shot.data,'base64'));}
   await close();await action('Generate GIF');assert(await evaluate(`document.querySelector('.gif-preview').src`)===src,'GIF cache miss');
   await click('.media-dialog-actions button');await waitFor(`document.querySelector('.gif-preview')?.src!==${JSON.stringify(src)}`,'regenerate');await waitFor(`!qa.urls.has(${JSON.stringify(src)})`,'obsolete GIF revoke');
   await click('.media-dialog-actions button');await close();await delay(400);await action('Generate GIF');assert(await evaluate(`!document.querySelector('.media-dialog-actions button').disabled`),'cancel stuck busy');await close();
   await action('Generate Live Moment');assert(await evaluate(`!!document.querySelector('.media-empty')&&!document.querySelector('.live-moment-video')`),'upload-only motion fallback');await close();
   await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','GIF reset cleanup');report.counts.push(count);
 }
 for(const audio of ['on','off','denied']){
   console.log('M6 Live Moment',audio);await start(4,1,audio);
   for(let i=0;i<2;i++){await click('.capture-actions button:last-child');await waitCount(i+1);}
   await assertFlash(2);await upload(2,4);await results();await action('Generate Live Moment');
   await waitFor(`document.querySelector('.live-moment-video')?.readyState>=2`,'video ready');
   const state=await evaluate(`(()=>{const v=document.querySelector('.live-moment-video');return {paused:v.paused,inline:v.playsInline,options:[...document.querySelectorAll('.moment-selector option')].map(o=>o.textContent),note:document.querySelector('.media-note').textContent,src:v.src,name:document.querySelector('dialog a[download]').download,audioCalls:qa.calls.filter(c=>c.audio).length};})()`);
   assert(state.paused&&state.inline,'unexpected autoplay or fullscreen');assert(state.options.join(',')==='Photo 1,Photo 2','mixed media selector');assert(state.note.includes(audio==='on'?'Recorded with audio':'Silent'),'audio status');assert(audio!=='off'||state.audioCalls===0,'microphone used when off');
   await cdp('Runtime.evaluate',{expression:`document.querySelector('.live-moment-video').play()`,awaitPromise:true,userGesture:true});await waitFor(`document.querySelector('.live-moment-video').currentTime>.1`,'video playback');
   const tracks=await evaluate(`(()=>{const v=document.querySelector('.live-moment-video'),s=v.captureStream();return s.getAudioTracks().length;})()`);assert(tracks===(audio==='on'?1:0),'recorded audio track mismatch '+tracks);
   const blob=await blobData(state.src),bytes=Buffer.from(blob.data,'base64');assert(blob.type.startsWith('video/webm')&&state.name.endsWith('.webm'),'actual MIME/extension');
   await saveDownload('dialog a[download]',state.name,bytes);await writeFile(out+'/live-'+audio+'.webm',bytes);
   await evaluate(`(()=>{const s=document.querySelector('.moment-selector select');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitFor(`document.querySelector('.live-moment-video')?.src!==${JSON.stringify(state.src)}`,'select next moment');assert(await evaluate(`document.querySelector('.live-moment-video').paused`),'next video autoplay');
   await layout(390,844);const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(out+'/live-'+audio+'.png',Buffer.from(shot.data,'base64'));await close();
   await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','motion cleanup');assert(await evaluate(`qa.tracks.every(t=>t.readyState==='ended')`),'live hardware track leak');report.checks.push({audio,...state,tracks,bytes:bytes.length});
 }
 assert(networkRequests.every(r=>r.method==='GET'&&(r.url.startsWith(origin+'/')||r.url.startsWith('blob:')||r.url.startsWith('data:'))),'media upload or external request');
 assert(!networkRequests.some(r=>r.url.includes('/frames/')),'custom frames used');assert(errors.length===0,'browser errors '+JSON.stringify(errors));
 console.log(JSON.stringify({exports:report.exports,checks:report.checks,layouts:report.layouts.length,errors},null,2));
} finally {await writeFile(out+'/report.json',JSON.stringify(report,null,2));browser.kill();for(const promise of pending.values())clearTimeout(promise.timer);}
