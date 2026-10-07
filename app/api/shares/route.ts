import {randomBytes} from 'node:crypto';
import {sameOrigin,receiptOwner,localDevelopment} from '@/lib/sharing/access';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
import {readStrip} from '@/lib/sharing/upload';
import {shareStore,type ShareRow} from '@/lib/sharing/supabase';
import {ShareError,shareError} from '@/lib/sharing/http';
import {sharingBursts} from '@/lib/sharing/burst-limit';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'This share request is not allowed.'},{status:403,headers:PRIVATE_HEADERS});
  const owner=receiptOwner(request.headers.get('authorization')?.replace(/^Bearer /,'')??'',localDevelopment(request));
  if(!owner)return Response.json({error:'Complete a reward before sharing.'},{status:403,headers:PRIVATE_HEADERS});
  let bytes;try{
    if(!sharingBursts.take('create:global',60)||!sharingBursts.take('create:'+owner,12))throw new ShareError(429,'Too many share attempts. Please wait before trying again.');
    bytes=await readStrip(request);
  }catch(error){return shareError(error,'validate_upload');}
  let row:ShareRow|undefined;
  try{
    row=await shareStore.reserve(randomBytes(24).toString('hex'),owner);await shareStore.upload(row.storage_path,bytes);row=await shareStore.publish(row.id);
    return Response.json({id:row.id,createdAt:row.created_at,expiresAt:row.expires_at,url:`/share/${row.id}`,serverNow:Date.now()},{status:201,headers:PRIVATE_HEADERS});
  }catch(error){if(row){try{await shareStore.remove(row);}catch{/* Scheduled cleanup retries pending/expired records. */}}
    return shareError(error,'create_share');}
}
