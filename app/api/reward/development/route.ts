import {localDevelopment,sameOrigin,issueReceipt} from '@/lib/sharing/access';
import {PRIVATE_HEADERS} from '@/lib/sharing/policy';
export async function GET(request:Request){return Response.json({development:localDevelopment(request)},{headers:PRIVATE_HEADERS});}
export async function POST(request:Request){
  if(!localDevelopment(request)||!sameOrigin(request))return Response.json({error:'Reward provider is unavailable.'},{status:503,headers:PRIVATE_HEADERS});
  if(Number(request.headers.get('content-length')??0)>512)return new Response(null,{status:413});
  let body;try{const text=await request.text();if(text.length>512)throw Error();body=JSON.parse(text);}catch{return new Response(null,{status:400});}
  if(!/^[a-f0-9-]{36}$/i.test(body.sessionId??'')||body.result!=='completed')return Response.json({status:'cancelled'},{headers:PRIVATE_HEADERS});
  return Response.json({status:'completed',receipt:issueReceipt(body.sessionId)},{headers:PRIVATE_HEADERS});
}
