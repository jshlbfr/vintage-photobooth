import {randomBytes} from 'node:crypto';
import {sameOrigin,receiptOwner,localDevelopment} from '@/lib/sharing/access';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
import {readStrip} from '@/lib/sharing/upload';
import {shareStore,type ShareRow} from '@/lib/sharing/supabase';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'This share request is not allowed.'},{status:403,headers:PRIVATE_HEADERS});
  const owner=receiptOwner(request.headers.get('authorization')?.replace(/^Bearer /,'')??'',localDevelopment(request));
  if(!owner)return Response.json({error:'Complete a reward before sharing.'},{status:403,headers:PRIVATE_HEADERS});
  let bytes;try{bytes=await readStrip(request);}catch(error){return Response.json({error:error instanceof Error?error.message:'Invalid strip.'},{status:400,headers:PRIVATE_HEADERS});}
  let row:ShareRow|undefined;
  try{
    row=await shareStore.reserve(randomBytes(24).toString('hex'),owner);await shareStore.upload(row.storage_path,bytes);row=await shareStore.publish(row.id);
    return Response.json({id:row.id,createdAt:row.created_at,expiresAt:row.expires_at,url:`/share/${row.id}`,serverNow:Date.now()},{status:201,headers:PRIVATE_HEADERS});
  }catch(error){if(row){try{await shareStore.remove(row);}catch{/* Scheduled cleanup retries pending/expired records. */}}
    return Response.json({error:error instanceof Error?error.message:'Temporary sharing failed.'},{status:503,headers:PRIVATE_HEADERS});}
}
