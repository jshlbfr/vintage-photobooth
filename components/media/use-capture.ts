"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from 'react-dom';
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useMedia } from "./media-provider";
import { captureStill, decodeUpload } from "@/lib/media/still-image";
import { beginMotion } from "@/lib/media/motion-recorder";
import { runCountdown, wait } from "@/lib/media/countdown";
import { CaptureSound } from '@/lib/media/capture-sound';
import { afterPaint } from '@/lib/media/paint';
import type { Capture, MediaReference } from "@/lib/session/types";

type Phase = 'idle' | 'counting' | 'capturing' | 'paused' | 'complete' | 'uploading';
export function useCapture(video: RefObject<HTMLVideoElement | null>) {
  const { session, dispatch } = usePhotoBoothSession();
  const { camera, store, state } = useMedia();
  const [phase,setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const [countdown,setCountdown] = useState<number|null>(null);
  const [flash,setFlash] = useState(false);
  const [message,setMessage] = useState('');
  const operation=useRef<AbortController|null>(null);
  const mounted=useRef(false), pauseRequested=useRef(false);
  const sound=useRef<CaptureSound|null>(null);
  useEffect(()=>()=>{sound.current?.dispose();sound.current=null;},[session.id]);
  const recorder=useRef<ReturnType<typeof beginMotion>>(null);
  type Segment = { id: string; still: MediaReference; startMs: number; durationMs: number; mirrored: boolean; crop: NonNullable<Capture['motion']>['crop'] };
  const segments=useRef<Segment[]>([]);
  const recordingGeneration=useRef(0);
  const recordingSize=useRef({width:0,height:0});
  const flashTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const clearFlash=useCallback(()=>{if(flashTimer.current)clearTimeout(flashTimer.current);flashTimer.current=null;if(mounted.current)setFlash(false);},[]);
  const transition=(next:Phase)=>{phaseRef.current=next;if(mounted.current)setPhase(next);};
  const finishRecording=useCallback(async()=>{
    const active=recorder.current, moments=segments.current, dimensions=recordingSize.current, generation=recordingGeneration.current;
    recorder.current=null;segments.current=[];
    if(!active)return false;
    const clip=await active.finish();
    // Reset/session replacement may have released all of these stills while encoding.
    const retained=moments.filter(moment=>store.resolve(moment.still));
    if(!clip||!retained.length||generation!==recordingGeneration.current)return false;
    const media=store.add(clip.blob,dimensions.width,dimensions.height);
    dispatch({type:'captures/motion',sessionId:session.id,moments:retained.map(({id,startMs,durationMs,mirrored,crop})=>({id,motion:{media,startMs,durationMs,sourceDurationMs:clip.durationMs,hasAudio:clip.hasAudio,mirrored,crop}}))});
    return true;
  },[dispatch,session.id,store]);
  const cancelCountdown=useCallback(()=>{
    sound.current?.stop();operation.current?.abort();recorder.current?.pause();
  },[]);
  useEffect(()=>{
    mounted.current=true;
    const hidden=()=>{if(document.hidden){pauseRequested.current=true;cancelCountdown();clearFlash();}};
    document.addEventListener('visibilitychange',hidden);
    return()=>{mounted.current=false;document.removeEventListener('visibilitychange',hidden);cancelCountdown();clearFlash();void finishRecording();};
  },[cancelCountdown,clearFlash,finishRecording]);
  const stream=camera.getVideoStream();
  useEffect(()=>()=>{cancelCountdown();void finishRecording();},[stream,cancelCountdown,finishRecording]);
  const complete=session.captures.length>=session.preferences.photoCount;
  const busy=phase==='counting'||phase==='capturing'||phase==='uploading';
  const continuous=session.preferences.timerSeconds!==1;
  const pause=()=>{
    pauseRequested.current=true;
    if(phaseRef.current==='counting')cancelCountdown();
    setMessage('Paused. Resume when you’re ready.');
  };
  const capture=async()=>{
    if(operation.current||complete||state.status!=='ready'||!video.current)return;
    const element=video.current,controller=new AbortController();operation.current=controller;
    if(session.preferences.captureSound){sound.current??=new CaptureSound();sound.current.unlock();}
    pauseRequested.current=false;setMessage('');
    let count=session.captures.length;
    const allocated:MediaReference[]=[];
    try {
      if(!recorder.current){
        const source=camera.getRecordingStream();recorder.current=source?beginMotion(source):null;
        recordingSize.current={width:element.videoWidth,height:element.videoHeight};
      }
      recorder.current?.resume();
      do {
        transition('counting');
        const startMs=recorder.current?.currentTimeMs()??0;
        await runCountdown(session.preferences.timerSeconds,controller.signal,remaining=>{
          if(remaining>0){flushSync(()=>setCountdown(remaining));if(remaining>1&&session.preferences.captureSound)sound.current?.beep();}
        });
        controller.signal.throwIfAborted();
        if(element.readyState<2||!element.videoWidth)throw new Error('The camera is warming up. Try again in a moment.');
        transition('capturing');
        const flashStarted=performance.now();
        if(session.preferences.flash){
          flushSync(()=>setFlash(true));
          flashTimer.current=setTimeout(()=>{flashTimer.current=null;if(mounted.current)setFlash(false);},400);
        }
        if(session.preferences.captureSound)sound.current?.shutter();
        if(session.preferences.flash){
          await afterPaint(controller.signal);
          await wait(Math.max(0,120-(performance.now()-flashStarted)),controller.signal);
        }
        controller.signal.throwIfAborted();
        const timestamp=Date.now();
        // Read the raw camera frame independently from the HTML illumination overlay.
        const stillPromise=captureStill(element,session.preferences.mirrored);
        const endMs=recorder.current?.currentTimeMs()??startMs;
        // Freeze only after a manual/final shutter, never between automatic cycles.
        if(!continuous||count+1===session.preferences.photoCount||pauseRequested.current)recorder.current?.pause();
        const still=await stillPromise;
        controller.signal.throwIfAborted();
        const reference=store.add(still.blob,still.width,still.height);allocated.push(reference);
        const id=crypto.randomUUID();
        if(recorder.current?.available)segments.current.push({id,still:reference,startMs,durationMs:endMs-startMs,mirrored:session.preferences.mirrored,crop:still.crop});
        dispatch({type:'captures/add',sessionId:session.id,capture:{id,source:'camera',still:reference,capturedAt:timestamp,filterAtCapture:session.customization.filterId,mirrorApplied:session.preferences.mirrored}});
        allocated.length=0;count++;
        setMessage(count===session.preferences.photoCount?'All photos are ready. Choose your frame.':pauseRequested.current?'Paused. Resume when you’re ready.':recorder.current?.available?'Photo saved · the full countdown is recorded.':'Photo saved. Motion recording is unavailable in this browser.');
      } while(continuous&&count<session.preferences.photoCount&&!pauseRequested.current&&!controller.signal.aborted);
      if(count>=session.preferences.photoCount&&!await finishRecording())setMessage('Your photos are ready. Motion recording was unavailable; your still photos are safe.');
      // Keep the established 400 ms flash visible after the last/manual shutter.
      if(flashTimer.current)await wait(300,controller.signal);
    } catch(error){
      if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Capture failed. Please try again.');
    } finally {
      for(const reference of allocated)if(reference.kind==='local')store.release(reference.resourceId);
      recorder.current?.pause();
      operation.current=null;
      if(mounted.current){setCountdown(null);transition(controller.signal.aborted?'paused':count>=session.preferences.photoCount?'complete':pauseRequested.current?'paused':'idle');}
    }
  };
  const upload=async(files:File[]|null)=>{
    if(!files?.length||operation.current||complete)return;
    const controller=new AbortController();operation.current=controller;transition('uploading');setMessage('');
    const capacity=session.preferences.photoCount-session.captures.length,selected=files.slice(0,capacity),errors:string[]=[];let added=0;
    try {
      for(const file of selected){
        try{const image=await decodeUpload(file,controller.signal);controller.signal.throwIfAborted();
          const still=store.add(image.blob,image.width,image.height);
          dispatch({type:'captures/add',sessionId:session.id,capture:{id:crypto.randomUUID(),source:'upload',still,capturedAt:Date.now(),filterAtCapture:session.customization.filterId}});added++;
        }catch(error){if(controller.signal.aborted)break;errors.push(error instanceof Error?error.message:'The image could not be opened.');}
      }
      if(added===capacity)await finishRecording();
      if(!controller.signal.aborted)setMessage(errors[0]??(files.length>capacity?`Added ${capacity} photos. Extra images were skipped.`:'Photos added from your device.'));
    }finally{operation.current=null;if(mounted.current)transition('idle');}
  };
  const restart=()=>{pauseRequested.current=false;recordingGeneration.current++;cancelCountdown();recorder.current?.cancel();recorder.current=null;segments.current=[];clearFlash();setCountdown(null);setMessage('');transition('idle');dispatch({type:'captures/restart'});};
  return {capture,upload,restart,pause,phase,busy,continuous,countdown,flash,message,complete};
}
