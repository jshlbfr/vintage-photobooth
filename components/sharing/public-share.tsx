"use client";
import {useEffect,useState} from 'react';
export function PublicShare({id,expiresAt,serverNow}:{id:string;expiresAt:string;serverNow:number}){
  const [expired,setExpired]=useState(false);
  useEffect(()=>{const timer=setTimeout(()=>setExpired(true),Math.max(0,Date.parse(expiresAt)-serverNow));return()=>clearTimeout(timer);},[expiresAt,serverNow]);
  if(expired)return <p>This photo strip has expired.</p>;
  const src=`/api/shares/${id}/image`;
  // Do not pass temporary private media through Next's persistent image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <><img src={src} alt="Shared Vintage Photobooth strip" onError={()=>setExpired(true)}/><a className="button" href={src} download="vintage-photobooth.png">Download Photo</a><p className="media-note">This temporary strip expires 10 minutes after it was shared.</p></>;
}
