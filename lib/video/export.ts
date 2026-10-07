import type {StripComposition} from '../composition';
import {createLiveStrip} from './live-strip';
import {loadVideo,disposeVideo,drawMotion,runCycle,type MotionSource} from './playback';
import {videoDimensions} from './geometry';
import {recordCanvas} from './record';
export async function exportLiveStrip(composition:StripComposition,sources:(MotionSource|undefined)[],signal:AbortSignal,progress:(message:string)=>void){
  progress('Preparing your customized strip…');
  const scene=await createLiveStrip(composition,sources,signal);let recording:ReturnType<typeof recordCanvas>|undefined;
  try{
    recording=recordCanvas(scene.canvas,signal,undefined,Math.max(1000,...sources.map(s=>s?.capture.motion?.durationMs??0)));await scene.cycle(f=>progress(`Recording Live Strip… ${Math.round(f*100)}%`));
    signal.throwIfAborted();return {blob:await recording.finish(),...scene.dimensions};
  }finally{recording?.cancel();scene.dispose();}
}
/** Export a single continuous recording. Never splice independent camera runs. */
export async function exportFullMoment(source:MotionSource,signal:AbortSignal,progress:(message:string)=>void){
  const durationMs=source.capture.motion!.sourceDurationMs!;
  const fullSource={...source,capture:{...source.capture,motion:{...source.capture.motion!,startMs:0,durationMs}}};
  let audio:AudioContext|undefined,destination:MediaStreamAudioDestinationNode|undefined;
  if(source.capture.motion?.hasAudio){
    if(typeof AudioContext==='undefined')throw new Error('This browser cannot preserve recording audio. Your original recording is still local.');
    audio=new AudioContext();destination=audio.createMediaStreamDestination();void audio.resume().catch(()=>{});
  }
  const canvas=document.createElement('canvas');let video:HTMLVideoElement|undefined,recording:ReturnType<typeof recordCanvas>|undefined,sourceNode:MediaElementAudioSourceNode|undefined;
  try{
    progress('Preparing your continuous recording…');video=await loadVideo(source.url,signal);
    const crop=source.capture.motion!.crop,dimensions=videoDimensions(video.videoWidth*crop.width,video.videoHeight*crop.height,1280,720);
    canvas.width=dimensions.width;canvas.height=dimensions.height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Video canvas is unavailable.');
    if(audio&&destination){if(audio.state!=='running')throw new Error('Audio is paused by the browser. Close this preview and try Generate again.');sourceNode=audio.createMediaElementSource(video);sourceNode.connect(destination);video.muted=false;}
    const draw=()=>{ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);drawMotion(ctx,video!,source.capture,{x:0,y:0,width:canvas.width,height:canvas.height});};
    draw();recording=recordCanvas(canvas,signal,destination?.stream,durationMs);
    await runCycle([{video,source:fullSource}],signal,draw,f=>progress(`Preparing Full Live Moment… ${Math.round(f*100)}%`));
    signal.throwIfAborted();return {blob:await recording.finish(),...dimensions};
  }finally{recording?.cancel();sourceNode?.disconnect();if(video)disposeVideo(video);destination?.stream.getTracks().forEach(t=>t.stop());if(audio)void audio.close().catch(()=>{});canvas.width=0;canvas.height=0;}
}
