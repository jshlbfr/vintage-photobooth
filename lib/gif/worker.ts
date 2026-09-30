import { Encoder } from 'modern-gif';
import { getCoverCrop } from '../composition';
import { gradeCanvas } from '../filters/engine';
import type { FilterId } from '../filters/presets';
import { GIF_DELAY_MS } from './geometry';
export type GifSource={blob:Blob;filter:FilterId;fit:'cover'|'contain'};
export type GifRequest={sources:GifSource[];width:number;height:number};
export type GifReply={kind:'progress';done:number;total:number}|{kind:'complete';buffer:ArrayBuffer}|{kind:'error';message:string};
const scope=self as unknown as {onmessage:((event:MessageEvent<GifRequest>)=>void)|null;postMessage:(data:GifReply,transfer?:Transferable[])=>void};
scope.onmessage=async({data:{sources,width,height}})=>{
  let work:OffscreenCanvas|undefined,frame:OffscreenCanvas|undefined;
  try{
    if(!sources.length||sources.length>12||width>480||height>640)throw new Error('Invalid GIF dimensions or photo count.');
    const encoder=new Encoder({width,height,maxColors:255,looped:true,loopCount:0,dither:'floyd-steinberg'});
    frame=new OffscreenCanvas(width,height);const ctx=frame.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('GIF canvas is unavailable.');
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    for(let i=0;i<sources.length;i++){
      const source=sources[i],image=await createImageBitmap(source.blob);
      try{
        const scale=Math.min(1,960/Math.max(image.width,image.height));
        work=new OffscreenCanvas(Math.max(1,Math.round(image.width*scale)),Math.max(1,Math.round(image.height*scale)));
        const pixels=work.getContext('2d',{willReadFrequently:true});if(!pixels)throw new Error('Photo processing is unavailable.');
        pixels.imageSmoothingQuality='high';pixels.drawImage(image,0,0,work.width,work.height);gradeCanvas(work,source.filter);
        ctx.fillStyle='#050403';ctx.fillRect(0,0,width,height);
        if(source.fit==='contain'){
          const factor=Math.min(width/work.width,height/work.height),w=work.width*factor,h=work.height*factor;ctx.drawImage(work,(width-w)/2,(height-h)/2,w,h);
        }else{const crop=getCoverCrop(work.width,work.height,width,height);ctx.drawImage(work,crop.x,crop.y,crop.width,crop.height,0,0,width,height);}
        await encoder.encode({data:ctx.getImageData(0,0,width,height).data,width,height,delay:GIF_DELAY_MS,disposal:1});
        scope.postMessage({kind:'progress',done:i+1,total:sources.length});
      }finally{image.close();if(work){work.width=0;work.height=0;}}
    }
    const buffer=await encoder.flush();scope.postMessage({kind:'complete',buffer},[buffer]);
  }catch(error){scope.postMessage({kind:'error',message:error instanceof Error?error.message:'GIF generation failed.'});}
  finally{if(work){work.width=0;work.height=0;}if(frame){frame.width=0;frame.height=0;}}
};
