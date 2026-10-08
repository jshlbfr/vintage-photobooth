"use client";
import { useEffect, useRef, useState } from 'react';
import { usePhotoBoothSession } from '@/components/session/session-provider';
import { useMedia, useStripComposition } from './media-provider';
import { generateGif } from '@/lib/gif/generate';
import { getStripLayout } from '@/lib/composition';
import { gifDimensions } from '@/lib/gif/geometry';
export function useGif(){
  const {session,dispatch}=usePhotoBoothSession(),{store}=useMedia(),composition=useStripComposition();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');const operation=useRef<AbortController|null>(null);
  useEffect(()=>()=>{operation.current?.abort();operation.current=null;},[session.id,session.captures,session.customization]);
  const record=session.outputs.gif;
  const src=record?store.resolve({kind:'local',resourceId:record.resourceId,mimeType:'image/gif',width:0,height:0}):undefined;
  const cancel=()=>{operation.current?.abort();operation.current=null;setBusy(false);setMessage('');};
  const generate=async(force=false)=>{
    if(operation.current||(!force&&src))return;
    const controller=new AbortController();operation.current=controller;setBusy(true);setMessage('Preparing your GIF…');
    try{
      const sources=session.captures.map((c,index)=>{
        const blob=c.still.kind==='local'?store.getBlob(c.still.resourceId):undefined;
        if(!blob)throw new Error('A source photo is missing. Return to Capture and try again.');
        const slot=getStripLayout(composition).slots[index];
        return {blob,adjustment:composition.photos[index].adjustment,initialCrop:c.initialCrop,flashExposure:c.flashExposure,slotRatio:slot.width/slot.height,filter:c.filterAtCapture,fit:c.source==='sample'?'contain' as const:'cover' as const};
      });
      const dimensions=gifDimensions(composition);
      const blob=await generateGif({...dimensions,sources},controller.signal,(done,total)=>setMessage(done===total?'Encoding your GIF…':`Preparing photo ${done} of ${total}…`));
      controller.signal.throwIfAborted();const reference=store.add(blob,dimensions.width,dimensions.height);
      if(reference.kind==='local')dispatch({type:'outputs/record',kind:'gif',output:{resourceId:reference.resourceId,mimeType:'image/gif',createdAt:Date.now()}});
      setMessage('Your GIF is ready.');
    }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'GIF generation failed. Please try again.');}
    finally{if(operation.current===controller){operation.current=null;setBusy(false);}}
  };
  return {generate,cancel,busy,message,src};
}
