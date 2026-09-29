"use client";

import { ActionLink, BackLink, Button } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { Sticker } from "@/components/artwork/sticker";
import { useState } from 'react';
import { StripEditor } from '@/components/editor/strip-editor';
import { EditorControls } from '@/components/editor/editor-controls';
import { deleteElement, elementsFromCustomization, newPlacement, patchElement, reorderElement, type Decoration } from '@/lib/editor/geometry';
import type { Customization } from '@/lib/session/types';
import { FramePicker } from "@/components/photobooth/frame-picker";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useStripComposition } from "@/components/media/media-provider";
import { FRAME_COLORS, FRAME_STYLES, STICKERS } from "@/lib/design-data";

export function CustomizeScreen() {
  const { session, dispatch } = usePhotoBoothSession();
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [past,setPast]=useState<Customization[]>([]),[future,setFuture]=useState<Customization[]>([]);
  const customization=session.customization;
  const selected=elementsFromCustomization(customization).find(e=>e.id===selectedId);
  const commit=(next:Customization)=>{
    if(JSON.stringify(next)===JSON.stringify(customization))return;
    setPast(p=>[...p.slice(-39),customization]);setFuture([]);
    dispatch({type:'customization/replace',customization:next});
  };
  const change=(element:Decoration)=>commit(patchElement(customization,element));
  const remove=()=>{if(selected){commit(deleteElement(customization,selected.id));setSelectedId(null);}};
  const undo=()=>{const previous=past.at(-1);if(previous){setPast(p=>p.slice(0,-1));setFuture(f=>[customization,...f]);dispatch({type:'customization/replace',customization:previous});setSelectedId(null);}};
  const redo=()=>{const next=future[0];if(next){setPast(p=>[...p,customization]);setFuture(f=>f.slice(1));dispatch({type:'customization/replace',customization:next});setSelectedId(null);}};
  const color = session.customization.frameColor;
  const frame = FRAME_STYLES.findIndex(entry => entry.id === session.customization.frameId);
  const composition = useStripComposition();

  return <div className="customize-workspace" onKeyDown={e=>{
    if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]'))return;
    if(e.key==='Escape')setSelectedId(null);
    if(selected&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();remove();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
  }} onPointerDown={e=>{if(!(e.target as HTMLElement).closest('.customize-preview,.editor-inspector,.sticker-palette,.add-text,.editor-history'))setSelectedId(null);}}><Panel className={`workspace-panel customize-panel ${selected?'is-editing':''}`} labelledBy="customize-title">
    <header className="panel-heading customize-heading"><BackLink href="/capture" label="Back to capture preview" /><h1 id="customize-title">Customize Your Photo</h1><p>Choose a frame. Change Color. Add stickers. Add text.</p><div className="editor-history"><button type="button" onClick={undo} disabled={!past.length}>Undo</button><button type="button" onClick={redo} disabled={!future.length}>Redo</button></div></header>
    <FramePicker composition={composition} frameIndex={frame} onChange={(index) => commit({...customization,frameId:FRAME_STYLES[index].id})} />
    <div className="customize-tools">
      <fieldset className="color-fieldset"><legend>Frame Color</legend><div className="color-palette">{FRAME_COLORS.map((swatch) => <button key={swatch.name} type="button" className="color-swatch" style={{ backgroundColor: swatch.value }} aria-label={swatch.name} title={swatch.name} aria-pressed={color === swatch.value} onClick={() => commit({...customization,frameColor:swatch.value})}>{color === swatch.value && <span className="swatch-check"><Icon name="check" /></span>}</button>)}</div></fieldset>
      <fieldset className="sticker-fieldset"><legend>Stickers</legend><div className="sticker-palette">{STICKERS.map((kind) => <button type="button" key={kind} aria-label={`Add ${kind.replaceAll("-", " ")} sticker`} onClick={()=>{const id=crypto.randomUUID();commit({...customization,stickers:[...customization.stickers,{id,assetId:kind,...newPlacement(customization),size:.28}]});setSelectedId(id);}}><Sticker kind={kind} /></button>)}</div></fieldset>
    </div>
    <Button className="add-text" onClick={()=>{const id=crypto.randomUUID();commit({...customization,texts:[...customization.texts,{id,...newPlacement(customization),size:.07,content:'Your text',font:'ui',color:'#FFFFFF',alignment:'middle'}]});setSelectedId(id);}}><Icon name="text" />Add Text</Button>
    {selected&&<EditorControls element={selected} onChange={change} onDelete={remove} onDone={()=>setSelectedId(null)} onLayer={direction=>commit(reorderElement(customization,selected.id,direction))} />}
    <div className="customize-preview"><StripEditor composition={composition} selectedId={selected?.id??null} onSelect={setSelectedId} onCommit={change} /></div>
    <ActionLink href="/print" className="print-action">Print</ActionLink>
  </Panel></div>;
}
