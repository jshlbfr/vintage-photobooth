import './register-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const {photoCrop,photoImageRect,dragPhoto,constrainPhotoAdjustment}=await import('../lib/editor/photo-geometry.ts');
const {FRAME_TEMPLATES,supportsPhotoCount,resolveFrameLayout}=await import('../lib/frame-templates.ts');
const {createSession}=await import('../lib/session/defaults.ts');
const {sessionReducer}=await import('../lib/session/reducer.ts');
const {selectStripComposition}=await import('../lib/session/selectors.ts');
const {applyFlashExposure}=await import('../lib/filters/engine.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const count of [1,2,4,5,6,8,10,12])test(`photo crop fills all ${count}-photo windows across source orientations, zooms and extremes`,()=>{
 for(const frame of FRAME_TEMPLATES.filter(f=>supportsPhotoCount(f,count)))for(const slot of resolveFrameLayout(frame,count).slots)for(const [w,h] of [[1920,1080],[900,1600],[1200,1200]])for(const zoom of [1,1.2,4])for(const x of [0,.25,.5,1]){
  const a={zoom,x,y:1-x},c=photoCrop(w,h,slot.width,slot.height,a);
  assert.ok(c.x>=-1e-8&&c.y>=-1e-8&&c.x+c.width<=w+1e-8&&c.y+c.height<=h+1e-8);
  near(c.width/c.height,slot.width/slot.height);
  const r=photoImageRect(w,h,slot,a);near((slot.x-r.x)/r.width,c.x/w);near((slot.y-r.y)/r.height,c.y/h);
  const big=photoCrop(w*2,h*2,slot.width*3,slot.height*3,a);near(big.x/w/2,c.x/w);near(big.width/w/2,c.width/w);
 }
});
test('drag follows pointer, clamps actual boundaries and preserves zoom',()=>{
 const a={zoom:2,x:.5,y:.5},slot={width:200,height:150};
 const b=dragPhoto(1920,1080,slot.width,slot.height,a,20,-10);
 assert.ok(b.x<a.x&&b.y>a.y);assert.equal(b.zoom,2);
 const edge=dragPhoto(1920,1080,200,150,a,1e6,-1e6),c=photoCrop(1920,1080,200,150,edge);
 near(c.x,0);near(c.y+c.height,1080);
 const reset=constrainPhotoAdjustment(1920,1080,200,150,{zoom:1,x:edge.x,y:edge.y});assert.ok(reset.y<=.5+1e-8);
});
test('initial camera framing retains its default crop while permitting full-source panning',()=>{
 const initial={x:.1,y:0,width:.8,height:1};const c=photoCrop(2000,1000,1600,1000,undefined,initial);
 near(c.x,200);near(c.width,1600);
 const moved=photoCrop(2000,1000,1600,1000,{zoom:1,x:0,y:.5},initial);near(moved.x,0);
});
test('individual adjustments preserve originals and reset across repeated capture plans and sessions',()=>{
 let s=createSession('a',0);const original={kind:'local',resourceId:'original',width:1920,height:1080,mimeType:'image/jpeg'};
 for(let i=0;i<3;i++){
  s={...s,captures:[{id:'one',source:'camera',still:original,filterAtCapture:'mono'},{id:'two',source:'upload',still:original,filterAtCapture:'original'}]};
  const c={...s.customization,stickers:[{id:'s',x:.2,rotation:14}],texts:[{id:'t'}],photoAdjustments:{one:{zoom:2,x:.3,y:.6}}};
  const edited=sessionReducer(s,{type:'customization/replace',customization:c});const photos=selectStripComposition(edited).photos;
  assert.equal(photos[0].adjustment.zoom,2);assert.equal(photos[1].adjustment,undefined);assert.equal(edited.captures[0].still,original);
  assert.deepEqual(sessionReducer(edited,{type:'customization/replace',customization:s.customization}).customization,s.customization);
  s=sessionReducer(edited,{type:i===1?'camera/count':'captures/restart',count:6});
  assert.deepEqual(s.customization.photoAdjustments,{});assert.deepEqual(s.customization.stickers,[]);assert.deepEqual(s.customization.texts,[]);assert.deepEqual(s.captures,[]);
 }
 assert.deepEqual(createSession('new',1).customization.photoAdjustments,{});
});
test('flash exposure lifts midtones gently without clipping highlights or modifying alpha',()=>{
 const values=new Uint8ClampedArray([0,128,255,123,64,192,240,255]);const result=applyFlashExposure(values);
 assert.equal(result[0],0);assert.equal(result[2],255);assert.equal(result[3],123);assert.ok(result[1]>128&&result[1]<145);assert.ok(result[6]<255);
});
test('resetting one photo retains all other composition settings and photo adjustments',()=>{
 const s=createSession('s',0),one={zoom:2,x:.3,y:.6},two={zoom:1.5,x:.7,y:.4};
 const custom={...s.customization,frameId:'vintage-2',frameColor:'#702C2B',stickers:[{id:'s'}],texts:[{id:'t'}],photoAdjustments:{one,two}};
 const before={...s,customization:custom};
 const next=sessionReducer(before,{type:'customization/replace',customization:{...custom,photoAdjustments:{...custom.photoAdjustments,one:{zoom:1,x:.5,y:.5}}}});
 assert.equal(next.customization.photoAdjustments.two,two);assert.equal(next.customization.stickers,custom.stickers);assert.equal(next.customization.texts,custom.texts);assert.equal(next.customization.frameId,custom.frameId);assert.equal(next.customization.frameColor,custom.frameColor);
});
test('mirrored Live Strip sampling matches still crop; Full Live Moment ignores strip adjustments',async()=>{
 const {drawMotion}=await import('../lib/video/playback.ts');
 const slot={x:20,y:30,width:205,height:173},a={zoom:2,x:.7,y:.4};
 const capture={initialCrop:{x:.04,y:0,width:.92,height:1},motion:{mirrored:true,crop:{x:.04,y:0,width:.92,height:1}}};
 let args;const context={save(){},restore(){},beginPath(){},roundRect(){},clip(){},translate(){},scale(){},drawImage(...values){args=values;}};
 const video={readyState:2,videoWidth:1920,videoHeight:1080};
 drawMotion(context,video,capture,slot,undefined,a,true);
 const still=photoCrop(1920,1080,slot.width,slot.height,a,capture.initialCrop);
 near(args[1],1920-still.x-still.width);near(args[2],still.y);near(args[3],still.width);near(args[4],still.height);
 drawMotion(context,video,capture,slot,undefined,a,false);const full=args.slice();drawMotion(context,video,capture,slot,undefined,{zoom:4,x:0,y:0},false);
 assert.deepEqual(args,full);
});
