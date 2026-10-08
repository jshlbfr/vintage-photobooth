"use client";
import { useRef, type PointerEvent } from 'react';
import { DEFAULT_PHOTO_ADJUSTMENT, constrainPhotoAdjustment, dragPhoto, type PhotoAdjustment } from '@/lib/editor/photo-geometry';
import type { StripComposition } from '@/lib/composition';
import type { PhotoSlot } from '@/lib/frame-templates';
type Photo = StripComposition['photos'][number];
type Callbacks = {onDraft:(id:string,value:PhotoAdjustment|null)=>void;onCommit:(id:string,value:PhotoAdjustment)=>void};

export function PhotoEditLayer({photos,slots,selectedId,onSelect,onDraft,onCommit}:{photos:StripComposition['photos'];slots:readonly PhotoSlot[];selectedId:string|null;onSelect:(id:string)=>void}&Callbacks){
  const gesture=useRef<{pointer:number;id:string;start:DOMPoint;original:PhotoAdjustment;latest:PhotoAdjustment}|null>(null);
  const point=(e:PointerEvent<SVGRectElement>)=>new DOMPoint(e.clientX,e.clientY).matrixTransform(e.currentTarget.ownerSVGElement!.getScreenCTM()!.inverse());
  return <g>{photos.map((photo,index)=>{
    if(!photo.id||!photo.width||!photo.height)return null;
    const id=photo.id,slot=slots[index],active=id===selectedId;
    const finish=(e:PointerEvent<SVGRectElement>,cancel=false)=>{
      const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
      gesture.current=null;onDraft(id,null);if(!cancel)onCommit(id,g.latest);
      if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    };
    return <rect key={id} {...slot} rx={slot.radius} data-photo-id={id} role="button" tabIndex={0} aria-label={`Adjust photo ${index+1}`} aria-pressed={active} aria-describedby="photo-adjust-help" fill="transparent" className={`photo-edit-target ${active?'is-selected':''}`}
      onClick={e=>{e.stopPropagation();onSelect(id);}}
      onPointerDown={e=>{
        e.stopPropagation();if(e.button!==0||gesture.current)return;
        // First tap selects; only the selected photo captures drag gestures.
        if(!active){onSelect(id);return;}
        e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
        const original=photo.adjustment??DEFAULT_PHOTO_ADJUSTMENT;
        gesture.current={pointer:e.pointerId,id,start:point(e),original,latest:original};
      }}
      onPointerMove={e=>{
        const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
        const p=point(e);g.latest=dragPhoto(photo.width!,photo.height!,slot.width,slot.height,g.original,p.x-g.start.x,p.y-g.start.y,photo.initialCrop);onDraft(id,g.latest);
      }} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}
      onKeyDown={e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id);}
        const directions:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        const d=directions[e.key];if(!d)return;e.preventDefault();e.stopPropagation();onSelect(id);
        const step=e.shiftKey?.05:.01;onCommit(id,dragPhoto(photo.width!,photo.height!,slot.width,slot.height,photo.adjustment??DEFAULT_PHOTO_ADJUSTMENT,d[0]*slot.width*step,d[1]*slot.height*step,photo.initialCrop));
      }} />;
  })}</g>;
}

export function PhotoControls({photo,slot,index,onDraft,onCommit,onDone}:{photo:Photo;slot:PhotoSlot;index:number;onDone:()=>void}&Callbacks){
  const pending=useRef<PhotoAdjustment|null>(null),id=photo.id!;
  const value=photo.adjustment??DEFAULT_PHOTO_ADJUSTMENT;
  const finish=()=>{if(pending.current){const next=pending.current;pending.current=null;onDraft(id,null);onCommit(id,next);}};
  return <section className="editor-inspector photo-inspector" aria-label="Photo controls">
    <div className="editor-inspector-heading"><strong>Adjust Photo {index+1}</strong><button type="button" onClick={()=>{finish();onDone();}}>Done</button></div>
    <p>Drag the selected photo to reposition it. Use arrow keys for small moves.</p>
    <label>Zoom <output>{value.zoom.toFixed(2)}×</output><input aria-label="Photo zoom" type="range" min="1" max="4" step="0.01" value={value.zoom} onChange={e=>{
      const next=constrainPhotoAdjustment(photo.width!,photo.height!,slot.width,slot.height,{...value,zoom:Number(e.target.value)},photo.initialCrop);pending.current=next;onDraft(id,next);
    }} onPointerUp={finish} onKeyUp={finish} onBlur={finish} onPointerCancel={()=>{pending.current=null;onDraft(id,null);}} /></label>
    <button type="button" onClick={()=>{pending.current=null;onDraft(id,null);onCommit(id,{...DEFAULT_PHOTO_ADJUSTMENT});}}>Reset Photo</button>
  </section>;
}
