"use client";
import {useEffect,useRef,useState} from 'react';
import type {StripComposition} from '@/lib/composition';
import type {MotionSource} from '@/lib/video/playback';
import {createLiveStrip} from '@/lib/video/live-strip';
export function LiveStripPreview({composition,sources}:{composition:StripComposition;sources:(MotionSource|undefined)[]}){
  const mount=useRef<HTMLDivElement>(null),[message,setMessage]=useState('Preparing live preview…');
  // Parent mounts this only while preview is visible; references are stable for its lifetime.
  useEffect(()=>{
    const controller=new AbortController();let scene:Awaited<ReturnType<typeof createLiveStrip>>|undefined;
    void(async()=>{try{scene=await createLiveStrip(composition,sources,controller.signal);controller.signal.throwIfAborted();scene.canvas.setAttribute('aria-label','Your customized Live Strip, muted');scene.canvas.setAttribute('role','img');mount.current?.append(scene.canvas);setMessage('Muted preview · full countdowns with your saved photo filters.');while(!controller.signal.aborted)await scene.cycle();}catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Preview unavailable.');}finally{scene?.dispose();}})();
    return()=>{controller.abort();scene?.canvas.remove();};
  },[composition,sources]);
  return <><div className="live-strip-preview" ref={mount}/><p className="media-note" role="status">{message}</p></>;
}
