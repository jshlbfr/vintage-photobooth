import 'server-only';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const devSecret=randomBytes(32).toString('hex');
export function localRuntime(){return !process.env.VERCEL&&!process.env.VERCEL_ENV&&(process.env.NODE_ENV==='development'||process.env.REWARD_LOCAL_TEST==='true');}
export function localDevelopment(request:Request){
  try {
    const url=new URL(request.url),host=new URL(`${url.protocol}//${request.headers.get('host')??url.host}`).hostname;
    const loopback=(value:string)=>['localhost','127.0.0.1','[::1]'].includes(value);
    return localRuntime()&&process.env.REWARD_DEVELOPMENT==='true'&&loopback(host)&&loopback(url.hostname);
  }catch{return false;}
}
export function sameOrigin(request:Request){
  try {
    const configured=process.env.SHARE_ORIGIN;
    if(!configured)return localDevelopment(request)&&request.headers.get('origin')===new URL(request.url).origin;
    const allowed=new URL(configured);
    if(allowed.origin!==configured||allowed.username||allowed.password)return false;
    if(allowed.protocol!=='https:'&&!localDevelopment(request))return false;
    return request.headers.get('origin')===allowed.origin;
  }catch{return false;}
}
function secret(){const value=process.env.SHARE_SIGNING_SECRET;if(value&&value.length>=32)return value;if(localRuntime()&&process.env.REWARD_DEVELOPMENT==='true')return devSecret;throw new Error('Sharing is not configured.');}
function signature(data:string){return createHmac('sha256',secret()).update(data).digest('base64url');}
export function issueReceipt(sessionId:string){const data=Buffer.from(JSON.stringify({sessionId,adapter:'development',expires:Date.now()+12*60*60*1000})).toString('base64url');return `${data}.${signature(data)}`;}
export function receiptOwner(token:string,allowDevelopment=false){
  if(token.length>2048)return null;
  try{const [data,sig,...extra]=token.split('.');if(!data||!sig||extra.length)return null;const actual=Buffer.from(sig),expected=Buffer.from(signature(data));if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    const value=JSON.parse(Buffer.from(data,'base64url').toString());if(typeof value.sessionId!=='string'||!Number.isFinite(value.expires)||value.expires<=Date.now()||value.adapter!=='development'||!allowDevelopment)return null;
    return createHmac('sha256',secret()).update(value.sessionId).digest('hex');
  }catch{return null;}
}
