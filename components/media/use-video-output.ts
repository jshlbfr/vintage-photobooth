"use client";
import {useEffect,useRef,useState} from 'react';
import {usePhotoBoothSession} from '@/components/session/session-provider';
import {useMedia,useStripComposition} from './media-provider';
import {exportFullMoment,exportLiveStrip} from '@/lib/video/export';
import {continuousMoment} from '@/lib/media/live-moment';
export type VideoOutput='live-strip'|'full-live-moment';
export function useVideoOutput(){
  const {session,dispatch}=usePhotoBoothSession(),{store}=useMedia(),composition=useStripComposition();
  const operation=useRef<AbortController|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>()=>{operation.current?.abort();operation.current=null;},[session.id,session.customization,session.captures]);
  const sources=session.captures.map(capture=>{const url=capture.source==='camera'&&capture.motion?store.resolve(capture.motion.media):undefined;return url?{capture,url}:undefined;});
  const fullCapture=continuousMoment(session);
  const fullUrl=fullCapture?.motion?store.resolve(fullCapture.motion.media):undefined;
  const fullSource=fullCapture&&fullUrl?{capture:fullCapture,url:fullUrl}:undefined;
  const cancel=()=>{operation.current?.abort();operation.current=null;setBusy(false);setMessage('');};
  const output=(kind:VideoOutput)=>{const record=session.outputs[kind];return record?{src:store.resolve({kind:'local',resourceId:record.resourceId,mimeType:record.mimeType,width:0,height:0}),mime:record.mimeType}:undefined;};
  const generate=async(kind:VideoOutput)=>{
    if(operation.current)return;
    if(kind==='full-live-moment'&&!fullSource){setMessage('A continuous recording is unavailable because the camera was interrupted. Your photos and available Live Strip moments are safe.');return;}
    const controller=new AbortController();operation.current=controller;setBusy(true);setMessage('Preparing video…');
    try{
      const result=await(kind==='live-strip'?exportLiveStrip(composition,sources,controller.signal,setMessage):exportFullMoment(fullSource!,controller.signal,setMessage));
      controller.signal.throwIfAborted();const reference=store.add(result.blob,result.width,result.height);
      if(reference.kind==='local')dispatch({type:'outputs/record',kind,output:{resourceId:reference.resourceId,mimeType:result.blob.type,createdAt:Date.now()}});
      setMessage('Your video is ready.');
    }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Video generation failed. Please try again.');}
    finally{if(operation.current===controller){operation.current=null;setBusy(false);}}
  };
  return {sources,fullSource,composition,generate,cancel,busy,message,output};
}
