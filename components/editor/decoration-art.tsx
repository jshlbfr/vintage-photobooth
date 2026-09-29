import { STICKER_ASSETS } from '@/lib/artwork';
import { stickerDimensions, type Decoration } from '@/lib/editor/geometry';
import { textGeometry } from '@/lib/editor/text';
import type { FrameLayout } from '@/lib/frame-templates';

export function DecorationArt({element,layout}:{element:Decoration;layout:FrameLayout}) {
  if(element.type==='sticker'){
    const {width,height}=stickerDimensions(element,layout);
    return <image href={STICKER_ASSETS[element.assetId].src} x={-width/2} y={-height/2} width={width} height={height} preserveAspectRatio="xMidYMid meet" />;
  }
  const text=textGeometry(element,layout);
  return <text fontSize={text.fontSize} fontFamily={text.family} fontWeight={400} fill={element.color} textAnchor={element.alignment}>
    {text.lines.map((line,i)=><tspan key={i} x={text.anchor} y={text.baseline+i*text.lineHeight}>{line||' '}</tspan>)}
  </text>;
}
