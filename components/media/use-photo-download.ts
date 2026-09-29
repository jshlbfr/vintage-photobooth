"use client";
import { useEffect, useRef, useState } from 'react';
import { usePhotoBoothSession } from '@/components/session/session-provider';
import { useMedia, useStripComposition } from './media-provider';
import { renderStrip } from '@/lib/render/strip-renderer';

export function usePhotoDownload(){
  const {session,dispatch}=usePhotoBoothSession(),{store}=useMedia(),composition=useStripComposition();
  const operation=useRef<AbortController|null>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('Your photos stay on this device.');
  useEffect(()=>()=>{operation.current?.abort();operation.current=null;},[session.id,session.customization,session.captures]);
  const download=async()=>{
    if(operation.current)return;
    const controller=new AbortController();operation.current=controller;setBusy(true);setMessage('Preparing your photo…');
    let temporary:string|undefined;
    try{
      let resourceId=session.outputs.photo?.resourceId;
      if(!resourceId||!store.getBlob(resourceId)){
        const output=await renderStrip(composition,controller.signal,(done,total)=>setMessage(`Preparing photo ${done} of ${total}…`));
        controller.signal.throwIfAborted();const reference=store.add(output.blob,output.width,output.height);
        if(reference.kind!=='local')throw new Error('Unable to save photo.');
        resourceId=reference.resourceId;temporary=resourceId;
        dispatch({type:'outputs/record',kind:'photo',output:{resourceId,mimeType:'image/png',createdAt:Date.now()}});
      }
      controller.signal.throwIfAborted();
      const blob=store.getBlob(resourceId);if(!blob)throw new Error('Your photo is no longer available. Please try again.');
      const url=store.resolve({kind:'local',resourceId,mimeType:'image/png',width:0,height:0});
      if(!url)throw new Error('Your photo is no longer available.');
      const link=document.createElement('a');link.href=url;link.download=`vintage-photobooth-${session.id.slice(0,8)}.png`;document.body.append(link);link.click();link.remove();temporary=undefined;
      setMessage('Your PNG is ready. Check your downloads.');
    }catch(error){if(temporary)store.release(temporary);if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Download failed. Please try again.');}
    finally{if(!controller.signal.aborted){setBusy(false);operation.current=null;}}
  };
  return {download,busy,message};
}
