import 'server-only';
export type ShareRow={id:string;storage_path:string;created_at:string;expires_at:string;ready:boolean};
const bucket='photobooth-shares';
function config(){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('QR sharing is not configured yet. Your media remains on this device.');
  const parsed=new URL(url);if(parsed.protocol!=='https:'&&!(process.env.REWARD_DEVELOPMENT==='true'&&['127.0.0.1','localhost'].includes(parsed.hostname)))throw new Error('Sharing requires a secure backend.');
  return {url:parsed.origin,key};
}
async function request(path:string,init:RequestInit={}){
  const {url,key}=config();const response=await fetch(url+path,{...init,cache:'no-store',signal:AbortSignal.timeout(20000),headers:{apikey:key,Authorization:`Bearer ${key}`,...init.headers}});
  if(!response.ok)throw new Error(response.status===429?'Too many shares. Please wait before trying again.':'Temporary sharing is unavailable. Please try again.');return response;
}
async function rpc(name:string,body:object){return (await request('/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();}
export const shareStore={
  reserve:(id:string,owner:string):Promise<ShareRow>=>rpc('reserve_photobooth_share',{p_id:id,p_owner:owner}),
  publish:(id:string):Promise<ShareRow>=>rpc('publish_photobooth_share',{p_id:id}),
  active:(id:string):Promise<ShareRow|null>=>rpc('active_photobooth_share',{p_id:id}),
  async upload(path:string,bytes:Uint8Array){await request(`/storage/v1/object/${bucket}/${path}`,{method:'POST',headers:{'Content-Type':'image/png','x-upsert':'false','Cache-Control':'no-store'},body:Buffer.from(bytes)});},
  async download(path:string){return new Uint8Array(await(await request(`/storage/v1/object/authenticated/${bucket}/${path}`)).arrayBuffer());},
  async remove(row:ShareRow){await request(`/storage/v1/object/${bucket}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[row.storage_path]})});await request(`/rest/v1/photobooth_shares?id=eq.${row.id}`,{method:'DELETE'});},
  async expired():Promise<ShareRow[]>{return rpc('expired_photobooth_shares',{});},
};
