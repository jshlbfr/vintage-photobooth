import './register-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const {createSession}=await import('../lib/session/defaults.ts');
const {sessionReducer:reduce}=await import('../lib/session/reducer.ts');
const {motionCrop,stripVideoDimensions}=await import('../lib/video/geometry.ts');
const {selectStripComposition}=await import('../lib/session/selectors.ts');
const {getStripLayout}=await import('../lib/composition.ts');
const {SHARE_TTL_MS,activeShare,SHARE_ID}=await import('../lib/sharing/policy.ts');
test('capture sound defaults on independently of microphone and resets on a new session',()=>{
  let s=createSession('a',0);assert.equal(s.preferences.captureSound,true);assert.equal(s.preferences.audioEnabled,false);
  s=reduce(s,{type:'camera/sound',enabled:false});s=reduce(s,{type:'camera/audio',enabled:true});assert.equal(s.preferences.captureSound,false);assert.equal(s.preferences.audioEnabled,true);
  s=reduce(s,{type:'session/start',session:createSession('b',1)});assert.equal(s.preferences.captureSound,true);assert.equal(s.preferences.audioEnabled,false);
});
test('one reward and its share receipt survive editing, output invalidation and fresh QR requests until Take Another',()=>{
  let s=reduce(createSession('a',0),{type:'rewards/unlock',receipt:'opaque'});
  for(const kind of ['photo','gif','live-strip','full-live-moment'])s=reduce(s,{type:'outputs/record',kind,output:{resourceId:kind,mimeType:kind==='photo'?'image/png':'video/webm',createdAt:0}});
  assert.equal(Object.keys(s.outputs).length,4);s=reduce(s,{type:'customization/frame',frameId:'wide'});assert.equal(Object.keys(s.outputs).length,0);assert.deepEqual(s.rewards,{enhancedFeaturesUnlocked:true,shareReceipt:'opaque'});
  s=reduce(s,{type:'session/start',session:createSession('b',1)});assert.equal(s.rewards.enhancedFeaturesUnlocked,false);assert.equal(s.rewards.shareReceipt,undefined);
});
for(const count of [1,2,4,5,6,8,10,12])test(`${count} Live Strip dimensions preserve final composition aspect within one encoding pixel`,()=>{
  const s=createSession('a',0);s.preferences.photoCount=count;const c=selectStripComposition(s),l=getStripLayout(c),d=stripVideoDimensions(c);
  assert.equal(d.width%2,0);assert.equal(d.height%2,0);assert.ok(d.width<=720&&d.height<=1440);assert.ok(Math.abs(d.width/d.height-l.width/l.height)<.002);
});
test('motion crop composes recorded preview crop with final slot crop',()=>{
  const c=motionCrop(1920,1080,{crop:{x:.1,y:.2,width:.8,height:.6}},400,400);
  assert.ok(c.x>=192&&c.y>=216&&c.x+c.width<=1728&&c.y+c.height<=864);assert.equal(c.width,c.height);
});
test('ten-minute expiry denies the exact boundary, even if bytes still exist',()=>{
  const start=1000,expiry=new Date(start+SHARE_TTL_MS).toISOString();assert.equal(SHARE_TTL_MS,600000);assert.equal(activeShare(expiry,start+599999),true);assert.equal(activeShare(expiry,start+600000),false);assert.equal(activeShare(expiry,start+600001),false);assert.equal(activeShare('invalid',0),false);assert.equal(SHARE_ID.test('1'),false);assert.equal(SHARE_ID.test('ab'.repeat(24)),true);
});
