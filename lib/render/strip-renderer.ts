import { getCoverCrop, getStripLayout, type StripComposition } from '../composition';
import { STICKER_ASSETS } from '../artwork';
import { exportDimensions, orderedElements, stickerDimensions } from '../editor/geometry';
import { fontFamily, textGeometry } from '../editor/text';
import { gradeCanvas } from '../filters/engine';
import type { FilterId } from '../filters/presets';
import type { PreviewResult } from '../filters/preview-worker';

async function loadImage(src:string,signal:AbortSignal){
  const image=new Image();const abort=()=>{image.src='';};signal.addEventListener('abort',abort,{once:true});
  try{signal.throwIfAborted();image.src=src;await image.decode();signal.throwIfAborted();return image;}
  finally{signal.removeEventListener('abort',abort);}
}
function pause(){return new Promise<void>(resolve=>setTimeout(resolve,0));}
async function grade(work:HTMLCanvasElement,filter:FilterId,signal:AbortSignal){
  if(filter==='original')return;
  if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'){await pause();signal.throwIfAborted();gradeCanvas(work,filter);return;}
  let worker:Worker|null=null,bitmap:ImageBitmap|null=null;
  try{
    worker=new Worker(new URL('../filters/preview-worker.ts',import.meta.url));
    bitmap=await createImageBitmap(work);signal.throwIfAborted();
    const active=worker;
    await new Promise<void>((resolve,reject)=>{
      const abort=()=>{active.terminate();reject(new DOMException('Cancelled','AbortError'));};
      signal.addEventListener('abort',abort,{once:true});
      const cleanup=()=>signal.removeEventListener('abort',abort);
      active.onerror=()=>{cleanup();reject(new Error('Filter rendering failed. Please try again.'));};
      active.onmessage=({data}:MessageEvent<PreviewResult>)=>{
        cleanup();if('error' in data){reject(new Error('Filter rendering failed. Please try again.'));return;}
        try{signal.throwIfAborted();work.getContext('2d')!.drawImage(data.bitmap,0,0);resolve();}catch(error){reject(error);}finally{data.bitmap.close();}
      };
      try{active.postMessage({bitmap,filter},[bitmap!]);bitmap=null;}catch(error){cleanup();reject(error);}
    });
  }finally{bitmap?.close();worker?.terminate();}
}

/** Draw original media + shared geometry. No DOM capture, preview textures or UI. */
export async function renderStrip(composition:StripComposition,signal:AbortSignal,onProgress?:(done:number,total:number)=>void, options?:{dimensions?:{width:number;height:number};layer?:'base'|'decorations'}){
  await document.fonts.ready;signal.throwIfAborted();
  const layout=getStripLayout(composition),dimensions=options?.dimensions ? {...options.dimensions,scale:options.dimensions.width/layout.width} : exportDimensions(layout);
  const canvas=document.createElement('canvas'),work=document.createElement('canvas');
  canvas.width=dimensions.width;canvas.height=dimensions.height;
  try{
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image rendering is unavailable in this browser.');
    ctx.scale(canvas.width/layout.width,canvas.height/layout.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.beginPath();ctx.roundRect(0,0,layout.width,layout.height,layout.radius);ctx.clip();
    if(options?.layer!=='decorations'){ctx.fillStyle=composition.frameColor;ctx.fillRect(0,0,layout.width,layout.height);}
    for(let i=0;options?.layer!=='decorations'&&i<layout.slots.length;i++){
      signal.throwIfAborted();const slot=layout.slots[i],photo=composition.photos[i];
      if(!photo?.src)throw new Error('A photograph is missing. Return to Capture and try again.');
      const image=await loadImage(photo.src,signal);
      try{
        const crop=photo.fit==='contain'?{x:0,y:0,width:image.naturalWidth,height:image.naturalHeight}:getCoverCrop(image.naturalWidth,image.naturalHeight,slot.width,slot.height);
        const factor=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight),Math.max(slot.width*dimensions.scale/crop.width,slot.height*dimensions.scale/crop.height));
        work.width=Math.max(1,Math.round(image.naturalWidth*factor));work.height=Math.max(1,Math.round(image.naturalHeight*factor));
        const source=work.getContext('2d',{willReadFrequently:true});if(!source)throw new Error('Photo rendering is unavailable.');
        source.imageSmoothingEnabled=true;source.imageSmoothingQuality='high';source.drawImage(image,0,0,work.width,work.height);
        await grade(work,photo.filterId??'original',signal);signal.throwIfAborted();
        ctx.save();ctx.beginPath();ctx.roundRect(slot.x,slot.y,slot.width,slot.height,slot.radius);ctx.clip();ctx.fillStyle='#050403';ctx.fillRect(slot.x,slot.y,slot.width,slot.height);
        if(photo.fit==='contain'){
          const scale=Math.min(slot.width/work.width,slot.height/work.height),w=work.width*scale,h=work.height*scale;
          ctx.drawImage(work,slot.x+(slot.width-w)/2,slot.y+(slot.height-h)/2,w,h);
        }else{
          const c=getCoverCrop(work.width,work.height,slot.width,slot.height);ctx.drawImage(work,c.x,c.y,c.width,c.height,slot.x,slot.y,slot.width,slot.height);
        }
        ctx.restore();onProgress?.(i+1,layout.slots.length);await pause();
      }finally{image.src='';work.width=0;work.height=0;}
    }
    for(const element of options?.layer==='base'?[]:orderedElements(composition)){
      signal.throwIfAborted();ctx.save();ctx.translate(element.x*layout.width,element.y*layout.height);ctx.rotate(element.rotation*Math.PI/180);
      if(element.type==='sticker'){
        const image=await loadImage(STICKER_ASSETS[element.assetId].src,signal),size=stickerDimensions(element,layout);
        ctx.drawImage(image,-size.width/2,-size.height/2,size.width,size.height);image.src='';
      }else{
        const text=textGeometry(element,layout);ctx.font=`400 ${text.fontSize}px ${text.family}`;ctx.textBaseline='alphabetic';ctx.textAlign=element.alignment==='middle'?'center':element.alignment==='end'?'right':'left';ctx.fillStyle=element.color;
        text.lines.forEach((line,i)=>ctx.fillText(line,text.anchor,text.baseline+i*text.lineHeight));
      }
      ctx.restore();
    }
    if(options?.layer!=='base'&&composition.caption&&layout.captionY!==undefined){ctx.font=`18px ${fontFamily('script')}`;ctx.textAlign='center';ctx.fillStyle='#F3E9D2';ctx.fillText(composition.caption,layout.width/2,layout.captionY);}
    signal.throwIfAborted();
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('The PNG could not be saved. Please try again.')),'image/png'));
    signal.throwIfAborted();return {blob,width:canvas.width,height:canvas.height};
  }finally{canvas.width=0;canvas.height=0;work.width=0;work.height=0;}
}
