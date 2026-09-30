import 'server-only';
import sharp from 'sharp';
import {MAX_SHARE_BYTES} from './policy';
export async function readStrip(request:Request){
  if(request.headers.get('content-type')!=='image/png')throw new Error('Only the final PNG photo strip can be shared.');
  if(Number(request.headers.get('content-length')??0)>MAX_SHARE_BYTES)throw new Error('The photo strip is too large to share.');
  const reader=request.body?.getReader();if(!reader)throw new Error('The photo strip is missing.');
  const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_SHARE_BYTES){await reader.cancel();throw new Error('The photo strip is too large to share.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=Buffer.concat(chunks);if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Choose a valid PNG strip.');
  try{const image=sharp(bytes,{limitInputPixels:8_100_000,failOn:'warning'}),metadata=await image.metadata();if(metadata.format!=='png'||!metadata.width||!metadata.height||metadata.width>8192||metadata.height>8192||(metadata.pages??1)>1)throw Error();
    // Decode/re-encode verifies the image and removes arbitrary metadata payloads.
    return await image.png().toBuffer();
  }catch{throw new Error('The PNG strip could not be validated.');}
}
