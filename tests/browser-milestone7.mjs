// Optional integration check: uses Chromium synthetic devices, never a physical camera.
// Run against npm run start -- --port 3003; set CHROMIUM_PATH to an installed executable.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import './register-typescript.mjs';

const out = resolve('.review/m7');
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
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const assert=(v,m)=>{if(!v)throw new Error(m);};
 const waitFor=async(expression,name,timeout=15000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await delay(60);}throw new Error('Timeout '+name+': '+await evaluate('document.body.innerText'));};
 const route=path=>waitFor(`location.pathname===${JSON.stringify(path)}`,path);
 const click=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await delay(60);};
 const choose=async(label,value)=>{await evaluate(`[...document.querySelectorAll('[aria-label="${label}"] button')].find(b=>b.textContent===${JSON.stringify(value)}).click()`);await delay(60);};
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Network.enable');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.qa={sounds:[],videos:[],beats:0,calls:[],tracks:[],urls:new Map(),revoked:[],flashes:[],shots:[],ticks:[],denyAudio:false,print:0};window.print=()=>qa.print++;setInterval(()=>qa.beats++,16);
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
 const start=async(count,timer=1,audio='off',sound=true)=>{
   await cdp('Page.navigate',{url:origin+'/'});await waitFor(`!!document.querySelector('.landing-start a')`,'landing');assert(await evaluate('qa.calls.length===0'),'landing permission');
   await click('.landing-start a');await route('/camera');await choose('Photo count',String(count));await choose('Timer',timer+'s');
   if(!sound)await click('[aria-label=\"Capture Sound\"]');
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
 const results=async()=>{await click('.choose-frame');await route('/customize');await click('[aria-label=\"Add heart sticker\"]');await click('.add-text');await evaluate(`(()=>{const e=document.querySelector('.editor-inspector textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'LIVE TEST');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await click('[aria-label=\"Vanilla\"]');await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print finished');await delay(200);assert(await evaluate(`location.pathname==='/print'&&qa.print===0`),'Print behavior');await click('.print-continuation a');await route('/results');};
 const close=()=>click('[aria-label="Close media preview"]');
 const blobData=url=>evaluate(`(async()=>{const b=qa.urls.get(${JSON.stringify(url)});return {type:b.type,size:b.size,data:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.slice(f.result.indexOf(';base64,')+8));f.readAsDataURL(b);})};})()`);
 const saveDownload=async(selector,name,expected)=>{
   await cdp('Runtime.evaluate',{expression:`document.querySelector(${JSON.stringify(selector)}).click()`,userGesture:true});let bytes;
   for(let i=0;i<100;i++){try{bytes=await readFile(out+'/downloads/'+name);if(bytes.equals(expected))break;}catch{}await delay(60);}
   assert(bytes?.equals(expected),'download bytes differ '+name+' saved='+bytes?.length+' expected='+expected.length);
 };
 await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out+'/downloads'});
 const textButton=async text=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)}).click()`);await delay(70);};
 const reward=async()=>{await waitFor(`document.body.innerText.includes('Complete development reward')`,'development reward');await textButton('Complete development reward');await waitFor(`!document.body.innerText.includes('Development reward —')`,'reward completion');};
 const exportVideo=async kind=>{
   await textButton(kind);await textButton('Generate '+kind);await waitFor(`!!document.querySelector('dialog a[download]')`,'export '+kind,90000);
   const info=await evaluate(`(()=>{const v=document.querySelector('dialog video'),a=document.querySelector('dialog a[download]');return {src:v.src,name:a.download,paused:v.paused,inline:v.playsInline,muted:v.muted};})()`);
   const blob=await blobData(info.src);assert(blob.type.startsWith('video/')&&blob.size>1000,'empty/invalid export');assert(info.inline&&info.paused,'audible autoplay');
   const bytes=Buffer.from(blob.data,'base64');await saveDownload('dialog a[download]',info.name,bytes);await writeFile(out+'/'+info.name,bytes);
   await cdp('Runtime.evaluate',{expression:`document.querySelector('dialog video').play()`,awaitPromise:true,userGesture:true});await waitFor(`document.querySelector('dialog video').currentTime>.15`,'generated playback');
   const decoded=await evaluate(`(()=>{const v=document.querySelector('dialog video'),s=v.captureStream(),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);return {width:v.videoWidth,height:v.videoHeight,audio:s.getAudioTracks().length,pixel:[...x.getImageData(5,Math.floor(c.height/2),1,1).data]};})()`);
   report.exports.push({kind,...info,...decoded,mime:blob.type,bytes:bytes.length});return decoded;
 };
 console.log('M7 sounds, synchronized strip, full video, reward and QR');
 await start(4,3,'on');await click('.capture-actions button:last-child');await delay(300);await click('[aria-label="Pause capture"]');await waitFor(`document.querySelector('.capture-actions button:last-child').textContent==='Resume'`,'pause countdown');await delay(1100);
 assert(await evaluate(`qa.sounds.filter(s=>s.kind==='shutter').length===0`),'shutter after pause');
 await click('.capture-actions button:last-child');await waitCount(2);await click('[aria-label="Pause capture"]');await waitFor(`document.querySelector('.capture-actions button:last-child').textContent==='Resume'`,'pause second');await upload(2,4);await assertFlash(2);
 const sounds=await evaluate('qa.sounds');assert(sounds.filter(s=>s.kind==='shutter').length===2,'shutter count '+JSON.stringify(sounds));assert(sounds.filter(s=>s.kind==='beep').length>=5,'beeps missing');assert(sounds.filter(s=>s.kind==='shutter').every(s=>s.text==='Smile!'&&s.flash),'shutter/Smile/flash sync');report.checks.push({sounds});
 await results();await action('Download Photo');await waitFor(`document.querySelector('.preview-note').textContent.includes('Check your downloads')`,'free PNG');
 await action('Generate Live Moment');await waitFor(`document.body.innerText.includes('Complete development reward')`,'reward gate');await textButton('Simulate failure');assert(await evaluate(`!document.querySelector('.video-output-tabs')`),'failed reward unlocked');await textButton('Cancel');await action('Generate Live Moment');await reward();
 await waitFor(`!!document.querySelector('.live-strip-preview canvas')`,'Live Strip preview',30000);await delay(350);
 const synchronization=await evaluate(`qa.videos.filter(v=>v.src&&v.readyState>=2&&!v.paused).map(v=>({time:v.currentTime,muted:v.muted}))`);assert(synchronization.length===2&&synchronization.every(v=>v.muted),'mixed preview or muted state');assert(Math.abs(synchronization[0].time-synchronization[1].time)<.2,'initial desync');await delay(2500);
 const syncedAgain=await evaluate(`qa.videos.filter(v=>v.src&&v.readyState>=2&&!v.paused).map(v=>v.currentTime)`);if(syncedAgain.length===2)assert(Math.abs(syncedAgain[0]-syncedAgain[1])<.2,'loop desync');
 const strip=await exportVideo('Live Strip');assert(strip.audio===0,'Live Strip mixed microphone tracks');assert(strip.height>strip.width,'strip aspect lost');assert(strip.pixel[0]>180&&strip.pixel[1]>160,'frame color lost');
 const full=await exportVideo('Full Live Moment');assert(full.audio===1,'full video lost audio');assert(full.width>full.height,'full video contains strip geometry');
 await layout(390,844);const screenshot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(out+'/full-video-mobile.png',Buffer.from(screenshot.data,'base64'));await close();
 await action('Generate GIF');await waitFor(`!!document.querySelector('.gif-preview')`,'GIF without another reward');await close();
 await action('Edit Again');await route('/customize');await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'print');await click('.print-continuation a');await route('/results');
 await action('Share via QR');await waitFor(`document.body.innerText.includes('Create 10-minute QR share')`,'QR no second reward');
 assert(!networkRequests.some(r=>r.method==='POST'&&r.url===origin+'/api/shares'),'unsolicited upload');
 await fetch('http://127.0.0.1:9006/__test/reset');await textButton('Create 10-minute QR share');await waitFor(`!!document.querySelector('.share-qr')`,'QR created',30000);
 const url=await evaluate(`document.querySelector('.share-link').href`),id=url.split('/').at(-1),shareState=await(await fetch('http://127.0.0.1:9006/__test/stats')).json();
 const row=shareState.rows.find(r=>r.id===id);assert(Date.parse(row.expires_at)-Date.parse(row.created_at)===600000,'TTL not ten minutes');assert(shareState.objects===1,'extra media uploads');
 const publicPage=await fetch(url),html=await publicPage.text();assert(publicPage.ok&&html.includes('/api/shares/'+id+'/image')&&!html.includes('storage_path'),'public route');
 const imageResponse=await fetch(origin+'/api/shares/'+id+'/image');assert(imageResponse.status===200&&imageResponse.headers.get('cache-control').includes('no-store'),'private image response');
 await fetch('http://127.0.0.1:9006/__test/advance?ms=600001');const expired=await fetch(origin+'/api/shares/'+id+'/image');assert(expired.status===410,'server served expired photo');const expiredPage=await(await fetch(url)).text();assert(expiredPage.includes('expired or is unavailable'),'expired public page');
 await close();await action('Share via QR');await textButton('Create 10-minute QR share');await waitFor(`!!document.querySelector('.share-qr')`,'new QR');const nextUrl=await evaluate(`document.querySelector('.share-link').href`);assert(nextUrl!==url,'reactivated old QR');assert((await fetch(origin+'/api/shares/'+id+'/image')).status===410,'old QR revived');await close();
 await fetch('http://127.0.0.1:9006/__test/fail?on=1');await action('Share via QR');await textButton('Create 10-minute QR share');await waitFor(`document.body.innerText.includes('Temporary sharing is unavailable')`,'network failure');await close();await fetch('http://127.0.0.1:9006/__test/fail?on=0');
 const cleanup=await fetch(origin+'/api/shares/cleanup',{method:'POST',headers:{Authorization:'Bearer fixture-cleanup-secret'}});assert(cleanup.ok,'physical cleanup');
 await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','all generated media cleanup');assert(await evaluate(`qa.videos.every(v=>!v.src||v.paused)`),'video decoder still playing');
 console.log('M7 twelve-camera Live Strip');await start(12,1,'off',false);
 for(let i=0;i<12;i++){await click('.capture-actions button:last-child');await waitCount(i+1);}
 await results();await action('Generate Live Moment');await reward();await waitFor(`!!document.querySelector('.live-strip-preview canvas')`,'twelve motion slots',30000);
 const many=await exportVideo('Live Strip');assert(many.audio===0&&many.height<=1440,'twelve-slot video');await close();await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','twelve-slot cleanup');
 for(const [timer,sound,audio] of [[1,true,'off'],[5,true,'off'],[10,true,'off'],[1,false,'denied']]){
   console.log('M7 timer',timer,'sound',sound,'audio',audio);await start(1,timer,audio,sound);await click('.capture-actions button:last-child');await waitCount(1);const events=await evaluate('qa.sounds');assert(events.filter(s=>s.kind==='beep').length===(sound?timer-1:0),'beep total '+JSON.stringify(events));assert(events.filter(s=>s.kind==='shutter').length===(sound?1:0),'shutter total');await assertFlash(1);
   if(audio==='denied'||timer===1){await results();await action('Generate Live Moment');await reward();const silent=await exportVideo('Full Live Moment');assert(silent.audio===0,'mic-denied full video audio');await close();}
 }
 await action('Take Another');await route('/camera');await waitFor('qa.urls.size===0','final reset');
 assert(!networkRequests.some(r=>r.url.includes('/frames/')),'custom frames used');
 assert(networkRequests.filter(r=>r.method==='POST').every(r=>[origin+'/api/shares',origin+'/api/reward/development'].includes(r.url)),'unexpected media upload');
 // Expected failed QR request logs a 503; all other browser errors are failures.
 const unexpected=errors.filter(e=>!(e.url===origin+'/api/shares'&&e.text?.includes('503')));assert(unexpected.length===0,'browser errors '+JSON.stringify(unexpected));
 console.log(JSON.stringify({checks:report.checks,exports:report.exports,layouts:report.layouts.length,errors},null,2));
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));browser.kill();for(const promise of pending.values())clearTimeout(promise.timer);}
