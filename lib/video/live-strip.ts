import {gradeCanvas} from '../filters/engine';
import {getStripLayout,type StripComposition} from '../composition';
import {renderStrip} from '../render/strip-renderer';
import {stripVideoDimensions} from './geometry';
import {loadVideo,disposeVideo,drawMotion,runCycle,type MotionSource} from './playback';
export async function createLiveStrip(composition:StripComposition,sources:(MotionSource|undefined)[],signal:AbortSignal){
  const dimensions=stripVideoDimensions(composition),layout=getStripLayout(composition),canvas=document.createElement('canvas');
  canvas.width=dimensions.width;canvas.height=dimensions.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas video is unavailable.');
  const entries:{video:HTMLVideoElement;source:MotionSource;index:number;work:HTMLCanvasElement;time:number}[]=[];
  let base:ImageBitmap|undefined,overlay:ImageBitmap|undefined;
  const dispose=()=>{entries.forEach(e=>{disposeVideo(e.video);e.work.width=0;e.work.height=0;});base?.close();overlay?.close();canvas.width=0;canvas.height=0;};
  try{
    base=await createImageBitmap((await renderStrip(composition,signal,undefined,{dimensions,layer:'base'})).blob);
    overlay=await createImageBitmap((await renderStrip(composition,signal,undefined,{dimensions,layer:'decorations'})).blob);
    for(let index=0;index<sources.length;index++){
      const source=sources[index];if(!source)continue;
      try{entries.push({video:await loadVideo(source.url,signal),source,index,work:document.createElement('canvas'),time:-1});}
      catch{signal.throwIfAborted();/* An unavailable motion slot retains its final still. */}
    }
    const draw=()=>{
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base!,0,0);
      ctx.save();ctx.scale(canvas.width/layout.width,canvas.height/layout.height);
      for(const e of entries){
        const filter=e.source.capture.filterAtCapture;
        if(filter!=='original'&&e.video.readyState>=2&&e.time!==e.video.currentTime){
          const width=Math.min(e.video.videoWidth,entries.length>4?192:320),height=Math.round(e.video.videoHeight*width/e.video.videoWidth);
          if(e.work.width!==width||e.work.height!==height){e.work.width=width;e.work.height=height;}
          e.work.getContext('2d',{willReadFrequently:true})!.drawImage(e.video,0,0,width,height);
          gradeCanvas(e.work,filter);e.time=e.video.currentTime;
        }
        drawMotion(ctx,e.video,e.source.capture,layout.slots[e.index],filter==='original'?undefined:e.work);
      }
      ctx.restore();ctx.drawImage(overlay!,0,0);
    };
    draw();return {canvas,dimensions,draw,cycle:(progress?:(fraction:number)=>void)=>runCycle(entries,signal,draw,progress),dispose};
  }catch(error){dispose();throw error;}
}
