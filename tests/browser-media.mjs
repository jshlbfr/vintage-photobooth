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
const report = { counts: [], layouts: [], checks: [], timers: [], errors };
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params = {}) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Network.enable');

  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.qa={calls:[],tracks:[],blobs:new Map(),revoked:[],recordings:[],flashes:0,ticks:[],print:0,requests:[],deny:null};
    window.print=()=>qa.print++;
    const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async constraints=>{
      qa.calls.push(constraints);
      if(qa.deny==='camera'&&constraints.video||qa.deny==='audio'&&constraints.audio)throw new DOMException('QA denial','NotAllowedError');
      const stream=await gum(constraints); qa.tracks.push(...stream.getTracks()); return stream;
    };
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=blob=>{const url=create(blob);qa.blobs.set(url,blob);return url;};
    URL.revokeObjectURL=url=>{qa.revoked.push(url);qa.blobs.delete(url);revoke(url);};
    const Recorder=window.MediaRecorder;
    window.MediaRecorder=class extends Recorder{constructor(stream,options){super(stream,options);const entry={audio:stream.getAudioTracks().length,type:this.mimeType,start:performance.now(),stopped:false};qa.recordings.push(entry);this.addEventListener('stop',()=>{entry.stopped=true;entry.elapsed=performance.now()-entry.start;});}};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
      if(source instanceof HTMLVideoElement){const raw=document.createElement('canvas');raw.width=this.canvas.width;raw.height=this.canvas.height;draw.call(raw.getContext('2d'),source,...args);qa.raw=raw;qa.transform=this.getTransform().a;}
      return draw.call(this,source,...args);
    };
    const fetchOriginal=window.fetch;
    window.fetch=(...args)=>{qa.requests.push({url:String(args[0]),method:args[1]?.method||'GET',body:!!args[1]?.body});return fetchOriginal(...args);};
    document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{if(document.querySelector('.screen-flash'))qa.flashes++;const n=document.querySelector('.countdown')?.textContent;if(n&&qa.ticks.at(-1)!==n)qa.ticks.push(n);}).observe(document.body,{subtree:true,childList:true,characterData:true}));
  ` });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const waitFor = async (expression, name, timeout=12000) => {
    const start=Date.now(); while(Date.now()-start<timeout){if(await evaluate(expression))return;await delay(75);}throw new Error(`Timed out: ${name}: ${await evaluate('document.body.innerText')}`);
  };
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await delay(80); };
  const route = path => waitFor(`location.pathname===${JSON.stringify(path)}`,path);
  const photos = () => evaluate(`document.querySelectorAll('.capture-strip svg image').length`);
  const choose = async (label,value) => {await evaluate(`[...document.querySelectorAll('[aria-label="${label}"] button')].find(b=>b.textContent===${JSON.stringify(value)}).click()`);await delay(50);};
  const enable = async () => {await click('.camera-empty button');await waitFor(`document.querySelector('video')?.readyState>=2&&!document.querySelector('.camera-empty')`,'camera ready');};
  const shot = async (number,timer=3) => {
    await evaluate('qa.ticks=[];qa.flashes=0');
    const start=Date.now();await click('.capture-actions button:last-child');
    assert(await evaluate(`document.querySelector('.capture-actions button:last-child').disabled`),'duplicate capture enabled');
    await waitFor(`document.querySelectorAll('.capture-strip svg image').length===${number}`,'capture '+number,20000);
    const elapsed=Date.now()-start;assert(elapsed>=timer*1000&&elapsed<timer*1000+6000,'countdown timing '+elapsed);
    const data=await evaluate(`({ticks:qa.ticks,flashes:qa.flashes,recording:qa.recordings.at(-1),transform:qa.transform,blobs:[...qa.blobs.values()].map(b=>({type:b.type,size:b.size}))})`);
    assert(data.blobs.some(b=>b.type==='image/jpeg'&&b.size>1000),'no actual still blob');
    report.timers.push({timer,elapsed,...data});return data;
  };
  const layout = async (width, screenshot=false) => {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1024,deviceScaleFactor:1,mobile:false});await delay(120);
    const data=await evaluate(`({route:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,customFrames:performance.getEntriesByType('resource').some(e=>decodeURIComponent(e.name).includes('/frames/'))})`);
    assert(data.scrollWidth<=width&&!data.customFrames,'layout '+JSON.stringify(data));report.layouts.push(data);
    if(screenshot){const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(out+'/m3-'+data.route.slice(1)+'-'+width+'.png',Buffer.from(image.data,'base64'));}
  };
  const mirrorCheck = async mirrored => {
    const result=await evaluate(`(async()=>{const src=document.querySelector('.capture-strip svg image:last-of-type').getAttribute('href');const b=qa.blobs.get(src),image=await createImageBitmap(b),c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const actual=ctx.getImageData(0,0,c.width,c.height).data,raw=qa.raw.getContext('2d').getImageData(0,0,c.width,c.height).data;let normal=0,flipped=0,n=0;for(let y=0;y<c.height;y+=13)for(let x=0;x<c.width;x+=11)for(let ch=0;ch<3;ch++){const i=(y*c.width+x)*4+ch,j=(y*c.width+c.width-1-x)*4+ch;normal+=Math.abs(actual[i]-raw[i]);flipped+=Math.abs(actual[i]-raw[j]);n++;}image.close();return {normal:normal/n,flipped:flipped/n,width:c.width,height:c.height,preview:document.querySelector('video').getBoundingClientRect().width};})()`);
    assert(result.width>result.preview,'captured CSS resolution');
    assert(mirrored?result.flipped<result.normal&&result.flipped<4:result.normal<result.flipped&&result.normal<4,'mirror pixels '+JSON.stringify(result));
    report.checks.push({mirror:mirrored,...result});
  };
  await cdp('Page.navigate',{url:origin+'/'});await waitFor(`!!document.querySelector('.landing-start a')`,'landing');
  assert(await evaluate('qa.calls.length===0'),'landing requested camera');
  await click('.landing-start a');await route('/camera');
  for(const count of [1,2,4,6]){
    console.log('Camera session',count);
    await choose('Photo count',String(count));await enable();
    if(count===1){await click('.audio-option button');await waitFor(`document.querySelector('.audio-option').textContent.includes('Audio on')`,'audio ready');}
    if(count===2){await evaluate(`qa.deny='audio'`);await click('.audio-option button');await waitFor(`document.querySelector('.audio-option').textContent.includes('blocked')`,'audio denial');}
    if(count===2)await click('[aria-label="Mirror Camera"]');
    await layout(1440,count===4);await layout(390,count===4);await layout(320);await layout(768);await layout(1440);
    await click('.setup-continue');await route('/capture');
    assert(await photos()===0,'Continue created mock captures');
    assert(await evaluate(`document.querySelector('.choose-frame').disabled`),'Choose Frame prematurely enabled');
    assert(await evaluate(`document.querySelector('[aria-label="Switch camera"]').disabled`),'single camera switch enabled');
    for(let i=1;i<=count;i++){
      const data=await shot(i);assert(data.flashes>0&&JSON.stringify(data.ticks)===JSON.stringify(['3','2','1']),'flash/countdown presentation');
      if(count===1)assert(data.recording.audio===1&&data.recording.stopped,'audio motion missing');
      if(count===2)assert(data.recording.audio===0&&data.recording.stopped,'denied mic prevented silent recording');
      if(i===1&&count<=2)await mirrorCheck(count===1);
    }
    assert(await evaluate(`location.pathname==='/capture'&&document.querySelector('.capture-counter strong').textContent==='${count}/${count}'&&document.querySelector('.capture-actions button:last-child').disabled`),'completion behavior');
    await layout(1440,count===4);await layout(390,count===4);await layout(320);await layout(768);await layout(1440);
    const sources=await evaluate(`[...document.querySelectorAll('.capture-strip svg image')].map(i=>i.getAttribute('href'))`);
    await click('.choose-frame');await route('/customize');await delay(100);
    assert(await evaluate(`qa.tracks.every(t=>t.readyState==='ended')`),'tracks live on Customize');
    assert(await evaluate(`document.querySelectorAll('.customize-preview svg image').length===${count}`),'Customize count');
    await click('[aria-label="Vanilla"]');
    for(let i=0;i<9;i++){
      const geometry=await evaluate(`(()=>{const a=document.querySelector('.customize-preview').getBoundingClientRect(),b=document.querySelector('.customize-preview svg > rect').getBoundingClientRect(),foot=['.frame-selection','.add-text','.print-action'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.y+r.height/2;});return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2),foot,filter:getComputedStyle(document.querySelector('.customize-preview svg')).filter};})()`);
      assert(geometry.dx<1&&geometry.dy<1&&Math.max(...geometry.foot)-Math.min(...geometry.foot)<1&&geometry.filter.includes('drop-shadow'),'Customize geometry '+JSON.stringify(geometry));
      await click('[aria-label="Next frame"]');
    }
    await layout(1440,count===4);await layout(390,count===4);await layout(320);await layout(768);await layout(1440);
    await click('.print-action');await route('/print');
    assert(await evaluate(`!document.querySelector('.print-continuation a')`),'Print button shown too early');
    await waitFor(`!!document.querySelector('.print-continuation a')`,'Print completed');await delay(2300);
    assert(await evaluate(`location.pathname==='/print'&&qa.print===0`),'Print auto navigated');
    await layout(390,count===4);await layout(1440,count===4);
    await click('.print-continuation a');await route('/results');
    assert(JSON.stringify(await evaluate(`[...document.querySelectorAll('.results-strip svg image')].map(i=>i.getAttribute('href'))`))===JSON.stringify(sources),'Results images changed');
    await layout(1440,count===4);await layout(390,count===4);await layout(320);await layout(768);
    const calls=await evaluate('qa.calls.length');
    await click('a[href="/customize"].result-action');await route('/customize');
    assert(await evaluate(`qa.calls.length===${calls}&&qa.tracks.every(t=>t.readyState==='ended')`),'Edit Again accessed hardware');
    await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'Print');await click('.print-continuation a');await route('/results');
    await click('a[href="/camera"].result-action');await route('/camera');
    assert(await evaluate(`qa.blobs.size===0&&qa.tracks.every(t=>t.readyState==='ended')`),'Take Another resource leak');
    report.counts.push(count);
  }
  // Timers, flash off, reduced motion, recorder fallback, restart, cancellation.
  await choose('Photo count','1');await choose('Timer','5s');await enable();await click('.setup-continue');await route('/capture');
  await click('[aria-label="Screen flash"]');const five=await shot(1,5);assert(five.flashes===0,'disabled flash fired');
  await click('.capture-feedback button');assert(await photos()===0&&await evaluate('qa.blobs.size===0'),'restart leak');
  await click('.capture-counter .back-link');await route('/camera');await choose('Timer','10s');await click('.setup-continue');await route('/capture');
  await evaluate('window.MediaRecorder=undefined');await shot(1,10);assert(await evaluate(`document.querySelector('.capture-feedback').textContent.includes('unavailable')`),'recorder fallback message');
  await click('.capture-feedback button');await click('.capture-actions button:last-child');await delay(150);await click('.capture-counter .back-link');await route('/camera');await delay(500);
  assert(await evaluate(`qa.blobs.size===0`),'navigation saved stale capture');
  await click('.setup-panel .back-link');await route('/');assert(await evaluate(`qa.tracks.every(t=>t.readyState==='ended')`),'landing camera active');
  await click('.landing-start a');await route('/camera');await evaluate(`qa.deny='camera'`);await click('.camera-empty button');await waitFor(`document.querySelector('.camera-empty').textContent.includes('blocked')`,'camera denial');
  await choose('Photo count','2');await click('.setup-continue');await route('/capture');
  const upload = async expression => {await evaluate(`(()=>{const input=document.querySelector('input[type=file]'),dt=new DataTransfer();for(const f of ${expression})dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(150);};
  await upload(`[new File(['bad'],'bad.txt',{type:'text/plain'})]`);assert(await photos()===0,'invalid upload accepted');
  await upload(`[new File(['bad'],'bad.png',{type:'image/png'})]`);await waitFor(`document.querySelector('.capture-feedback').textContent.includes('could not be opened')`,'decode error');
  await upload(`[new File([new Uint8Array(51*1024*1024)],'huge.png',{type:'image/png'})]`);assert(await photos()===0,'oversize accepted');
  await evaluate(`(async()=>{window.qaUpload=await new Promise(r=>{const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');x.fillStyle='#d93d52';x.fillRect(0,0,128,256);c.toBlob(r,'image/png');});})()`);
  await upload(`[1,2,3].map(i=>new File([qaUpload],'photo'+i+'.png',{type:'image/png'}))`);await waitFor(`document.querySelectorAll('.capture-strip svg image').length===2`,'uploads');
  assert(await evaluate(`[...qa.blobs.values()].every(b=>b.type==='image/jpeg')`),'upload generated fake motion');
  await click('.choose-frame');await route('/customize');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await click('.print-action');await route('/print');await waitFor(`!!document.querySelector('.print-continuation a')`,'reduced print');await delay(2000);
  assert(await evaluate(`location.pathname==='/print'&&getComputedStyle(document.querySelector('.print-output svg')).animationName==='none'`),'reduced motion flow');
  const privacy=await evaluate(`({print:qa.print,requests:qa.requests.filter(r=>r.method!=='GET'||r.body),external:performance.getEntriesByType('resource').filter(e=>!e.name.startsWith(location.origin)&&!e.name.startsWith('blob:')).map(e=>e.name)})`);
  assert(!privacy.print&&!privacy.requests.length&&!privacy.external.length,'privacy '+JSON.stringify(privacy));
  report.privacy={...privacy,networkRequests};
  assert(networkRequests.every(r=>r.method==='GET'&&(r.url.startsWith(origin+'/')||r.url.startsWith('blob:')||r.url.startsWith('data:'))),'Unexpected network request');
  report.checks.push('restart releases still/motion URLs','navigation cancels countdown','audio allowed and denied','camera denied upload recovery','unsupported/corrupt/oversized upload','upload count cap and no fake motion','reduced motion print waits','no system print or media network requests');
  for(const path of ['/capture','/customize','/print','/results']){await cdp('Page.navigate',{url:origin+path});await route('/camera');await waitFor(`!!document.querySelector('#camera-device')`,'fallback');assert(await evaluate('qa.calls.length===0'),'direct route permissions');}
  await writeFile(out+'/m3-report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({counts:report.counts,layouts:report.layouts.length,timers:report.timers.map(t=>({seconds:t.timer,elapsed:t.elapsed})),checks:report.checks,errors},null,2));
  if(errors.length)process.exitCode=1;
} finally { await writeFile(out+'/m3-report.json',JSON.stringify(report,null,2)); browser.kill(); for(const promise of pending.values())clearTimeout(promise.timer); }
