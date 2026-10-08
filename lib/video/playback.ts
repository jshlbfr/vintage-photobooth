import { photoCrop, type PhotoAdjustment } from '../editor/photo-geometry';
import type { Capture } from '../session/types';
import { clipSeconds, motionCrop } from './geometry';
import { wait } from '../media/countdown';
export type MotionSource={capture:Capture;url:string};
export async function loadVideo(url:string,signal:AbortSignal){
  const video=document.createElement('video');video.playsInline=true;video.muted=true;video.preload='auto';
  try{
    await new Promise<void>((resolve,reject)=>{
      const clean=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);video.onloadeddata=null;video.onerror=null;};
      const abort=()=>{clean();reject(new DOMException('Cancelled','AbortError'));};
      const timeout=setTimeout(()=>{clean();reject(new Error('A recorded clip could not be opened. Try another browser.'));},15000);
      video.onloadeddata=()=>{clean();resolve();};video.onerror=()=>{clean();reject(new Error('A recorded clip is not playable in this browser.'));};
      signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}video.src=url;video.load();
    });
    return video;
  }catch(error){disposeVideo(video);throw error;}
}
export function disposeVideo(video:HTMLVideoElement){video.pause();video.removeAttribute('src');video.load();}
export function drawMotion(ctx:CanvasRenderingContext2D,video:HTMLVideoElement,capture:Capture,slot:{x:number;y:number;width:number;height:number;radius?:number},graded?:HTMLCanvasElement,adjustment?:PhotoAdjustment,stripPhoto=false){
  if(!capture.motion||video.readyState<2)return;
  const crop=stripPhoto&&capture.initialCrop?photoCrop(graded?.width??video.videoWidth,graded?.height??video.videoHeight,slot.width,slot.height,adjustment?{...adjustment,x:capture.motion.mirrored?1-adjustment.x:adjustment.x}:undefined,capture.initialCrop):motionCrop(graded?.width??video.videoWidth,graded?.height??video.videoHeight,capture.motion,slot.width,slot.height);
  ctx.save();ctx.beginPath();ctx.roundRect(slot.x,slot.y,slot.width,slot.height,slot.radius??0);ctx.clip();
  ctx.translate(slot.x+(capture.motion.mirrored?slot.width:0),slot.y);if(capture.motion.mirrored)ctx.scale(-1,1);
  ctx.drawImage(graded??video,crop.x,crop.y,crop.width,crop.height,0,0,slot.width,slot.height);ctx.restore();
}
export async function seekStart(video:HTMLVideoElement,signal:AbortSignal,start=0){
  video.pause();if(Math.abs(video.currentTime-start)<.01)return;
  video.currentTime=start;
  const deadline=performance.now()+1500;
  while(video.seeking&&performance.now()<deadline)await wait(10,signal);
  signal.throwIfAborted();if(video.seeking)throw new Error('This browser could not seek the recorded countdown. Your still photos are safe.');
}
export async function runCycle(entries:{video:HTMLVideoElement;source:MotionSource}[],signal:AbortSignal,draw:()=>void,progress?:(fraction:number)=>void){
  await Promise.all(entries.map(e=>seekStart(e.video,signal,(e.source.capture.motion?.startMs??0)/1000)));
  await Promise.all(entries.map(e=>e.video.play()));
  const duration=Math.max(...entries.map(e=>clipSeconds(e.source.capture)),1),started=performance.now();
  try{
    while(performance.now()-started<duration*1000){
      signal.throwIfAborted();if(document.hidden)throw new Error('Keep this tab visible while playing or generating video.');
      const elapsed=(performance.now()-started)/1000;
      for(const {video,source} of entries){
        // Shorter clips hold their last frame until the entire group restarts.
        const end=clipSeconds(source.capture),start=(source.capture.motion?.startMs??0)/1000;
        if(elapsed>=end){video.pause();continue;}
        if(!video.ended&&!video.seeking&&Math.abs(video.currentTime-start-elapsed)>.18)video.currentTime=start+Math.min(elapsed,end-.02);
      }
      draw();progress?.(Math.min(1,elapsed/duration));await wait(1000/24,signal);
    }
    draw();
  }finally{for(const e of entries)e.video.pause();}
}
