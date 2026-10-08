"use client";

import { useEffect, useState, type SVGProps } from 'react';
import { gradeCanvas } from '@/lib/filters/engine';
import type { FilterId } from '@/lib/filters/presets';

type Entry = { refs: number; promise: Promise<string>; url?: string };
const cache = new Map<string, Entry>();
function acquire(src: string, filter: FilterId, width: number, flashExposure = false) {
  const key = `${src}|${filter}|${width}|${flashExposure}`;
  let entry = cache.get(key);
  if (!entry) {
    const current: Entry = { refs: 0, promise: Promise.resolve('') };
    current.promise = (async () => {
      const image = new Image(), canvas = document.createElement('canvas');
      try {
        image.src = src; await image.decode();
        if (!current.refs) throw new Error('Preview released');
        const scale = Math.min(1, width / Math.max(image.naturalWidth,image.naturalHeight));
        canvas.width = Math.max(1,Math.round(image.naturalWidth*scale)); canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
        const context = canvas.getContext('2d',{willReadFrequently:true}); if(!context)throw new Error('Canvas unavailable');
        context.drawImage(image,0,0,canvas.width,canvas.height); gradeCanvas(canvas,filter,17,flashExposure);
        const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Preview encoding failed')),'image/jpeg',.94));
        if (!current.refs) throw new Error('Preview released');
        current.url=URL.createObjectURL(blob); return current.url;
      } finally { image.src=''; canvas.width=0; canvas.height=0; }
    })();
    entry=current;cache.set(key,entry);
  }
  entry.refs++;
  const owned=entry;
  return { promise: owned.promise, release: () => { if(--owned.refs===0){if(owned.url)URL.revokeObjectURL(owned.url);if(cache.get(key)===owned)cache.delete(key);} } };
}
export function useFilteredSource(src: string | undefined, filter: FilterId, size=800, flashExposure=false) {
  const [result,setResult] = useState<{key:string;url:string;error?:boolean}|null>(null);
  const key=`${src}|${filter}|${size}|${flashExposure}`;
  useEffect(()=>{
    if(!src||(filter==='original'&&!flashExposure))return;
    let active=true;const lease=acquire(src,filter,size,flashExposure);
    lease.promise.then(url=>{if(active)setResult({key,url});}).catch(()=>{if(active)setResult({key,url:src,error:true});});
    return()=>{active=false;lease.release();};
  },[src,filter,size,key,flashExposure]);
  if(!src||(filter==='original'&&!flashExposure))return {src,error:false};
  return {src:result?.key===key?result.url:undefined,error:result?.key===key&&result.error};
}
export function FilteredPhoto({ src, filterId='original', flashExposure=false, ...props }: SVGProps<SVGImageElement> & {src?:string;filterId?:FilterId;flashExposure?:boolean}) {
  const image=useFilteredSource(src,filterId,800,flashExposure);
  return image.src ? <image {...props} href={image.src} data-filter={filterId}><title>{image.error?'Filter preview unavailable; showing original.':filterId}</title></image> : null;
}
export function FilterThumbnail({src,filterId}:{src:string;filterId:FilterId}) {
  const image=useFilteredSource(src,filterId,160);
  // Local Blob images cannot use the server image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return image.src ? <img src={image.src} alt="" width={80} height={80} /> : <span className="filter-loading" />;
}
