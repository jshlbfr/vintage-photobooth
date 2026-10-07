// Optional integration check: uses Chromium synthetic devices, never a physical camera.
// Run against npm run start -- --port 3003; set CHROMIUM_PATH to an installed executable.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve('.review/m9');
const origin = new URL(process.env.PHOTOBOOTH_URL ?? 'http://127.0.0.1:3004').origin;
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
    if (message.method === 'Fetch.requestPaused') void send('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from('window.__m9AdLoaded = true;').toString('base64')},message.sessionId);
    if (message.method === 'Network.requestWillBeSent') networkRequests.push({url:message.params.request.url,method:message.params.request.method});
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error' && !/googlesyndication\.com|doubleclick\.net/.test(message.params.entry.url??'')) errors.push(message.params.entry);
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
const report={layouts:[],checks:[],errors};
try {
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const cdp=(method,params={})=>send(method,params,sessionId);
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const assert=(v,m)=>{if(!v)throw Error(m);};
 const waitFor=async expression=>{const start=Date.now();while(Date.now()-start<15000){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
 // Fulfill the Google loader locally. No real advertisements, requests or clicks.
 await cdp('Fetch.enable',{patterns:[{urlPattern:'*googlesyndication.com*'},{urlPattern:'*doubleclick.net*'}]});
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:"window.__m9PermissionCalls=0;const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...a)=>{window.__m9PermissionCalls++;return gum(...a);};"});
 const pages=['/','/how-it-works','/features','/faq','/privacy','/terms'];
 for(const path of pages){
  await cdp('Page.navigate',{url:origin+path});await waitFor(`document.querySelector('.site-footer')!==null && location.pathname===${JSON.stringify(path)}`);await delay(400);
  assert(await evaluate('document.querySelectorAll("h1").length===1'),path+' one H1');
  assert(await evaluate('window.__m9PermissionCalls===0'),path+' no device permissions');
  if(!['/privacy','/terms'].includes(path))await waitFor('!!window.__m9AdLoaded');
  const ads=await evaluate('!!window.__m9AdLoaded');assert(ads===!['/privacy','/terms'].includes(path),path+' eligibility');
  for(const width of [320,390,768,1440]){
   await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(120);
   const layout=await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,words:document.querySelector("main").innerText.split(/\\s+/).length})');
   assert(layout.scrollWidth<=width,path+' horizontal overflow '+JSON.stringify(layout));report.layouts.push({path,...layout});
   if(width===390||width===1440){const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(out+'/'+(path==='/'?'home':path.slice(1))+'-'+width+'.png',Buffer.from(shot.data,'base64'));}
  }
 }
 await cdp('Page.navigate',{url:origin+'/'});await waitFor('!!window.__m9AdLoaded');
 await evaluate('document.querySelector(".landing-start a").click()');await waitFor('location.pathname==="/camera" && !!document.querySelector(".setup-panel")');await delay(400);
 assert(await evaluate('!window.__m9AdLoaded && !document.querySelector("script[src*=googlesyndication]")'),'ad globals cleared entering camera');report.checks.push('content → booth starts a fresh ad-free document');
 await evaluate('history.back()');await waitFor('location.pathname==="/"');await evaluate('history.forward()');await waitFor('location.pathname==="/camera"');await delay(300);assert(await evaluate('!window.__m9AdLoaded'),'history forward remains ad-free');
 await evaluate('document.querySelector(".back-link").click()');await waitFor('location.pathname==="/" && !!window.__m9AdLoaded');await evaluate('history.back()');await waitFor('location.pathname==="/camera"');assert(await evaluate('!window.__m9AdLoaded'),'history back remains ad-free');report.checks.push('back/forward and booth exit preserve document isolation');
 for(const path of ['/capture','/customize','/print','/results','/share/invalid','/missing-m9-page']){
  await cdp('Page.navigate',{url:origin+path});await delay(900);assert(await evaluate('!window.__m9AdLoaded && !document.querySelector("script[src*=googlesyndication]")'),path+' ad-free');report.checks.push(path+' ad-free');
 }
 assert(!networkRequests.some(r=>/supabase/.test(r.url)),'no browser Supabase traffic');
 assert(errors.length===0,'runtime errors '+JSON.stringify(errors));
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {try{await send('Browser.close');}catch{}browser.kill();}
