"use client";
import { useEffect, useState, type RefObject } from 'react';
import { SAMPLE_PORTRAIT } from '@/lib/design-data';

/** One small ungraded camera sample per camera/mirror change, shared by all presets. */
export function useThumbnailSource(video:RefObject<HTMLVideoElement|null>,mirrored:boolean,deviceId:string){
  const [source,setSource]=useState(SAMPLE_PORTRAIT);
  useEffect(()=>{
    let cancelled=false,url:string|undefined,timer:ReturnType<typeof setTimeout>;
    const sample=()=>{
      const v=video.current;
      if(!v||v.readyState<2||!v.videoWidth){timer=setTimeout(sample,150);return;}
      const canvas=document.createElement('canvas');canvas.width=200;canvas.height=Math.round(200*v.videoHeight/v.videoWidth);
      const ctx=canvas.getContext('2d');if(!ctx)return;
      if(mirrored){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
      ctx.drawImage(v,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>{canvas.width=0;canvas.height=0;if(cancelled||!blob)return;url=URL.createObjectURL(blob);setSource(url);},'image/jpeg',.94);
    };
    timer=setTimeout(sample,0);
    return()=>{cancelled=true;clearTimeout(timer);if(url)URL.revokeObjectURL(url);};
  },[video,mirrored,deviceId]);
  return source;
}
