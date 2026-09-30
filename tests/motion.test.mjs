import './register-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const {createSession}=await import('../lib/session/defaults.ts');
const {selectStripComposition}=await import('../lib/session/selectors.ts');
const {getStripLayout}=await import('../lib/composition.ts');
const {gifDimensions}=await import('../lib/gif/geometry.ts');
const {liveMoments,motionExtension}=await import('../lib/media/live-moment.ts');
for(const count of [1,2,4,5,6,8,10,12])test(`${count} GIF frames use the strip slot aspect without stretching`,()=>{
  const s=createSession('test',0);s.preferences.photoCount=count;
  const composition=selectStripComposition(s),slot=getStripLayout(composition).slots[0],gif=gifDimensions(composition);
  assert.ok(gif.width<=480&&gif.height<=640);assert.ok(Math.abs(gif.width/gif.height-slot.width/slot.height)<.005);
});
test('Live Moment uses only actual camera recordings and preserves photo numbering',()=>{
  const s=createSession('test',0);s.captures=[{source:'upload'},{source:'camera',motion:{hasAudio:true}},{source:'camera'},{source:'camera',motion:{hasAudio:false}}];
  assert.deepEqual(liveMoments(s).map(m=>[m.photoNumber,m.motion.hasAudio]),[[2,true],[4,false]]);
});
test('motion download extensions preserve the actual container including codec MIME parameters',()=>{
  for(const [mime,ext] of [['video/webm;codecs=vp9,opus','webm'],['video/mp4; codecs=avc1','mp4'],['VIDEO/OGG','ogv'],['video/quicktime','mov'],['video/x-matroska','mkv'],['','bin']])assert.equal(motionExtension(mime),ext);
});

test('GIF jobs terminate their worker on completion, cancellation and error',async()=>{
  const {generateGif}=await import('../lib/gif/generate.ts');
  const previousWorker=globalThis.Worker,previousCanvas=globalThis.OffscreenCanvas;
  let active;
  function FakeWorker(){return (active={terminated:false,postMessage(request){this.request=request;},terminate(){this.terminated=true;}});}
  globalThis.Worker=FakeWorker;globalThis.OffscreenCanvas=class{};
  try{
    const progress=[],request={sources:[],width:1,height:1};
    let controller=new AbortController(),job=generateGif(request,controller.signal,(...args)=>progress.push(args));
    active.onmessage({data:{kind:'progress',done:1,total:1}});assert.deepEqual(progress,[[1,1]]);
    active.onmessage({data:{kind:'complete',buffer:new Uint8Array([71,73,70]).buffer}});const blob=await job;assert.equal(blob.type,'image/gif');assert.equal(blob.size,3);assert.equal(active.terminated,true);
    controller=new AbortController();job=generateGif(request,controller.signal,()=>{});controller.abort();await assert.rejects(job,{name:'AbortError'});assert.equal(active.terminated,true);
    controller=new AbortController();job=generateGif(request,controller.signal,()=>{});active.onerror();await assert.rejects(job,/Please try again/);assert.equal(active.terminated,true);
    globalThis.Worker=undefined;await assert.rejects(generateGif(request,controller.signal,()=>{}),/photo download still works/);
  }finally{globalThis.Worker=previousWorker;globalThis.OffscreenCanvas=previousCanvas;}
});
