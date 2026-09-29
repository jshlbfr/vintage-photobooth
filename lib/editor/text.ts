import type { PlacedText } from '../session/types';
import type { FrameLayout } from '../frame-templates';
let measure: CanvasRenderingContext2D | null = null;
export function fontFamily(font: PlacedText['font']) {
  return typeof document === 'undefined' ? (font==='ui'?'sans-serif':'serif') : getComputedStyle(document.documentElement).getPropertyValue(`--font-${font}`).trim() || 'serif';
}
/** Identical line positions/baseline/font metrics in SVG and Canvas. */
export function textGeometry(text: PlacedText, layout: FrameLayout) {
  const fontSize=text.size*layout.width, family=fontFamily(text.font);
  if(typeof document!=='undefined')measure ??= document.createElement('canvas').getContext('2d');
  if(measure)measure.font=`400 ${fontSize}px ${family}`;
  const lines=text.content.split('\n').slice(0,3), lineHeight=fontSize*1.25;
  const width=Math.max(fontSize,...lines.map(line=>measure?.measureText(line).width ?? line.length*fontSize*.6));
  const height=lines.length*lineHeight;
  const ascent=measure?.measureText('Mg').actualBoundingBoxAscent ?? fontSize*.8;
  const descent=measure?.measureText('Mg').actualBoundingBoxDescent ?? fontSize*.2;
  const baseline=-height/2+(lineHeight+ascent-descent)/2;
  const anchor=text.alignment==='start'?-width/2:text.alignment==='end'?width/2:0;
  return {width,height,fontSize,family,lines,lineHeight,baseline,anchor};
}
