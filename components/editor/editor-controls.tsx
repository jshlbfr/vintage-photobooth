import { safeElement, sizeLimits, TEXT_COLORS, type Decoration } from '@/lib/editor/geometry';
export function EditorControls({element,onChange,onDelete,onLayer,onDone}:{element:Decoration;onChange:(e:Decoration)=>void;onDelete:()=>void;onLayer:(direction:-1|1)=>void;onDone:()=>void}){
  const [min,max]=sizeLimits(element);
  return <section className="editor-inspector" aria-label="Decoration controls">
    <div className="editor-inspector-heading"><strong>{element.type==='text'?'Edit text':'Edit sticker'}</strong><button type="button" onClick={onDone}>Done</button></div>
    {element.type==='text'&&<>
      <label>Text<textarea key={element.id} rows={3} maxLength={120} value={element.content} onChange={e=>onChange({...element,content:e.target.value.split('\n').slice(0,3).join('\n')})} /></label>
      <div className="editor-fields"><label>Font<select value={element.font} onChange={e=>onChange({...element,font:e.target.value as 'ui'|'display'|'script'})}><option value="ui">Poppins</option><option value="display">Playfair</option><option value="script">Allura</option></select></label><label>Align<select value={element.alignment} onChange={e=>onChange({...element,alignment:e.target.value as 'start'|'middle'|'end'})}><option value="start">Left</option><option value="middle">Center</option><option value="end">Right</option></select></label></div>
      <div className="text-colors" aria-label="Text colors">{TEXT_COLORS.map(color=><button key={color} type="button" aria-label={`Text color ${color}`} aria-pressed={element.color===color} style={{backgroundColor:color}} onClick={()=>onChange({...element,color})}>{element.color===color?'✓':''}</button>)}</div>
    </>}
    <label>Size<input aria-label="Decoration size" type="range" min={min*1000} max={max*1000} step={1} value={element.size*1000} onChange={e=>onChange({...element,size:Number(e.target.value)/1000})} /></label>
    <label>Rotation <output>{Math.round(element.rotation)}°</output><input aria-label="Decoration rotation" type="range" min={-180} max={180} step={1} value={element.rotation} onChange={e=>onChange({...element,rotation:Number(e.target.value)})} /></label>
    <div className="editor-nudge" aria-label="Move decoration">{[['Left','←',-.01,0],['Up','↑',0,-.01],['Down','↓',0,.01],['Right','→',.01,0]].map(([name,icon,x,y])=><button key={name} type="button" aria-label={`Move ${String(name).toLowerCase()}`} onClick={()=>onChange(safeElement({...element,x:element.x+Number(x),y:element.y+Number(y)}))}>{icon}</button>)}</div>
    <div className="editor-fields"><button type="button" onClick={()=>onLayer(-1)}>Send backward</button><button type="button" onClick={()=>onLayer(1)}>Bring forward</button></div>
    <button className="editor-delete" type="button" onClick={onDelete}>Delete decoration</button>
  </section>;
}
