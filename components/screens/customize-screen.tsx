"use client";

import { ActionLink, BackLink, Button } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { Sticker } from "@/components/artwork/sticker";
import { PhotoControls, PhotoEditLayer } from '@/components/editor/photo-controls';
import { getStripLayout } from '@/lib/composition';
import type { PhotoAdjustment } from '@/lib/editor/photo-geometry';
import { useState } from 'react';
import { StripEditor } from '@/components/editor/strip-editor';
import { EditorControls } from '@/components/editor/editor-controls';
import { deleteElement, elementsFromCustomization, newPlacement, patchElement, reorderElement, type Decoration } from '@/lib/editor/geometry';
import type { Customization } from '@/lib/session/types';
import { FramePicker } from "@/components/photobooth/frame-picker";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useStripComposition } from "@/components/media/media-provider";
import { FRAME_COLORS, STICKERS } from "@/lib/design-data";

import { framesForCount, type FrameStyle } from "@/lib/frame-templates";

export function CustomizeScreen() {
  const {session}=usePhotoBoothSession();
  return <CustomizeEditor key={session.id} />;
}
function CustomizeEditor() {
  const { session, dispatch } = usePhotoBoothSession();
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [past,setPast]=useState<Customization[]>([]),[future,setFuture]=useState<Customization[]>([]);
  const [photoId,setPhotoId]=useState<string|null>(null);
  const [photoDraft,setPhotoDraft]=useState<{id:string;value:PhotoAdjustment}|null>(null);
  const selectDecoration=(id:string|null)=>{setSelectedId(id);setPhotoId(null);setPhotoDraft(null);};
  const selectPhoto=(id:string)=>{setSelectedId(null);setPhotoId(id);};
  const draftPhoto=(id:string,value:PhotoAdjustment|null)=>setPhotoDraft(value?{id,value}:null);
  const customization=session.customization;
  const selected=elementsFromCustomization(customization).find(e=>e.id===selectedId);
  const commit=(next:Customization)=>{
    if(JSON.stringify(next)===JSON.stringify(customization))return;
    setPast(p=>[...p.slice(-39),customization]);setFuture([]);
    dispatch({type:'customization/replace',customization:next});
  };
  const change=(element:Decoration)=>commit(patchElement(customization,element));
  const remove=()=>{if(selected){commit(deleteElement(customization,selected.id));setSelectedId(null);setPhotoId(null);setPhotoDraft(null);}};
  const undo=()=>{const previous=past.at(-1);if(previous){setPast(p=>p.slice(0,-1));setFuture(f=>[customization,...f]);dispatch({type:'customization/replace',customization:previous});setSelectedId(null);setPhotoId(null);setPhotoDraft(null);}};
  const redo=()=>{const next=future[0];if(next){setPast(p=>[...p,customization]);setFuture(f=>f.slice(1));dispatch({type:'customization/replace',customization:next});setSelectedId(null);setPhotoId(null);setPhotoDraft(null);}};
  const color = session.customization.frameColor;
  const frames = framesForCount(session.preferences.photoCount);
  const frame = frames.findIndex(entry => entry.id === session.customization.frameId);
  const savedComposition = useStripComposition();
  const composition=photoDraft?{...savedComposition,photos:savedComposition.photos.map(p=>p.id===photoDraft.id?{...p,adjustment:photoDraft.value}:p)}:savedComposition;
  const photoIndex=composition.photos.findIndex(p=>p.id===photoId);
  const photo=composition.photos[photoIndex];
  const layout=getStripLayout(composition);
  const commitPhoto=(id:string,value:PhotoAdjustment)=>commit({...customization,photoAdjustments:{...customization.photoAdjustments,[id]:value}});

  return <div className="customize-workspace" onKeyDown={e=>{
    if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]'))return;
    if(e.key==='Escape')selectDecoration(null);
    if(selected&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();remove();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
  }} onPointerDown={e=>{if(!(e.target as HTMLElement).closest('.customize-preview,.editor-inspector,.sticker-palette,.add-text,.editor-history'))selectDecoration(null);}}><Panel className={`workspace-panel customize-panel ${selected||photo?'is-editing':''}`} labelledBy="customize-title">
    <header className="panel-heading customize-heading"><BackLink href="/capture" label="Back to capture preview" /><h1 id="customize-title">Customize Your Photo</h1><p>Choose a frame. Change Color. Add stickers. Add text.</p><div className="editor-history"><button type="button" onClick={undo} disabled={!past.length} aria-label="Undo" title="Undo"><Icon name="undo" /></button><button type="button" onClick={redo} disabled={!future.length} aria-label="Redo" title="Redo"><Icon name="redo" /></button></div></header>
    <FramePicker composition={composition} frameIndex={frame} onChange={(index) => commit({...customization,frameId:frames[index].id as FrameStyle})} />
    <div className="customize-tools">
      <fieldset className="color-fieldset"><legend>Frame Color</legend><div className="color-palette">{FRAME_COLORS.map((swatch) => <button key={swatch.name} type="button" className="color-swatch" style={{ backgroundColor: swatch.value }} aria-label={swatch.name} title={swatch.name} aria-pressed={color === swatch.value} onClick={() => commit({...customization,frameColor:swatch.value})}>{color === swatch.value && <span className="swatch-check"><Icon name="check" /></span>}</button>)}</div></fieldset>
      <fieldset className="sticker-fieldset"><legend>Stickers</legend><div className="sticker-palette">{STICKERS.map((kind) => <button type="button" key={kind} aria-label={`Add ${kind.replaceAll("-", " ")} sticker`} onClick={()=>{const id=crypto.randomUUID();commit({...customization,stickers:[...customization.stickers,{id,assetId:kind,...newPlacement(customization),size:.28}]});selectDecoration(id);}}><Sticker kind={kind} /></button>)}</div></fieldset>
    </div>
    <Button className="add-text" onClick={()=>{const id=crypto.randomUUID();commit({...customization,texts:[...customization.texts,{id,...newPlacement(customization),size:.07,content:'Your text',font:'ui',color:'#FFFFFF',alignment:'middle'}]});selectDecoration(id);}}><Icon name="text" />Add Text</Button>
    {selected&&<EditorControls element={selected} onChange={change} onDelete={remove} onDone={()=>setSelectedId(null)} onLayer={direction=>commit(reorderElement(customization,selected.id,direction))} />}
    {photo&&<PhotoControls key={photo.id} photo={photo} slot={layout.slots[photoIndex]} index={photoIndex} onDraft={draftPhoto} onCommit={commitPhoto} onDone={()=>setPhotoId(null)} />}
    <div className="customize-preview"><StripEditor composition={composition} selectedId={selected?.id??null} onSelect={selectDecoration} onCommit={change} photoLayer={<PhotoEditLayer photos={composition.photos} slots={layout.slots} selectedId={photoId} onSelect={selectPhoto} onDraft={draftPhoto} onCommit={commitPhoto} />} /><p id="photo-adjust-help" className="photo-adjust-help"><strong>Tap a photo to adjust it.</strong><span>Drag to reposition, or use the zoom slider.</span></p></div>
    <ActionLink href="/print" className="print-action">Print</ActionLink>
  </Panel></div>;
}
