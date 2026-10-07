import {shareStore} from '@/lib/sharing/supabase';
import {SHARE_ID,PRIVATE_HEADERS,activeShare} from '@/lib/sharing/policy';
import {sharingBursts} from '@/lib/sharing/burst-limit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const unavailable=()=>Response.json({error:'This photo strip has expired or is unavailable.'},{status:410,headers:PRIVATE_HEADERS});
  if(!SHARE_ID.test(id))return unavailable();
  if(!sharingBursts.take('read:global',240)||!sharingBursts.take('read:'+id,60))return Response.json({error:'Please wait before opening the strip again.'},{status:429,headers:{...PRIVATE_HEADERS,'Retry-After':'60'}});
  try{const row=await shareStore.active(id);if(!row||!activeShare(row.expires_at))return unavailable();
    const bytes=await shareStore.download(row.storage_path);
    // Revalidate after storage I/O: no new image response at or beyond expiry.
    if(!activeShare(row.expires_at)||!await shareStore.active(id))return unavailable();
    return new Response(Buffer.from(bytes),{headers:{...PRIVATE_HEADERS,'Content-Type':'image/png','Content-Disposition':'inline; filename="vintage-photobooth.png"'}});
  }catch{console.error(JSON.stringify({event:'sharing_failure',operation:'read_image'}));return unavailable();}
}
