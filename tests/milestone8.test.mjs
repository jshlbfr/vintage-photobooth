import './register-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const {runCountdown} = await import('../lib/media/countdown.ts');
const {beginMotion} = await import('../lib/media/motion-recorder.ts');
const {continuousMoment} = await import('../lib/media/live-moment.ts');
const {clipSeconds} = await import('../lib/video/geometry.ts');
const {CUSTOM_FRAMES,framesForCount,resolveFrameLayout} = await import('../lib/frame-templates.ts');
const {createSession} = await import('../lib/session/defaults.ts');
const {sessionReducer} = await import('../lib/session/reducer.ts');

for(const seconds of [1,3,5,10])test(`${seconds}s: Smile occupies the final second, with no extra timer second`,async t=>{
  let now=0;const ticks=[];
  t.mock.method(performance,'now',()=>now);
  t.mock.method(globalThis,'setTimeout',(fn,ms)=>{now+=ms;queueMicrotask(fn);return 1;});
  await runCountdown(seconds,new AbortController().signal,remaining=>ticks.push({remaining,at:now}));
  assert.equal(ticks.find(t=>t.remaining===1).at,(seconds-1)*1000);
  assert.equal(ticks.at(-1).at,seconds*1000);
  assert.deepEqual(ticks.map(t=>t.remaining),Array.from({length:seconds+1},(_,i)=>seconds-i));
});

test('one recorder retains every capture cycle, pauses exclude idle time, and owned tracks stay live',async t=>{
  let now=0;const instances=[];
  t.mock.method(performance,'now',()=>now);
  const previous=globalThis.MediaRecorder;t.after(()=>{if(previous)globalThis.MediaRecorder=previous;else delete globalThis.MediaRecorder;});
  globalThis.MediaRecorder=class {
    static isTypeSupported(){return true;}
    constructor(){this.state='inactive';this.mimeType='video/webm';this.starts=0;this.stops=0;instances.push(this);}
    start(){this.state='recording';this.starts++;}
    pause(){this.state='paused';}
    resume(){this.state='recording';}
    stop(){this.state='inactive';this.stops++;queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['complete'],{type:this.mimeType})});this.onstop?.();});}
  };
  const track={readyState:'live'},stream={getAudioTracks:()=>[track]};
  for(const timer of [1,3,5,10])for(const count of [1,2,4,5,6,8,10,12]){
    const recording=beginMotion(stream);
    for(let i=0;i<count;i++){now+=timer*1000;if(timer===1){recording.pause();now+=15000;recording.resume();}}
    const result=await recording.finish();
    assert.equal(result.durationMs,timer*count*1000);assert.equal(result.hasAudio,true);
    assert.equal(instances.at(-1).starts,1);assert.equal(instances.at(-1).stops,1);
  }
  assert.equal(track.readyState,'live');
});

for(const frame of CUSTOM_FRAMES)test(`${frame.name}: four-only exact asset geometry`,()=>{
  const layout=resolveFrameLayout(frame,4);assert.equal(layout.width,302);assert.equal(layout.height,958);assert.equal(layout.slots.length,4);
  for(const [i,s] of layout.slots.entries()){assert(s.x>=0&&s.x+s.width<302);assert(s.y>=0&&s.y+s.height<958);if(i)assert(s.y>layout.slots[i-1].y+layout.slots[i-1].height);}
  for(const count of [1,2,5,6,8,10,12]){assert(!framesForCount(count).some(f=>f.id===frame.id));assert.throws(()=>resolveFrameLayout(frame,count));}
  let session=createSession('s',0);session=sessionReducer(session,{type:'customization/frame',frameId:frame.id});assert.equal(session.customization.frameId,frame.id);
  session=sessionReducer(session,{type:'camera/count',count:8});assert.equal(session.customization.frameId,'classic');
  const before=session;session=sessionReducer(session,{type:'customization/replace',customization:{...session.customization,frameId:frame.id}});assert.equal(session,before);
});

test('shared recording survives customization, uses full ten-second segments, rejects interrupted full sessions',()=>{
  const media={kind:'local',resourceId:'one-source',mimeType:'video/webm',width:1920,height:1080};
  let session=createSession('s',0);session={...session,capturePlanReady:true};
  const moments=[];
  for(let i=0;i<4;i++){
    session=sessionReducer(session,{type:'captures/add',sessionId:'s',capture:{id:String(i),source:'camera',still:media,filterAtCapture:'original',capturedAt:0}});
    moments.push({id:String(i),motion:{media,startMs:i*10000,durationMs:10000,sourceDurationMs:40000,hasAudio:true,mirrored:true,crop:{x:0,y:0,width:1,height:1}}});
  }
  session=sessionReducer(session,{type:'captures/motion',sessionId:'s',moments});
  assert.equal(continuousMoment(session).motion.sourceDurationMs,40000);assert.equal(clipSeconds(session.captures[0]),10);
  const edited=sessionReducer(session,{type:'customization/frame',frameId:'vintage-1'});assert.equal(continuousMoment(edited).motion.media,media);
  const interrupted={...session,captures:session.captures.map((c,i)=>i===3?{...c,motion:{...c.motion,media:{...media,resourceId:'different-run'}}}:c)};
  assert.equal(continuousMoment(interrupted),undefined);
  assert.equal(sessionReducer(session,{type:'captures/motion',sessionId:'old',moments}),session);
  const reset=sessionReducer(session,{type:'captures/restart'});assert.equal(continuousMoment(reset),undefined);
});


test('a browser pause failure disables optional motion without throwing or stopping camera tracks',async t=>{
  const previous=globalThis.MediaRecorder;t.after(()=>{if(previous)globalThis.MediaRecorder=previous;else delete globalThis.MediaRecorder;});
  globalThis.MediaRecorder=class {
    static isTypeSupported(){return true;}
    constructor(){this.state='inactive';this.mimeType='video/webm';}
    start(){this.state='recording';}
    pause(){throw new Error('Pause unavailable');}
    stop(){this.state='inactive';}
  };
  const recording=beginMotion({getAudioTracks:()=>[]});
  assert.doesNotThrow(()=>recording.pause());assert.equal(recording.available,false);assert.equal(await recording.finish(),null);
});
