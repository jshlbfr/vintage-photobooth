import './register-typescript.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
const {processPixels}=await import('../lib/filters/engine.ts');
const {FILTER_PRESETS}=await import('../lib/filters/presets.ts');
const fixture=()=>Uint8ClampedArray.from({length:64*64*4},(_,i)=>i%4===3?255:(Math.floor(i/4)*13+i%4*47)%256);

test('Original is byte-exact passthrough, including alpha and all tonal values',()=>{
  const original=fixture(),copy=original.slice();assert.equal(processPixels(copy,64,64,'original'),copy);assert.deepEqual(copy,original);
});
test('every preset is deterministic, distinct and preserves alpha',()=>{
  const original=fixture(),outputs=new Set();
  for(const preset of FILTER_PRESETS){
    const copy=original.slice();processPixels(copy,64,64,preset.id);
    const again=original.slice();processPixels(again,64,64,preset.id);assert.deepEqual(copy,again);
    for(let i=3;i<copy.length;i+=4)assert.equal(copy[i],255);
    outputs.add(Buffer.from(copy).toString('base64'));
  }
  assert.equal(outputs.size,FILTER_PRESETS.length);assert.deepEqual(original,fixture());
});
test('monochrome uses equal RGB channels and retains tonal range',()=>{
  const data=fixture();processPixels(data,64,64,'silver-screen');const values=new Set();
  for(let i=0;i<data.length;i+=4){assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);values.add(data[i]);}
  assert.ok(values.size>100);
});
test('returning to Original uses source pixels rather than a graded derivative',()=>{
  const source=fixture();const warm=source.slice();processPixels(warm,64,64,'golden-hour');
  const cool=source.slice();processPixels(cool,64,64,'sunday');assert.notDeepEqual(warm,cool);
  assert.deepEqual(processPixels(source.slice(),64,64,'original'),source);
});
