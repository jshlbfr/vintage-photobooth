import 'server-only';
import sharp from 'sharp';
import {MAX_SHARE_BYTES} from './policy';
import {boundedBody,ShareError} from './http';
export async function readStrip(request:Request){
  if(request.headers.get('content-type')!=='image/png')throw new ShareError(400,'Only the final PNG photo strip can be shared.');
  const bytes=await boundedBody(request,MAX_SHARE_BYTES);
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new ShareError(400,'Choose a valid PNG strip.');
  try{
    const image=sharp(bytes,{limitInputPixels:8_100_000,failOn:'warning'}),metadata=await image.metadata();
    if(metadata.format!=='png'||!metadata.width||!metadata.height||metadata.width>8192||metadata.height>8192||(metadata.pages??1)>1)throw Error();
    const result=await image.png().toBuffer();
    if(result.length>MAX_SHARE_BYTES)throw new ShareError(413,'This PNG is too large for QR sharing. You can still download it.');
    return result;
  }catch(error){if(error instanceof ShareError)throw error;throw new ShareError(400,'The PNG strip could not be validated.');}
}
