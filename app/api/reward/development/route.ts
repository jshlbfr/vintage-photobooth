import {localDevelopment,sameOrigin,issueReceipt} from '@/lib/sharing/access';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
import {boundedBody,ShareError,shareError} from '@/lib/sharing/http';
import {sharingBursts} from '@/lib/sharing/burst-limit';
export async function GET(request:Request){return Response.json({development:localDevelopment(request)},{headers:PRIVATE_HEADERS});}
export async function POST(request:Request){
  if(!localDevelopment(request)||!sameOrigin(request))return Response.json({error:'Reward provider is unavailable.'},{status:503,headers:PRIVATE_HEADERS});
  try {
    if(!sharingBursts.take('development-reward',30))throw new ShareError(429,'Please wait before trying again.');
    if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new ShareError(415,'Expected JSON.');
    const bytes=await boundedBody(request,512);
    let body: unknown;try{body=JSON.parse(bytes.toString('utf8'));}catch{throw new ShareError(400,'Invalid reward request.');}
    if(!body||typeof body!=='object'||Array.isArray(body))throw new ShareError(400,'Invalid reward request.');
    const value=body as Record<string,unknown>;
    if(typeof value.sessionId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.sessionId)||Object.keys(value).some(key=>!['sessionId','result'].includes(key)))throw new ShareError(400,'Invalid reward request.');
    if(value.result!=='completed')return Response.json({status:'cancelled'},{headers:PRIVATE_HEADERS});
    return Response.json({status:'completed',receipt:issueReceipt(value.sessionId)},{headers:PRIVATE_HEADERS});
  }catch(error){return shareError(error,'development_reward');}
}
