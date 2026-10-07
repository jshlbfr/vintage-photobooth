"use client";
import {useEffect,useRef,useState} from 'react';
import qrcode from 'qrcode-generator';
import {usePhotoBoothSession} from '@/components/session/session-provider';
import {useMedia,useStripComposition} from '@/components/media/media-provider';
import {renderStrip} from '@/lib/render/strip-renderer';
import {MAX_SHARE_BYTES} from '@/lib/sharing/policy';
type Share={id:string;url:string;expiresAt:string;serverNow:number};
function QR({url}:{url:string}){
  const code=qrcode(0,'M');code.addData(url);code.make();const size=code.getModuleCount(),cells=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(code.isDark(y,x))cells.push(`M${x+4},${y+4}h1v1h-1z`);
  return <svg className="share-qr" viewBox={`0 0 ${size+8} ${size+8}`} role="img" aria-label="QR code for your temporary photo strip" shapeRendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d={cells.join('')} fill="#000"/></svg>;
}
export function QRShare(){
  const {session,dispatch}=usePhotoBoothSession(),{store}=useMedia(),composition=useStripComposition();
  const [share,setShare]=useState<Share|null>(null),[remaining,setRemaining]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('Only your finished PNG strip will upload. The link expires in 10 minutes.');
  const operation=useRef<AbortController|null>(null);
  useEffect(()=>()=>operation.current?.abort(),[]);
  useEffect(()=>{if(!share)return;const end=performance.now()+Math.max(0,Date.parse(share.expiresAt)-share.serverNow);const update=()=>setRemaining(Math.max(0,Math.ceil((end-performance.now())/1000)));update();const timer=setInterval(update,1000);return()=>clearInterval(timer);},[share]);
  const create=async()=>{
    if(operation.current)return;const controller=new AbortController();operation.current=controller;setBusy(true);setMessage('Preparing your final strip…');
    try{
      let blob=session.outputs.photo?store.getBlob(session.outputs.photo.resourceId):undefined;
      if(!blob){const result=await renderStrip(composition,controller.signal);blob=result.blob;controller.signal.throwIfAborted();const reference=store.add(blob,result.width,result.height);if(reference.kind==='local')dispatch({type:'outputs/record',kind:'photo',output:{resourceId:reference.resourceId,mimeType:'image/png',createdAt:Date.now()}});}
      if(blob.size>MAX_SHARE_BYTES)throw new Error('This PNG is too large for QR sharing (4 MB maximum). Download Photo still saves the full-resolution strip.');
      setMessage('Creating your temporary share…');
      const response=await fetch('/api/shares',{method:'POST',headers:{'Content-Type':'image/png',Authorization:`Bearer ${session.rewards.shareReceipt??''}`},body:blob,signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error??'Sharing failed. Please try again.');
      setShare({...data,url:new URL(data.url,location.origin).href});setMessage('Anyone with this link can download the strip until it expires.');
    }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'Sharing failed. Your photos are still on this device.');}
    finally{operation.current=null;if(!controller.signal.aborted)setBusy(false);}
  };
  return <><p className="media-note" role="status">{message}</p>{share&&remaining>0?<><QR url={share.url}/><p>Expires in {String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</p><button className="button" onClick={()=>void navigator.clipboard.writeText(share.url).then(()=>setMessage('Link copied.')).catch(()=>setMessage('Copy the link below.'))}>Copy link</button><a className="share-link" href={share.url} target="_blank" rel="noreferrer">{share.url}</a></>:<>{share&&<p>This share has expired.</p>}<button className="button" disabled={busy} onClick={()=>void create()}>{busy?'Creating share…':share?'Create a new 10-minute share':'Create 10-minute QR share'}</button></>}</>;
}
