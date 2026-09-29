import './register-typescript.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const { createSession }=await import('../lib/session/defaults.ts');
const { sessionReducer }=await import('../lib/session/reducer.ts');
const { selectStripComposition }=await import('../lib/session/selectors.ts');
const { getStripLayout }=await import('../lib/composition.ts');
const { FRAME_STYLES }=await import('../lib/frame-templates.ts');
const { orderedElements,safeElement,stickerDimensions,newPlacement,reorderElement,deleteElement,exportDimensions }=await import('../lib/editor/geometry.ts');
const { STICKER_ASSETS }=await import('../lib/artwork.ts');
const sticker={id:'a',type:'sticker',assetId:'bow',x:.5,y:.5,size:.28,rotation:12,layer:0};
const text={id:'b',type:'text',content:'A memory',color:'#fff',font:'ui',alignment:'middle',x:.5,y:.6,size:.07,rotation:0,layer:1};
const custom=()=>({...createSession('s',0).customization,stickers:[sticker,{...sticker,id:'c',layer:2}],texts:[text]});
test('sticker and text layers interleave deterministically and reorder without changing transforms',()=>{
 const c=custom();assert.deepEqual(orderedElements({decorations:c.stickers,texts:c.texts}).map(e=>e.id),['a','b','c']);
 const next=reorderElement(c,'a',1);assert.deepEqual(orderedElements({decorations:next.stickers,texts:next.texts}).map(e=>e.id),['b','a','c']);
 assert.equal(next.stickers[0].rotation,12);assert.equal(next.stickers[0].x,.5);assert.equal(c.stickers[0].layer,0);
 assert.equal(deleteElement(next,'a').stickers.length,1);assert.equal(deleteElement(next,'b').texts.length,0);
});
test('positions are recoverable, aspect ratios preserved and additions stagger',()=>{
 const safe=safeElement({...sticker,x:-100,y:100,size:100,rotation:725});
 assert.deepEqual([safe.x,safe.y,safe.size,safe.rotation],[0,1,.8,5]);
 assert.equal(safeElement({...text,size:0}).size,.025);
 const l=getStripLayout({count:4,frameStyle:'classic'}),d=stickerDimensions(sticker,l),a=STICKER_ASSETS.bow;
 assert.ok(Math.abs(d.width/d.height-a.width/a.height)<1e-10);
 assert.notDeepEqual(newPlacement(custom()),newPlacement({...custom(),texts:[]}));
});
for(const count of [1,2,4,5,6,8,10,12])test(`${count} photos preserve normalized editing data through every generated frame, with bounded high-resolution output`,()=>{
 let s={...createSession('s',0),customization:custom()};s=sessionReducer(s,{type:'camera/count',count});
 for(const frame of FRAME_STYLES){
  s=sessionReducer(s,{type:'customization/frame',frameId:frame.id});const c=selectStripComposition(s),l=getStripLayout(c),d=exportDimensions(l);
  assert.equal(l.slots.length,count);assert.equal(new Set(l.slots.map(s=>s.x)).size,count>=6?2:1);
  assert.equal(c.decorations[0].x,.5);assert.equal(c.decorations[0].size,.28);assert.equal(c.texts[0].content,'A memory');
  assert.ok(d.width>700&&d.height>1000);assert.ok(Math.max(d.width,d.height)<=4096);assert.ok(d.width*d.height<8_010_000);
 }
});
test('composition replacement invalidates output without flattening source media or decoration state',()=>{
 const s={...createSession('s',0),outputs:{photo:{resourceId:'old'}}};const next=sessionReducer(s,{type:'customization/replace',customization:custom()});
 assert.deepEqual(next.outputs,{});assert.equal(next.captures,s.captures);assert.deepEqual(next.customization,custom());
});
