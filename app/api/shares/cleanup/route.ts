import {timingSafeEqual} from 'node:crypto';
import {shareStore} from '@/lib/sharing/supabase';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
import {sharingBursts} from '@/lib/sharing/burst-limit';
import {ShareError,shareError} from '@/lib/sharing/http';
export const runtime='nodejs';
export async function POST(request:Request){
  const secret=process.env.CRON_SECRET,token=request.headers.get('authorization')??'';
  const actual=Buffer.from(token),expected=Buffer.from('Bearer '+secret);
  if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return new Response(null,{status:401,headers:PRIVATE_HEADERS});
  try{if(!sharingBursts.take('cleanup',6))throw new ShareError(429,'Cleanup is already running frequently. Retry later.');let removed=0,failed=0;for(const row of await shareStore.expired()){try{await shareStore.remove(row);removed++;}catch{failed++;}}if(failed)console.error(JSON.stringify({event:'sharing_cleanup_incomplete',failed}));return Response.json({removed,failed},{status:failed?503:200,headers:PRIVATE_HEADERS});}
  catch(error){return shareError(error,'cleanup');}
}
export const GET=POST;
