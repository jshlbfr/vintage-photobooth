"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from 'react-dom';
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useMedia } from "./media-provider";
import { captureStill, decodeUpload } from "@/lib/media/still-image";
import { beginMotion } from "@/lib/media/motion-recorder";
import { runCountdown, wait } from "@/lib/media/countdown";
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
  const recorder=useRef<ReturnType<typeof beginMotion>>(null);
  const transition=(next:Phase)=>{phaseRef.current=next;if(mounted.current)setPhase(next);};
  const cancel=useCallback(()=>{
    operation.current?.abort();recorder.current?.cancel();recorder.current=null;
  },[]);
  useEffect(()=>{
    mounted.current=true;
    const hidden=()=>{if(document.hidden){pauseRequested.current=true;cancel();}};
    document.addEventListener('visibilitychange',hidden);
    return()=>{mounted.current=false;document.removeEventListener('visibilitychange',hidden);cancel();};
  },[cancel,session.id]);
  const stream=camera.getVideoStream();
  useEffect(()=>()=>cancel(),[stream,cancel]);
  const complete=session.captures.length>=session.preferences.photoCount;
  const busy=phase==='counting'||phase==='capturing'||phase==='uploading';
  const continuous=session.preferences.timerSeconds!==1;
  const pause=()=>{
    pauseRequested.current=true;
    if(phaseRef.current==='counting')cancel();
    setMessage('Paused. Resume when you’re ready.');
  };
  const capture=async()=>{
    if(operation.current||complete||state.status!=='ready'||!video.current)return;
    const element=video.current,controller=new AbortController();operation.current=controller;
    pauseRequested.current=false;setMessage('');
    let count=session.captures.length;
    const allocated:MediaReference[]=[];
    try {
      do {
        transition('counting');
        await runCountdown(session.preferences.timerSeconds,controller.signal,remaining=>{
          setCountdown(remaining);
          if(remaining===1){const stream=camera.getRecordingStream();recorder.current=stream?beginMotion(stream):null;}
        });
        controller.signal.throwIfAborted();
        if(element.readyState<2||!element.videoWidth)throw new Error('The camera is warming up. Try again in a moment.');
        transition('capturing');
        if(session.preferences.flash){
          flushSync(()=>setFlash(true));
          await afterPaint(controller.signal);
          // Give the illuminated camera scene time to reach the incoming video.
          await wait(60,controller.signal);
        }
        controller.signal.throwIfAborted();
        const timestamp=Date.now();
        // Read the raw video, never the HTML flash or the filtered preview canvas.
        const [still]=await Promise.all([
          captureStill(element,session.preferences.mirrored),
          session.preferences.flash ? wait(80,controller.signal) : Promise.resolve(),
        ]);
        if(session.preferences.flash)setFlash(false);
        controller.signal.throwIfAborted();
        let motion:Capture['motion'];
        const activeRecorder=recorder.current;
        if(activeRecorder){
          await wait(700,controller.signal);
          const clip=await activeRecorder.finish();controller.signal.throwIfAborted();
          if(clip){const media=store.add(clip.blob,element.videoWidth,element.videoHeight);allocated.push(media);motion={media,durationMs:clip.durationMs,hasAudio:clip.hasAudio,mirrored:session.preferences.mirrored,crop:still.crop};}
        }
        recorder.current=null;
        const reference=store.add(still.blob,still.width,still.height);allocated.push(reference);
        dispatch({type:'captures/add',sessionId:session.id,capture:{id:crypto.randomUUID(),source:'camera',still:reference,capturedAt:timestamp,filterAtCapture:session.customization.filterId,mirrorApplied:session.preferences.mirrored,...(motion?{motion}:{})}});
        allocated.length=0;count++;
        setMessage(count===session.preferences.photoCount?'All photos are ready. Choose your frame.':pauseRequested.current?'Paused. Resume when you’re ready.':motion?`Photo saved · motion ${motion.hasAudio?'with audio':'without audio'}.`:'Photo saved. Motion recording is unavailable in this browser.');
      } while(continuous&&count<session.preferences.photoCount&&!pauseRequested.current&&!controller.signal.aborted);
    } catch(error){
      if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Capture failed. Please try again.');
    } finally {
      for(const reference of allocated)if(reference.kind==='local')store.release(reference.resourceId);
      recorder.current?.cancel();recorder.current=null;
      operation.current=null;
      if(mounted.current){setCountdown(null);setFlash(false);transition(count>=session.preferences.photoCount?'complete':pauseRequested.current?'paused':'idle');}
    }
  };
  const upload=async(files:File[]|null)=>{
    if(!files?.length||operation.current||complete)return;
    const controller=new AbortController();operation.current=controller;transition('uploading');setMessage('');
    const capacity=session.preferences.photoCount-session.captures.length,selected=files.slice(0,capacity),errors:string[]=[];
    try {
      for(const file of selected){
        try{const image=await decodeUpload(file,controller.signal);controller.signal.throwIfAborted();
          const still=store.add(image.blob,image.width,image.height);
          dispatch({type:'captures/add',sessionId:session.id,capture:{id:crypto.randomUUID(),source:'upload',still,capturedAt:Date.now(),filterAtCapture:session.customization.filterId}});
        }catch(error){if(controller.signal.aborted)break;errors.push(error instanceof Error?error.message:'The image could not be opened.');}
      }
      if(!controller.signal.aborted)setMessage(errors[0]??(files.length>capacity?`Added ${capacity} photos. Extra images were skipped.`:'Photos added from your device.'));
    }finally{operation.current=null;if(mounted.current)transition('idle');}
  };
  const restart=()=>{pauseRequested.current=false;cancel();setCountdown(null);setFlash(false);setMessage('');transition('idle');dispatch({type:'captures/restart'});};
  return {capture,upload,restart,pause,phase,busy,continuous,countdown,flash,message,complete};
}
