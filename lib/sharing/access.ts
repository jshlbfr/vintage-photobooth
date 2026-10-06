import 'server-only';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const devSecret=randomBytes(32).toString('hex');
export function localDevelopment(request:Request){
  const host=new URL(`${new URL(request.url).protocol}//${request.headers.get('host')??new URL(request.url).host}`).hostname;
  return process.env.REWARD_DEVELOPMENT==='true'&&['localhost','127.0.0.1','[::1]'].includes(host);
}
export function sameOrigin(request:Request){
  const url=new URL(request.url);
  const allowed=process.env.SHARE_ORIGIN??`${url.protocol}//${request.headers.get('host')??url.host}`;
  return request.headers.get('origin')===allowed;
}
function secret(){const value=process.env.SHARE_SIGNING_SECRET;if(value&&value.length>=32)return value;if(process.env.REWARD_DEVELOPMENT==='true')return devSecret;throw new Error('Sharing is not configured.');}
function signature(data:string){return createHmac('sha256',secret()).update(data).digest('base64url');}
export function issueReceipt(sessionId:string){const data=Buffer.from(JSON.stringify({sessionId,adapter:'development',expires:Date.now()+12*60*60*1000})).toString('base64url');return `${data}.${signature(data)}`;}
export function receiptOwner(token:string,allowDevelopment=false){
  try{const [data,sig,...extra]=token.split('.');if(!data||!sig||extra.length)return null;const actual=Buffer.from(sig),expected=Buffer.from(signature(data));if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    const value=JSON.parse(Buffer.from(data,'base64url').toString());if(typeof value.sessionId!=='string'||!Number.isFinite(value.expires)||value.expires<=Date.now()||value.adapter!=='development'||!allowDevelopment)return null;
    return createHmac('sha256',secret()).update(value.sessionId).digest('hex');
  }catch{return null;}
}
