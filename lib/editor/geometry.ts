import { STICKER_ASSETS } from '../artwork';
import type { StripComposition } from '../composition';
import type { FrameLayout } from '../frame-templates';
import type { PlacedSticker, PlacedText, Customization } from '../session/types';

export type Decoration = (PlacedSticker & { type: 'sticker' }) | (PlacedText & { type: 'text' });
export const TEXT_COLORS = ['#FFFFFF', '#1D1812', '#F3E9D2', '#702C2B', '#BE9340'] as const;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function orderedElements(composition: Pick<StripComposition, 'decorations' | 'texts'>): Decoration[] {
  return [...(composition.decorations ?? []).map(s => ({ ...s, type: 'sticker' as const })), ...(composition.texts ?? []).map(t => ({ ...t, type: 'text' as const }))].sort((a,b) => a.layer-b.layer || a.id.localeCompare(b.id));
}
export function elementsFromCustomization(c: Customization) { return orderedElements({ decorations: c.stickers, texts: c.texts }); }
export function sizeLimits(element: Decoration) { return element.type === 'sticker' ? [.08, .8] as const : [.025, .16] as const; }
export function safeElement<T extends Decoration>(element: T): T {
  const [min,max] = sizeLimits(element);
  // Keeping the center on the strip makes edge-overlapping objects recoverable.
  return { ...element, x: clamp(element.x, 0, 1), y: clamp(element.y, 0, 1), size: clamp(element.size, min, max), rotation: ((element.rotation % 360) + 540) % 360 - 180 };
}
export function patchElement(c: Customization, element: Decoration): Customization {
  const safe = safeElement(element);
  return safe.type === 'sticker' ? { ...c, stickers: c.stickers.map(s => s.id === safe.id ? safe : s) } : { ...c, texts: c.texts.map(t => t.id === safe.id ? safe : t) };
}
export function deleteElement(c: Customization, id: string): Customization { return { ...c, stickers: c.stickers.filter(s=>s.id!==id), texts:c.texts.filter(t=>t.id!==id) }; }
export function reorderElement(c: Customization, id: string, direction: -1 | 1): Customization {
  const all=elementsFromCustomization(c), index=all.findIndex(e=>e.id===id), other=index+direction;
  if(index<0||other<0||other>=all.length)return c;
  [all[index],all[other]]=[all[other],all[index]];
  const layers=new Map(all.map((e,i)=>[e.id,i]));
  return { ...c, stickers:c.stickers.map(e=>({...e,layer:layers.get(e.id)!})), texts:c.texts.map(e=>({...e,layer:layers.get(e.id)!})) };
}
export function newPlacement(c: Customization) {
  const all=elementsFromCustomization(c), n=all.length;
  return { x:.4+(n%3)*.1, y:.42+(Math.floor(n/3)%4)*.06, rotation:0, layer:Math.max(-1,...all.map(e=>e.layer))+1 };
}
export function stickerDimensions(element: PlacedSticker, layout: FrameLayout) {
  const asset=STICKER_ASSETS[element.assetId], width=element.size*layout.width;
  return { width, height:width*asset.height/asset.width };
}
export function exportDimensions(layout: FrameLayout) {
  const targetWidth=new Set(layout.slots.map(s=>s.x)).size===2?2000:1200;
  const scale=Math.min(targetWidth/layout.width,4096/Math.max(layout.width,layout.height),Math.sqrt(8_000_000/(layout.width*layout.height)));
  return { width:Math.round(layout.width*scale),height:Math.round(layout.height*scale),scale };
}
