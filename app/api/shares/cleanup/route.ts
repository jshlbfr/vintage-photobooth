import {timingSafeEqual} from 'node:crypto';
import {shareStore} from '@/lib/sharing/supabase';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
export const runtime='nodejs';
export async function POST(request:Request){
  const secret=process.env.CRON_SECRET,token=request.headers.get('authorization')??'';
  if(!secret||token.length!==secret.length+7||!timingSafeEqual(Buffer.from(token),Buffer.from('Bearer '+secret)))return new Response(null,{status:401,headers:PRIVATE_HEADERS});
  try{let removed=0,failed=0;for(const row of await shareStore.expired()){try{await shareStore.remove(row);removed++;}catch{failed++;}}return Response.json({removed,failed},{status:failed?503:200,headers:PRIVATE_HEADERS});}
  catch{return Response.json({error:'Cleanup could not finish. Retry required.'},{status:503,headers:PRIVATE_HEADERS});}
}
export const GET=POST;
