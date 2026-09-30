// Local Supabase HTTP contract fixture. Never imported by application code.
import {createServer} from 'node:http';
const rows=new Map(),objects=new Map();let offset=0,fail=false;const events=[];
const now=()=>Date.now()+offset;
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');const chunks=[];for await(const chunk of req)chunks.push(chunk);const bytes=Buffer.concat(chunks);
  const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(url.pathname==='/__test/reset'){rows.clear();objects.clear();offset=0;fail=false;events.length=0;return json({ok:true});}
  if(url.pathname==='/__test/advance'){offset+=Number(url.searchParams.get('ms'));return json({now:now()});}
  if(url.pathname==='/__test/fail'){fail=url.searchParams.get('on')==='1';return json({fail});}
  if(url.pathname==='/__test/stats')return json({rows:[...rows.values()],objects:objects.size,events});
  if(req.headers.authorization!=='Bearer fixture-secret')return json({error:'unauthorized'},401);
  if(fail)return json({error:'simulated outage'},503);
  events.push({method:req.method,path:url.pathname,type:req.headers['content-type'],bytes:bytes.length});
  let body={};if(bytes.length&&req.headers['content-type']==='application/json')body=JSON.parse(bytes);
  if(url.pathname.endsWith('/reserve_photobooth_share')){
    if([...rows.values()].filter(r=>r.owner_hash===body.p_owner&&Date.parse(r.created_at)>now()-600000).length>=3)return json({error:'limit'},429);
    const row={id:body.p_id,storage_path:body.p_id+'.png',owner_hash:body.p_owner,mime_type:'image/png',ready:false,created_at:new Date(now()).toISOString(),expires_at:new Date(now()+600000).toISOString()};rows.set(row.id,row);return json(row);
  }
  if(url.pathname.endsWith('/publish_photobooth_share')){const row=rows.get(body.p_id);if(!row||row.ready)return json(null,400);Object.assign(row,{ready:true,created_at:new Date(now()).toISOString(),expires_at:new Date(now()+600000).toISOString()});return json(row);}
  if(url.pathname.endsWith('/active_photobooth_share')){const row=rows.get(body.p_id);return json(row?.ready&&Date.parse(row.expires_at)>now()?row:null);}
  if(url.pathname.endsWith('/expired_photobooth_shares'))return json([...rows.values()].filter(r=>Date.parse(r.expires_at)<=now()));
  if(url.pathname.startsWith('/storage/v1/object/authenticated/')){const blob=objects.get(url.pathname.split('/').at(-1));if(!blob)return json(null,404);res.writeHead(200,{'Content-Type':'image/png'});res.end(blob);return;}
  if(url.pathname.startsWith('/storage/v1/object/photobooth-shares/')&&req.method==='POST'){objects.set(url.pathname.split('/').at(-1),bytes);return json({});}
  if(url.pathname==='/storage/v1/object/photobooth-shares'&&req.method==='DELETE'){for(const path of body.prefixes)objects.delete(path);return json({});}
  if(url.pathname==='/rest/v1/photobooth_shares'&&req.method==='DELETE'){rows.delete(url.searchParams.get('id').slice(3));return json({});}
  json({error:'unsupported fixture request'},404);
});
server.listen(9006,'127.0.0.1',()=>console.log('Supabase contract fixture on 127.0.0.1:9006'));
