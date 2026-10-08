// Optional integration check: uses Chromium synthetic devices, never a physical camera.
// Run against npm run start -- --port 3003; set CHROMIUM_PATH to an installed executable.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import './register-typescript.mjs';

const out = resolve('.review/m95');
const origin = new URL(process.env.PHOTOBOOTH_URL ?? 'http://127.0.0.1:3004').origin;
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
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const assert=(v,m)=>{if(!v)throw new Error(m);};
 const waitFor=async(expression,name,timeout=15000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await delay(60);}throw new Error('Timeout '+name+': '+await evaluate('document.body.innerText'));};
 const route=path=>waitFor(`location.pathname===${JSON.stringify(path)}`,path);
 const click=async selector=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(e instanceof HTMLElement)e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));})()`);await delay(60);};
 const choose=async(label,value)=>{await evaluate(`[...document.querySelectorAll('[aria-label="${label}"] button')].find(b=>b.textContent===${JSON.stringify(value)}).click()`);await delay(60);};
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Network.enable');
 await cdp('Network.setBlockedURLs',{urls:['*googlesyndication.com*','*doubleclick.net*']});
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.qa={recorders:[],stages:[],sounds:[],videos:[],beats:0,calls:[],tracks:[],urls:new Map(),revoked:[],flashes:[],shots:[],ticks:[],denyAudio:false,print:0};window.print=()=>qa.print++;setInterval(()=>qa.beats++,16);
 const NativeRecorder=window.MediaRecorder;window.MediaRecorder=class extends NativeRecorder{constructor(...args){super(...args);const entry={at:performance.now(),starts:0,stops:0,pauses:0,resumes:0,bytes:0,audio:args[0].getAudioTracks().length};qa.recorders.push(entry);for(const name of ['start','stop','pause','resume']){const original=this[name].bind(this);this[name]=(...values)=>{entry[{start:'starts',stop:'stops',pause:'pauses',resume:'resumes'}[name]]++;if(name==='stop')entry.end=performance.now();return original(...values);};}this.addEventListener('dataavailable',e=>entry.bytes+=e.data.size);}};
 const makeElement=document.createElement.bind(document);document.createElement=function(tag,...args){const el=makeElement(tag,...args);if(tag==='video')qa.videos.push(el);return el;};
 const soundStart=AudioScheduledSourceNode.prototype.start;AudioScheduledSourceNode.prototype.start=function(...args){qa.sounds.push({kind:this instanceof OscillatorNode?'beep':'shutter',at:performance.now(),text:document.querySelector('.countdown')?.textContent,flash:!!document.querySelector('.screen-flash')});return soundStart.apply(this,args);};
 const bufferStart=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){qa.sounds.push({kind:'shutter',at:performance.now(),text:document.querySelector('.countdown')?.textContent,flash:!!document.querySelector('.screen-flash')});return bufferStart.apply(this,args);};
 const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
 navigator.mediaDevices.getUserMedia=async c=>{qa.calls.push(c);if(c.audio&&qa.denyAudio)throw new DOMException('Denied','NotAllowedError');const s=await gum(c);qa.tracks.push(...s.getTracks());return s;};
 const make=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=make(b);qa.urls.set(u,b);return u;};URL.revokeObjectURL=u=>{qa.urls.delete(u);qa.revoked.push(u);revoke(u);};
 const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(source instanceof HTMLVideoElement&&this.canvas.width>1000){qa.shots.push({at:performance.now(),flash:!!document.querySelector('.screen-flash'),width:this.canvas.width,filter:document.querySelector('.filter-option[aria-pressed=true]')?.getAttribute('aria-label')});}return draw.call(this,source,...args);};
 document.addEventListener('DOMContentLoaded',()=>new MutationObserver(records=>{
   for(const r of records){for(const node of r.addedNodes){if(node.nodeType===1&&node.matches('.screen-flash')){const s=getComputedStyle(node),b=node.getBoundingClientRect();qa.flashes.push({at:performance.now(),color:s.backgroundColor,opacity:s.opacity,z:s.zIndex,position:s.position,pointer:s.pointerEvents,x:b.x,y:b.y,w:b.width,h:b.height,vw:innerWidth,vh:innerHeight,parent:node.parentElement.tagName});}}
   for(const node of r.removedNodes){if(node.nodeType===1&&node.matches('.screen-flash')){qa.flashes.at(-1).duration=performance.now()-qa.flashes.at(-1).at;}}}
   const n=document.querySelector('.countdown')?.textContent;if(n&&qa.lastStage!==n){qa.ticks.push(n);qa.stages.push({text:n,at:performance.now()});}qa.lastStage=n;
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
 const start=async(count,timer=1,audio='off',sound=true)=>{
   await cdp('Page.navigate',{url:origin+'/'});await waitFor(`!!document.querySelector('.landing-start a')`,'landing');assert(await evaluate('qa.calls.length===0'),'landing permission');
   await click('.landing-start a');await route('/camera');await choose('Photo count',String(count));await choose('Timer',timer+'s');
   if(!sound)await click('[aria-label=\"Capture Sound\"]');
   if(audio!=='off'){if(audio==='denied')await evaluate('qa.denyAudio=true');await click('[aria-label=\"Live Moment Audio\"]');await waitFor("!document.querySelector('.audio-status').textContent.includes('Waiting')",'microphone');}
   await click('.camera-empty button');await waitFor(`document.querySelector('video')?.readyState>=2&&!document.querySelector('.camera-empty')`,'camera');
   if(audio==='on')await waitFor(`qa.tracks.some(t=>t.kind==='audio'&&t.readyState==='live')`,'microphone track ready');
   assert(await evaluate(`getComputedStyle(document.querySelector('video')).filter==='none'&&!document.querySelector('.live-filter-canvas')`),'Original has processing');
   await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
   await click('.setup-continue');await route('/capture');await waitFor(`document.querySelectorAll('.filter-thumbnail img').length===10`,'filter thumbnails');
   assert(await evaluate(`document.querySelector('[aria-label="Original"]').getAttribute('aria-pressed')==='true'`),'Original default');
   await center('.capture-strip');await layout(1440,1024,count===8);await layout(1366,768);await layout(390,844,count===8);await layout(1440);
 };
 const action=async title=>{await evaluate(`[...document.querySelectorAll('.result-action')].find(b=>b.textContent.includes(${JSON.stringify(title)})).click()`);await delay(60);};
 const close=()=>click('[aria-label="Close media preview"]');
 const blobData=url=>evaluate(`(async()=>{const b=qa.urls.get(${JSON.stringify(url)});return {type:b.type,size:b.size,data:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.slice(f.result.indexOf(';base64,')+8));f.readAsDataURL(b);})};})()`);
 const saveDownload=async(selector,name,expected)=>{
   await unlink(out+'/downloads/'+name).catch(()=>{});
   await cdp('Runtime.evaluate',{expression:`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(e instanceof HTMLElement)e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));})()`,userGesture:true});let bytes;
   for(let i=0;i<100;i++){try{bytes=await readFile(out+'/downloads/'+name);if(bytes.equals(expected))break;}catch{}await delay(60);}
   assert(bytes?.equals(expected),'download bytes differ '+name+' saved='+bytes?.length+' expected='+expected.length);
 };
 await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out+'/downloads'});
 const textButton=async text=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)}).click()`);await delay(70);};
 const reward=async()=>{await waitFor(`document.body.innerText.includes('Complete development reward')`,'development reward');await textButton('Complete development reward');await waitFor(`!document.body.innerText.includes('Development reward —')`,'reward completion');};
 const exportVideo=async kind=>{
   await textButton(kind);await textButton('Generate '+kind);await waitFor(`!!document.querySelector('dialog a[download]')`,'export '+kind,220000);
   const info=await evaluate(`(()=>{const v=document.querySelector('dialog video'),a=document.querySelector('dialog a[download]');return {src:v.src,name:a.download,paused:v.paused,inline:v.playsInline,muted:v.muted};})()`);
   const blob=await blobData(info.src);assert(blob.type.startsWith('video/')&&blob.size>1000,'empty/invalid export');assert(info.inline&&info.paused,'audible autoplay');
   const bytes=Buffer.from(blob.data,'base64');await saveDownload('dialog a[download]',info.name,bytes);await writeFile(out+'/'+info.name,bytes);
   await cdp('Runtime.evaluate',{expression:`document.querySelector('dialog video').play()`,awaitPromise:true,userGesture:true});await waitFor(`document.querySelector('dialog video').currentTime>.15`,'generated playback');
   const decoded=await evaluate(`(()=>{const v=document.querySelector('dialog video'),s=v.captureStream(),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);return {width:v.videoWidth,height:v.videoHeight,audio:s.getAudioTracks().length,photoPixel:[...x.getImageData(Math.floor(c.width*.5),Math.floor(c.height*.16),1,1).data],pixel:[...x.getImageData(5,Math.floor(c.height/2),1,1).data]};})()`);
   report.exports.push({kind,...info,...decoded,mime:blob.type,bytes:bytes.length});return decoded;
 };
 const idle=()=>waitFor(`!document.querySelector('.capture-actions button:last-child').disabled&&!document.querySelector('[aria-label="Pause capture"]')||!!document.querySelector('a.choose-frame')`,'capture settled',15000);
 const checkTimeline=async(timer,count,{manual=false,flash=true}={})=>{
   await idle();await delay(150);
   const q=await evaluate(`({recorders:qa.recorders,stages:qa.stages,sounds:qa.sounds,shots:qa.shots,flashes:qa.flashes,urls:[...qa.urls.values()].filter(b=>b.type.startsWith('video/')).map(b=>({bytes:b.size,mime:b.type}))})`);
   assert(q.recorders.length===1,'multiple capture recorders '+JSON.stringify(q.recorders));
   assert(q.recorders[0].starts===1&&q.recorders[0].stops===1,'recorder restarted/stopped between photos');
   assert(q.urls.length===1,'duplicate source blobs '+JSON.stringify(q.urls));
   assert(q.shots.length===count,'missing stills');
   const smiles=q.stages.filter(s=>s.text==='Smile!');assert(smiles.length===count,'Smile stages '+JSON.stringify(q.stages));
   for(let i=0;i<count;i++){
     const shutter=q.sounds.filter(s=>s.kind==='shutter')[i];assert(shutter.at-smiles[i].at>=940,'Smile was not a full second '+JSON.stringify({shutter,smile:smiles[i]}));
     assert(q.shots[i].at>=shutter.at,'still before shutter');
   }
   assert(!q.stages.some(s=>s.text==='1'),'numeric one displayed');assert(q.sounds.filter(s=>s.kind==='beep').length===count*timer,'wrong beep count');
   assert(q.flashes.length===(flash?count:0),'flash count');
   if(!manual){assert(q.recorders[0].pauses===1,'recorder paused between automatic cycles');const duration=q.recorders[0].end-q.recorders[0].at;assert(duration>=timer*count*1000&&duration<timer*count*1000+count*600+2000,'session duration '+duration);}
   report.checks.push({timer,count,...q});console.log('PASS timeline',timer,count,'source bytes',q.urls[0].bytes);
 };
 const captureSession=async(timer,count,options={})=>{
   await start(count,timer,options.audio??'off');if(options.filter)await click('[aria-label="'+options.filter+'"]');if(options.flash===false)await click('[aria-label="Screen flash"]');
   if(timer===1){for(let i=0;i<count;i++){await click('.capture-actions button:last-child');await waitCount(i+1);await idle();}}
   else {await click('.capture-actions button:last-child');await waitFor(`document.querySelector('.capture-counter strong')?.textContent==='${count}/${count}'`,'all photos',timer*count*1000+20000);}
   await checkTimeline(timer,count,{manual:timer===1,flash:options.flash!==false});
 };

 console.log('M9.5 photo adjustments');
 await captureSession(1,4);
 const timeline=await evaluate('({sounds:qa.sounds,flashes:qa.flashes,shots:qa.shots})');
 for(let i=0;i<4;i++){
  assert(timeline.sounds.filter(s=>s.kind==='beep')[i].text==='Smile!','Smile beep missing');
  assert(timeline.shots[i].at-timeline.flashes[i].at>=150,'flash lead too short');
  assert(timeline.flashes[i].duration>=470,'flash removed early');
 }
 await click('.choose-frame');await route('/customize');
 const photoSelector=i=>`.customize-preview [aria-label="Adjust photo ${i}"]`;
 const photoGeometry=()=>evaluate(`[...document.querySelectorAll('.customize-preview image[data-filter]')].map(e=>['x','y','width','height'].map(a=>Number(e.getAttribute(a))))`);
 const zoom=async value=>{await evaluate(`(()=>{const e=document.querySelector('[aria-label="Photo zoom"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${value});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(60);await evaluate(`document.querySelector('[aria-label="Photo zoom"]').dispatchEvent(new Event('pointerup',{bubbles:true}))`);await delay(60);};
 const drag=async(index,dx,dy,touch=false)=>{
  const b=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(photoSelector(index))});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  if(touch){await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...b,id:0}]});for(let i=1;i<=5;i++)await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+dx*i/5,y:b.y+dy*i/5,id:0}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else {await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...b});await delay(40);await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...b,button:'left',clickCount:1});for(let i=1;i<=5;i++)await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+dx*i/5,y:b.y+dy*i/5,buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+dx,y:b.y+dy,button:'left',clickCount:1});}await delay(120);
 };
 await evaluate(`qa.pointerEvents=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{qa.pointerEvents.push({type,target:e.target.getAttribute('aria-label'),button:e.button,buttons:e.buttons,x:e.clientX,y:e.clientY});},true);`);
 const baseline=await photoGeometry();await click(photoSelector(1));await zoom(1.7);const zoomed=await photoGeometry();
 assert(zoomed[0][2]>baseline[0][2]&&JSON.stringify(zoomed.slice(1))===JSON.stringify(baseline.slice(1)),'zoom independence');
 await drag(1,20,-12);const moved=await photoGeometry();assert(JSON.stringify(moved[0])!==JSON.stringify(zoomed[0]),'drag did not move '+JSON.stringify({baseline,zoomed,moved,diag:await evaluate(`(()=>{const e=document.querySelector('[aria-label="Adjust photo 1"]'),r=e.getBoundingClientRect();return {events:qa.pointerEvents,pressed:e.getAttribute('aria-pressed'),rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML}})()`)}));
 await click('[aria-label="Undo"]');assert(JSON.stringify(await photoGeometry())===JSON.stringify(zoomed),'one drag one undo');
 await click('[aria-label="Redo"]');assert(JSON.stringify(await photoGeometry())===JSON.stringify(moved),'redo');
 await click(photoSelector(1));await textButton('Reset Photo');assert(JSON.stringify(await photoGeometry())===JSON.stringify(baseline),'reset photo');
 for(let i=1;i<=4;i++){await click(photoSelector(i));await zoom(1+i*.15);await drag(i,8,-5);}
 await textButton('Done');for(let i=0;i<9;i++)await click('[aria-label="Next frame"]');
 await click(photoSelector(1));await zoom(2);await drag(1,10,10);await textButton('Done');
 assert(await evaluate(`document.querySelector('.photo-adjust-help')?.textContent.includes('zoom slider')`),'adjustment guidance missing');
 assert(await evaluate(`document.querySelectorAll('.frame-picker image,.frame-picker img').length===0&&document.querySelector('.frame-outline > rect').getAttribute('fill')==='#000000'`),'selector must be an empty black frame');
 const frameA=await photoGeometry();await click('[aria-label="Next frame"]');await click('[aria-label="Previous frame"]');assert(JSON.stringify(await photoGeometry())===JSON.stringify(frameA),'frame switch discarded adjustments');
 await click('[aria-label="Add heart sticker"]');await textButton('Done');assert(JSON.stringify(await photoGeometry())===JSON.stringify(frameA),'sticker changed photo');
 for(const width of [320,390,768,844,1366,1440]){await layout(width,width===844?390:1024,true);const aligned=await evaluate(`(()=>{const p=document.querySelector('.customize-panel').getBoundingClientRect(),h=document.querySelector('.customize-heading').getBoundingClientRect(),a=document.querySelector('.frame-picker').getBoundingClientRect(),b=document.querySelector('.customize-tools').getBoundingClientRect();const center=innerWidth>800?(a.left+b.right)/2:p.x+p.width/2;return Math.abs(center-h.x-h.width/2)})()`);assert(aligned<1,'heading off center '+width);const buttons=await evaluate(`(()=>{const a=document.querySelector('.add-text').getBoundingClientRect(),b=document.querySelector('.print-action').getBoundingClientRect();return {width:Math.abs(a.width-b.width),height:Math.abs(a.height-b.height),y:Math.abs(a.y-b.y)}})()`);assert(buttons.width<1&&buttons.height<1&&(width<=800||buttons.y<1),'action buttons mismatch '+JSON.stringify(buttons));}
 if(!process.env.M95_LAYOUT_ONLY){
 await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await layout(390,844);await click(photoSelector(1));const beforeTouch=await photoGeometry();await drag(1,-12,10,true);assert(JSON.stringify(await photoGeometry())!==JSON.stringify(beforeTouch),'touch drag');await textButton('Done');await layout(1440);
 // Rasterize the actual SVG preview at export size; compare pixels with downloaded PNG.
 await evaluate(`(async()=>{window.qa.expected=document.querySelector('.customize-preview svg').cloneNode(true);qa.expected.querySelector('.editor-layer').remove();for(const e of qa.expected.querySelectorAll('image')){const b=await (await fetch(e.getAttribute('href'))).blob();e.setAttribute('href',await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)}));}})()`);
 const saved=await photoGeometry();await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');assert(await evaluate(`document.querySelector('.printing-panel .doodle').getAttribute('src').includes('hearts')`),'print hearts');await click('.print-continuation a');await route('/results');await action('Download Photo');await waitFor(`document.querySelector('.preview-note').textContent.includes('Check your downloads')`,'PNG');
 const pixels=await evaluate(`(async()=>{const blob=[...qa.urls.values()].find(b=>b.type==='image/png');const im=await createImageBitmap(blob);const actual=document.createElement('canvas');actual.width=im.width;actual.height=im.height;const ac=actual.getContext('2d');ac.drawImage(im,0,0);im.close();const svg=qa.expected;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width',actual.width);svg.setAttribute('height',actual.height);svg.removeAttribute('class');for(const e of svg.querySelectorAll('image')){const b=await (await fetch(e.getAttribute('href'))).blob();e.setAttribute('href',await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)}));}const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));await image.decode();const expected=document.createElement('canvas');expected.width=actual.width;expected.height=actual.height;const ec=expected.getContext('2d');ec.drawImage(image,0,0);let total=0,n=0;for(let y=120;y<actual.height-120;y+=37)for(let x=180;x<actual.width-180;x+=31){const a=ac.getImageData(x,y,1,1).data,b=ec.getImageData(x,y,1,1).data;if(a[3]<250||b[3]<250)continue;for(let c=0;c<3;c++){total+=Math.abs(a[c]-b[c]);n++;}}return {width:actual.width,height:actual.height,meanError:total/n};})()`);
 assert(pixels.width>=1000&&pixels.meanError<9,'PNG differs from SVG '+JSON.stringify(pixels));report.checks.push({pngComparison:pixels});
 console.log('PASS editor and PNG',JSON.stringify(pixels));await action('Generate Live Moment');await reward();await waitFor(`!!document.querySelector('.live-strip-preview canvas')`,'live preview',30000);await exportVideo('Live Strip');await close();
 await action('Generate GIF');await waitFor(`!!document.querySelector('dialog img')`,'GIF',30000);await close();
 console.log('PASS GIF and Live Strip');await action('Edit Again');await route('/customize');await waitFor(`document.querySelectorAll('.customize-preview image[data-filter]').length===4`,'restored photos');assert(JSON.stringify(await photoGeometry())===JSON.stringify(saved),'Edit Again lost transforms');
 await click('.back-link');await route('/capture');await textButton('Restart');await waitCount(0);await click('.camera-empty button');await waitFor(`document.querySelector('video')?.readyState>=2&&!document.querySelector('.camera-empty')`,'camera after restart');await click('.capture-actions button:last-child');await waitCount(1);await idle();
 // Fill remaining slots with portrait/landscape uploads.
 await evaluate(`(async()=>{const d=new DataTransfer();for(let i=0;i<3;i++){const c=document.createElement('canvas');c.width=i%2?1600:900;c.height=i%2?900:1600;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,'#d04020');g.addColorStop(.5,'#20a070');g.addColorStop(1,'#3040d0');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);d.items.add(new File([await new Promise(r=>c.toBlob(r,'image/png'))],'source'+i+'.png',{type:'image/png'}));}const e=document.querySelector('input[type=file]');e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await waitCount(4);await click('.choose-frame');await route('/customize');assert(await evaluate(`document.querySelectorAll('[data-decoration-id]').length===0`),'restart stickers');
 for(let i=1;i<=4;i++){await click(photoSelector(i));assert(await evaluate(`Number(document.querySelector('[aria-label="Photo zoom"]').value)===1`),'restart crop');await zoom(4);await drag(i,200,-200);await textButton('Reset Photo');}
 await textButton('Done');await click('.print-action');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');await click('.print-continuation a');await route('/results');await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','session release');
 console.log('PASS restart, uploads, zoom boundaries and Take Another');await captureSession(3,8);await click('.choose-frame');await route('/customize');await click(photoSelector(8));await zoom(1.8);await drag(8,10,-5);await textButton('Done');await layout(390,844);await layout(1440);
 await captureSession(3,12);await captureSession(1,1,{flash:false});
 await start(1,1,'off',false);await click('.capture-actions button:last-child');await waitCount(1);await idle();assert(await evaluate('qa.sounds.length===0'),'sound toggle');
 await cdp('Page.navigate',{url:origin+'/faq'});await waitFor(`!!document.querySelector('summary')`,'FAQ');await evaluate(`document.querySelectorAll('summary')[0].click();document.querySelectorAll('summary')[1].click()`);assert(await evaluate(`document.querySelectorAll('details[open]').length===1`),'exclusive FAQ');await evaluate(`document.querySelectorAll('summary')[1].click()`);assert(await evaluate(`!document.querySelector('details[open]')`),'FAQ close');
 assert(!errors.length,'browser errors '+JSON.stringify(errors));console.log('M9.5 PASS',JSON.stringify({checks:report.checks.length,pixels,layouts:report.layouts.length,exports:report.exports}));
 }else{assert(!errors.length,'browser errors '+JSON.stringify(errors));console.log('M9.5 layout PASS',report.layouts.length);}
}finally{await writeFile(out+(process.env.M95_LAYOUT_ONLY?'/layout-report.json':'/report.json'),JSON.stringify(report,null,2));browser.kill();for(const promise of pending.values())clearTimeout(promise.timer);}
