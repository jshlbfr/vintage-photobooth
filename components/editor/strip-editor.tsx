"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { PhotoStrip } from '@/components/photobooth/photo-strip';
import { getStripLayout, type StripComposition } from '@/lib/composition';
import { orderedElements, safeElement, stickerDimensions, type Decoration } from '@/lib/editor/geometry';
import { textGeometry } from '@/lib/editor/text';

type Gesture={pointer:number;mode:'move'|'resize'|'rotate';original:Decoration;start:DOMPoint;latest:Decoration};
export function StripEditor({composition,selectedId,onSelect,onCommit}:{composition:StripComposition;selectedId:string|null;onSelect:(id:string|null)=>void;onCommit:(element:Decoration)=>void}){
  const svg=useRef<SVGSVGElement>(null), gesture=useRef<Gesture|null>(null);
  const [draft,setDraft]=useState<Decoration|null>(null),[zoom,setZoom]=useState(1);
  const layout=getStripLayout(composition);
  useEffect(()=>{
    const el=svg.current;if(!el)return;
    const update=()=>{const m=el.getScreenCTM();if(m)setZoom(Math.hypot(m.a,m.b));};
    const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();
  },[]);
  const point=(e:ReactPointerEvent)=>new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse());
  const active=draft?.id===selectedId?draft:null;
  const shown=active?{...composition,decorations:composition.decorations?.map(s=>s.id===active.id&&active.type==='sticker'?active:s),texts:composition.texts?.map(t=>t.id===active.id&&active.type==='text'?active:t)}:composition;
  const elements=orderedElements(shown), selected=elements.find(e=>e.id===selectedId);
  const begin=(e:ReactPointerEvent<SVGElement>,element:Decoration,mode:Gesture['mode'])=>{
    if(e.button!==0||gesture.current)return;
    e.preventDefault();e.stopPropagation();onSelect(element.id);e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current={pointer:e.pointerId,mode,original:element,start:point(e),latest:element};setDraft(element);
  };
  const move=(e:ReactPointerEvent<SVGElement>)=>{
    const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
    const p=point(e), o=g.original, cx=o.x*layout.width, cy=o.y*layout.height;
    let next={...o};
    if(g.mode==='move')next={...o,x:o.x+(p.x-g.start.x)/layout.width,y:o.y+(p.y-g.start.y)/layout.height};
    if(g.mode==='resize')next={...o,size:o.size*Math.hypot(p.x-cx,p.y-cy)/Math.max(1,Math.hypot(g.start.x-cx,g.start.y-cy))};
    if(g.mode==='rotate')next={...o,rotation:o.rotation+(Math.atan2(p.y-cy,p.x-cx)-Math.atan2(g.start.y-cy,g.start.x-cx))*180/Math.PI};
    g.latest=safeElement(next);setDraft(g.latest);
  };
  const end=(e:ReactPointerEvent<SVGElement>,cancel=false)=>{
    const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;
    gesture.current=null;setDraft(null);if(!cancel)onCommit(g.latest);
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const handlers={onPointerMove:move,onPointerUp:(e:ReactPointerEvent<SVGElement>)=>end(e),onPointerCancel:(e:ReactPointerEvent<SVGElement>)=>end(e,true),onLostPointerCapture:(e:ReactPointerEvent<SVGElement>)=>end(e,true)};
  const bounds=(e:Decoration)=>e.type==='sticker'?stickerDimensions(e,layout):textGeometry(e,layout);
  const handle=14/zoom;
  const selectedBounds=selected?bounds(selected):null;
  return <PhotoStrip composition={shown} svgRef={svg} onPointerDown={()=>onSelect(null)} label="Editable photostrip" editorLayer={<g className="editor-layer">
    {elements.map(e=>{const b=bounds(e);return <rect key={e.id} data-editor-object={e.id} role="button" tabIndex={0} aria-label={e.type==='sticker'?`${e.assetId} sticker`:`Text: ${e.content}`} aria-pressed={e.id===selectedId} transform={`translate(${e.x*layout.width} ${e.y*layout.height}) rotate(${e.rotation})`} x={-b.width/2} y={-b.height/2} width={b.width} height={b.height} fill="transparent" className="editor-object" onFocus={()=>onSelect(e.id)} onPointerDown={event=>begin(event,e,'move')} {...handlers} onKeyDown={event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(e.id);}
      const step=event.shiftKey?.025:.005;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();onCommit(safeElement({...e,x:e.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),y:e.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)}));}
    }} />;})}
    {selected&&selectedBounds&&<g className="selection-controls" transform={`translate(${selected.x*layout.width} ${selected.y*layout.height}) rotate(${selected.rotation})`}>
      <rect x={-selectedBounds.width/2} y={-selectedBounds.height/2} width={selectedBounds.width} height={selectedBounds.height} fill="none" stroke="#B65A33" strokeWidth={1.5/zoom} pointerEvents="none" />
      <line x1={0} y1={-selectedBounds.height/2} x2={0} y2={-selectedBounds.height/2-handle*2} stroke="#B65A33" strokeWidth={1/zoom} pointerEvents="none" />
      {(['resize','rotate'] as const).map(mode=><g key={mode} role="button" aria-label={`${mode==='resize'?'Resize':'Rotate'} selected decoration`} className={`editor-handle ${mode}`} onPointerDown={e=>begin(e,selected,mode)} {...handlers}>
        <circle cx={mode==='resize'?selectedBounds.width/2:0} cy={mode==='resize'?selectedBounds.height/2:-selectedBounds.height/2-handle*2} r={handle} fill="transparent" />
        <circle cx={mode==='resize'?selectedBounds.width/2:0} cy={mode==='resize'?selectedBounds.height/2:-selectedBounds.height/2-handle*2} r={handle*.55} fill="#fff" stroke="#B65A33" strokeWidth={1.5/zoom} pointerEvents="none" />
      </g>)}
    </g>}
  </g>} />;
}
