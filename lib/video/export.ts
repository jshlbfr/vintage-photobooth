import type {StripComposition} from '../composition';
import {createLiveStrip} from './live-strip';
import {loadVideo,disposeVideo,drawMotion,runCycle,type MotionSource} from './playback';
import {videoDimensions} from './geometry';
import {recordCanvas} from './record';
export async function exportLiveStrip(composition:StripComposition,sources:(MotionSource|undefined)[],signal:AbortSignal,progress:(message:string)=>void){
  progress('Preparing your customized strip…');
  const scene=await createLiveStrip(composition,sources,signal);let recording:ReturnType<typeof recordCanvas>|undefined;
  try{
    recording=recordCanvas(scene.canvas,signal);await scene.cycle(f=>progress(`Recording Live Strip… ${Math.round(f*100)}%`));
    signal.throwIfAborted();return {blob:await recording.finish(),...scene.dimensions};
  }finally{recording?.cancel();scene.dispose();}
}
export async function exportFullMoment(sources:MotionSource[],signal:AbortSignal,progress:(message:string)=>void){
  if(!sources.length)throw new Error('No camera recordings are available in this session.');
  // Resume inside the initiating click; never route this graph to physical speakers.
  let audio:AudioContext|undefined,destination:MediaStreamAudioDestinationNode|undefined;
  if(sources.some(s=>s.capture.motion?.hasAudio)){
    if(typeof AudioContext==='undefined')throw new Error('This browser cannot preserve compilation audio. Original recordings are still local.');
    audio=new AudioContext();destination=audio.createMediaStreamDestination();void audio.resume().catch(()=>{});
  }
  const canvas=document.createElement('canvas');let video:HTMLVideoElement|undefined,recording:ReturnType<typeof recordCanvas>|undefined,sourceNode:MediaElementAudioSourceNode|undefined;
  try{
    for(let i=0;i<sources.length;i++){
      progress(`Preparing moment ${i+1} of ${sources.length}…`);video=await loadVideo(sources[i].url,signal);
      if(i===0){const crop=sources[0].capture.motion!.crop;const dimensions=videoDimensions(video.videoWidth*crop.width,video.videoHeight*crop.height,1280,720);canvas.width=dimensions.width;canvas.height=dimensions.height;}
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Video canvas is unavailable.');
      if(audio&&destination){if(audio.state!=='running')throw new Error('Audio is paused by the browser. Close this preview and try Generate again.');sourceNode=audio.createMediaElementSource(video);sourceNode.connect(destination);video.muted=false;}
      const draw=()=>{ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);drawMotion(ctx,video!,sources[i].capture,{x:0,y:0,width:canvas.width,height:canvas.height});};
      draw();recording??=recordCanvas(canvas,signal,destination?.stream);recording.resume();
      await runCycle([{video,source:sources[i]}],signal,draw,f=>progress(`Recording moment ${i+1} of ${sources.length}… ${Math.round(f*100)}%`));
      recording.pause();sourceNode?.disconnect();sourceNode=undefined;disposeVideo(video);video=undefined;
    }
    signal.throwIfAborted();return {blob:await recording!.finish(),width:canvas.width,height:canvas.height};
  }finally{recording?.cancel();sourceNode?.disconnect();if(video)disposeVideo(video);destination?.stream.getTracks().forEach(t=>t.stop());if(audio)void audio.close().catch(()=>{});canvas.width=0;canvas.height=0;}
}
