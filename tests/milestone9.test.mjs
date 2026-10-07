import './register-typescript.mjs';
import {registerHooks} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(specifier,context,next){
  if(specifier==='server-only')return {url:'data:text/javascript,export{}',shortCircuit:true};
  if(specifier.startsWith('@/'))return next(new URL('../'+specifier.slice(2)+'.ts',import.meta.url).href,context);
  return next(specifier,context);
}});
const {localDevelopment,sameOrigin,issueReceipt,receiptOwner}=await import('../lib/sharing/access.ts');
const {boundedBody,ShareError}=await import('../lib/sharing/http.ts');
const {BurstLimiter}=await import('../lib/sharing/burst-limit.ts');
const {MAX_SHARE_BYTES}=await import('../lib/sharing/policy.ts');
const {readStrip}=await import('../lib/sharing/upload.ts');
const reward=await import('../app/api/reward/development/route.ts');
const cleanup=await import('../app/api/shares/cleanup/route.ts');
const sharp=(await import('sharp')).default;
const origin='http://localhost:3004';
function local(){delete process.env.VERCEL;delete process.env.VERCEL_ENV;process.env.NODE_ENV='production';process.env.REWARD_LOCAL_TEST='true';process.env.REWARD_DEVELOPMENT='true';process.env.SHARE_ORIGIN=origin;process.env.SHARE_SIGNING_SECRET='isolated-security-test-secret-32-characters';}
const req=(body,headers={})=>new Request(origin+'/api/reward/development',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body});
test('deployed runtime rejects development rewards even with forged loopback host',()=>{
 local();const r=req('{}',{Host:'localhost:3004'});assert.equal(localDevelopment(r),true);
 for(const key of ['VERCEL','VERCEL_ENV']){process.env[key]='1';assert.equal(localDevelopment(r),false);delete process.env[key];}
 delete process.env.REWARD_LOCAL_TEST;assert.equal(localDevelopment(r),false);local();
 assert.equal(localDevelopment(new Request('https://public.example/api/reward/development',{headers:{Host:'localhost'}})),false);
});
test('origin validation fails closed for malformed or missing production configuration',()=>{
 local();assert.equal(sameOrigin(req('{}')),true);assert.equal(sameOrigin(req('{}',{Origin:'https://evil.example'})),false);
 process.env.SHARE_ORIGIN='not a URL';assert.equal(sameOrigin(req('{}')),false);
 process.env.SHARE_ORIGIN=origin+'/';assert.equal(sameOrigin(req('{}')),false);local();
});
test('reward requests reject null, arrays, invalid IDs and extra fields without 500s',async()=>{
 local();for(const body of ['null','[]','{','{"sessionId":"------------------------------------","result":"completed"}',JSON.stringify({sessionId:crypto.randomUUID(),result:'completed',extra:true})])assert.equal((await reward.POST(req(body))).status,400);
 assert.equal((await reward.POST(req('{}',{'Content-Type':'text/plain'}))).status,415);
 assert.equal((await reward.POST(req(' '.repeat(513)))).status,413);
 const response=await reward.POST(req(JSON.stringify({sessionId:crypto.randomUUID(),result:'completed'})));assert.equal(response.status,200);assert.ok((await response.json()).receipt);
});
test('signed receipt requires explicit dev permission and rejects modifications',()=>{
 local();const token=issueReceipt(crypto.randomUUID());assert.ok(receiptOwner(token,true));assert.equal(receiptOwner(token),null);assert.equal(receiptOwner(token+'x',true),null);assert.equal(receiptOwner('x'.repeat(2049),true),null);
});
test('body byte limit applies without Content-Length and cancels the stream',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(513));},cancel(){cancelled=true;}});
 const request=new Request(origin,{method:'POST',body:stream,duplex:'half'});
 await assert.rejects(boundedBody(request,512),e=>e instanceof ShareError&&e.status===413);assert.equal(cancelled,true);
});
test('cleanup rejects missing, wrong and same-character-length multibyte credentials',async()=>{
 process.env.CRON_SECRET='abcdef';
 for(const token of ['', 'Bearer wrong!', 'Bearer ébcdef'])assert.equal((await cleanup.POST(new Request(origin,{method:'POST',headers:{Authorization:token}}))).status,401);
});
test('PNG restrictions verify actual decoded format and dimensions',async()=>{
 assert.equal(MAX_SHARE_BYTES,4000000);
 const request=(body,type='image/png')=>new Request(origin,{method:'POST',headers:{'Content-Type':type},body});
 await assert.rejects(readStrip(request('<svg/>')),e=>e.status===400);
 await assert.rejects(readStrip(request('x','text/html')),e=>e.status===400);
 const valid=await sharp({create:{width:10,height:20,channels:4,background:'#ffffff'}}).png().toBuffer();
 assert.ok((await readStrip(request(valid))).length);
 const huge=await sharp({create:{width:8193,height:1,channels:3,background:'#000'}}).png().toBuffer();await assert.rejects(readStrip(request(huge)),e=>e.status===400);
 await assert.rejects(readStrip(new Request(origin,{method:'POST',headers:{'Content-Type':'image/png','Content-Length':String(MAX_SHARE_BYTES+1)},body:valid})),e=>e.status===413);
});
test('burst limits reset, separate keys and cap memory',()=>{
 const limiter=new BurstLimiter();assert.equal(limiter.take('a',2,0),true);assert.equal(limiter.take('a',2,1),true);assert.equal(limiter.take('a',2,2),false);assert.equal(limiter.take('b',2,2),true);assert.equal(limiter.take('a',2,60000),true);
 for(let i=0;i<1023;i++)limiter.take('fill'+i,1,60001);assert.equal(limiter.take('overflow',1,60001),false);assert.equal(limiter.take('overflow',1,120002),true);
});
