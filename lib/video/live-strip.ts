import {getStripLayout,type StripComposition} from '../composition';
import {renderStrip} from '../render/strip-renderer';
import {stripVideoDimensions} from './geometry';
import {loadVideo,disposeVideo,drawMotion,runCycle,type MotionSource} from './playback';
export async function createLiveStrip(composition:StripComposition,sources:(MotionSource|undefined)[],signal:AbortSignal){
  const dimensions=stripVideoDimensions(composition),layout=getStripLayout(composition),canvas=document.createElement('canvas');
  canvas.width=dimensions.width;canvas.height=dimensions.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas video is unavailable.');
  const entries:{video:HTMLVideoElement;source:MotionSource;index:number}[]=[];
  let base:ImageBitmap|undefined,overlay:ImageBitmap|undefined;
  const dispose=()=>{entries.forEach(e=>disposeVideo(e.video));base?.close();overlay?.close();canvas.width=0;canvas.height=0;};
  try{
    base=await createImageBitmap((await renderStrip(composition,signal,undefined,{dimensions,layer:'base'})).blob);
    overlay=await createImageBitmap((await renderStrip(composition,signal,undefined,{dimensions,layer:'decorations'})).blob);
    for(let index=0;index<sources.length;index++){
      const source=sources[index];if(!source)continue;
      try{entries.push({video:await loadVideo(source.url,signal),source,index});}
      catch{signal.throwIfAborted();/* An unavailable motion slot retains its final still. */}
    }
    const draw=()=>{
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base!,0,0);
      ctx.save();ctx.scale(canvas.width/layout.width,canvas.height/layout.height);
      for(const e of entries)drawMotion(ctx,e.video,e.source.capture,layout.slots[e.index]);
      ctx.restore();ctx.drawImage(overlay!,0,0);
    };
    draw();return {canvas,dimensions,draw,cycle:(progress?:(fraction:number)=>void)=>runCycle(entries,signal,draw,progress),dispose};
  }catch(error){dispose();throw error;}
}
