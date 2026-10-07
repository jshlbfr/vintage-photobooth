import {selectRecordingType} from '../media/motion-recorder';
export function recordCanvas(canvas:HTMLCanvasElement,signal:AbortSignal,audio?:MediaStream,durationMs=10000){
  if(typeof MediaRecorder==='undefined'||typeof canvas.captureStream!=='function')throw new Error('Video export is unavailable in this browser. Your still photo and GIF remain available.');
  const stream=canvas.captureStream(24);for(const track of audio?.getAudioTracks()??[])stream.addTrack(track);
  let recorder:MediaRecorder;
  try{const mimeType=selectRecordingType();recorder=new MediaRecorder(stream,{...(mimeType?{mimeType}:{}),videoBitsPerSecond:4_000_000});}
  catch{stream.getTracks().forEach(t=>t.stop());throw new Error('This browser could not start video export.');}
  const chunks:Blob[]=[];let settled=false;
  let resolve!:(blob:Blob)=>void,reject!:(error:Error)=>void;
  const result=new Promise<Blob>((yes,no)=>{resolve=yes;reject=no;});
  // Aborts can happen before the caller reaches finish().
  void result.catch(()=>{});
  const cleanup=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);stream.getTracks().forEach(t=>t.stop());recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;};
  const fail=(error:Error)=>{if(settled)return;settled=true;try{if(recorder.state!=='inactive')recorder.stop();}catch{}cleanup();reject(error);};
  const abort=()=>fail(new DOMException('Cancelled','AbortError'));
  const timeout=setTimeout(()=>fail(new Error('Video export took too long. Please try again.')),Math.max(30000,durationMs*1.5+20000));
  signal.addEventListener('abort',abort,{once:true});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>fail(new Error('Video encoding failed. Please try again.'));
  recorder.onstop=()=>{if(settled)return;settled=true;const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'application/octet-stream'});cleanup();if(blob.size)resolve(blob);else reject(new Error('The video was empty. Please try again.'));};
  recorder.start(100);if(signal.aborted)abort();
  return {pause:()=>{if(recorder.state==='recording')recorder.pause();},resume:()=>{if(recorder.state==='paused')recorder.resume();},finish:()=>{if(!settled&&recorder.state!=='inactive')recorder.stop();return result;},cancel:abort};
}
