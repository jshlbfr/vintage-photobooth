"use client";
import { useEffect,useRef,useState,type ReactNode } from 'react';
import { usePhotoBoothSession } from '@/components/session/session-provider';
import { useMedia } from './media-provider';
import { liveMoments,motionExtension } from '@/lib/media/live-moment';
import { useFilteredSource } from '@/components/filters/filtered-image';

export function ResultsMediaDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
  return <dialog ref={dialog} className="results-media-dialog" aria-labelledby="media-dialog-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="media-dialog-content"><header><h2 id="media-dialog-title">{title}</h2><button type="button" onClick={onClose} aria-label="Close media preview">×</button></header>{children}</div></dialog>;
}
export function GifPreview({src}:{src:string}){
  // Local generated media must not pass through the server image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="gif-preview" src={src} alt="Your captured photos playing in order" />;
}
export function LiveMomentPreview(){
  const {session}=usePhotoBoothSession(),{store}=useMedia();
  const moments=liveMoments(session);const [index,setIndex]=useState(0),[failed,setFailed]=useState(false);
  const current=moments[index],clip=current?store.resolve(current.motion.media):undefined;
  const poster=useFilteredSource(current?store.resolve(current.capture.still):undefined,current?.capture.filterAtCapture??'original');
  if(!current||!clip)return <p className="media-empty">No Live Moments in this session. Uploaded photos have no motion; camera recordings appear here when supported by your browser.</p>;
  const media=current.motion.media,mime=media.kind==='local'?store.getBlob(media.resourceId)?.type??media.mimeType:'video/webm';
  return <>
    <div className="moment-selector"><label>Moment <select aria-label="Choose Live Moment" value={index} onChange={e=>{setIndex(Number(e.target.value));setFailed(false);}}>{moments.map((m,i)=><option key={m.capture.id} value={i}>Photo {m.photoNumber}</option>)}</select></label><span>{index+1} of {moments.length}</span></div>
    <video key={current.capture.id} className="live-moment-video" src={clip} poster={poster.src} controls playsInline preload="metadata" onError={()=>setFailed(true)} />
    <p className="media-note">{current.motion.hasAudio?'Recorded with audio. Press Play to listen.':'Silent Live Moment.'} Motion video is unfiltered; the photo preview uses your selected look.</p>
    {failed&&<p role="status">This browser could not play the recording. You can still download the original file.</p>}
    <a className="button" href={clip} download={`vintage-photobooth-live-photo-${current.photoNumber}.${motionExtension(mime)}`}>Download Live Moment</a>
  </>;
}
