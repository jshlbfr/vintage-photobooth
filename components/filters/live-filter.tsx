"use client";
import { useEffect, useRef, useState, type RefObject } from 'react';
import { gradeCanvas } from '@/lib/filters/engine';
import type { FilterId } from '@/lib/filters/presets';

export function LiveFilter({video,filter,mirrored}:{video:RefObject<HTMLVideoElement|null>;filter:FilterId;mirrored:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [ready,setReady]=useState<string|null>(null);
  useEffect(()=>{
    if(filter==='original')return;
    let cancelled=false, timer:ReturnType<typeof setTimeout>;
    const draw=()=>{
      if(cancelled)return;
      const source=video.current,target=canvas.current;
      if(source&&target&&source.readyState>=2&&!document.hidden){
        try {
          const scale=Math.min(1,384/source.videoWidth);
          const w=Math.round(source.videoWidth*scale),h=Math.round(source.videoHeight*scale);
          if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
          const ctx=target.getContext('2d',{willReadFrequently:true});
          ctx?.drawImage(source,0,0,w,h);gradeCanvas(target,filter);setReady(filter);
        } catch { setReady(null); }
      }
      timer=setTimeout(draw,125);
    };
    timer=setTimeout(draw,0);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[video,filter]);
  return filter==='original'?null:<canvas ref={canvas} aria-hidden="true" className="live-filter-canvas" style={{visibility:ready===filter?'visible':'hidden',transform:mirrored?'scaleX(-1)':undefined}} />;
}
