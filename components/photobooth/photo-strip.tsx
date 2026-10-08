"use client";

import { FilteredPhoto } from "@/components/filters/filtered-image";
import { useEffect, useId, useState, type ReactNode, type Ref, type PointerEventHandler } from "react";
import { DecorationArt } from "@/components/editor/decoration-art";
import { orderedElements } from "@/lib/editor/geometry";
import { getStripLayout, type StripComposition } from "@/lib/composition";
import { photoImageRect } from '@/lib/editor/photo-geometry';
import { getFrameTemplate } from "@/lib/frame-templates";

/** One view for capture, customize, print, results, and decorative sample strips. */
export function PhotoStrip({ composition, empty = false, className = "", label = "Your photostrip", editorLayer, svgRef, onPointerDown }: { editorLayer?: ReactNode; svgRef?: Ref<SVGSVGElement>; onPointerDown?: PointerEventHandler<SVGSVGElement>; composition: StripComposition; empty?: boolean; className?: string; label?: string }) {
  const [,fontsReady]=useState(false);
  useEffect(()=>{let active=true;void document.fonts.ready.then(()=>{if(active)fontsReady(true);});return()=>{active=false;};},[]);
  const id = useId().replace(/:/g, "");
  const layout = getStripLayout(composition);
  const template = getFrameTemplate(composition.frameStyle);
  const artwork = template.kind === "asset" ? template.variants[composition.count] : undefined;
  const frameImage = artwork && <image href={artwork.asset} width={layout.width} height={layout.height} />;
  return <svg ref={svgRef} onPointerDown={onPointerDown} className={`photo-strip strip-preview ${editorLayer?'is-editable':''} ${className}`} data-columns={new Set(layout.slots.map(slot => slot.x)).size} viewBox={`0 0 ${layout.width} ${layout.height}`} role={editorLayer ? "group" : "img"} aria-label={`${label}, ${composition.count} photos`}>
    <rect {...(layout.backing ?? {width:layout.width,height:layout.height})} rx={layout.backing?.radius ?? layout.radius} fill={composition.frameColor} />
    {artwork?.layer === "background" && frameImage}
    {layout.slots.map((slot, index) => <g key={index}>
      <defs><clipPath id={`${id}-slot-${index}`}><rect {...slot} rx={slot.radius} /></clipPath></defs>
      <rect {...slot} rx={slot.radius} fill={empty || !composition.photos[index]?.src ? "#e7ddc8" : "#050403"} />
      {!empty && composition.photos[index]?.src && <g clipPath={`url(#${id}-slot-${index})`}>
        <FilteredPhoto src={composition.photos[index].src} filterId={composition.photos[index].filterId ?? "original"} flashExposure={composition.photos[index].flashExposure} {...(composition.photos[index].width && composition.photos[index].height && composition.photos[index].fit !== "contain" ? photoImageRect(composition.photos[index].width!,composition.photos[index].height!,slot,composition.photos[index].adjustment,composition.photos[index].initialCrop) : slot)} preserveAspectRatio={composition.photos[index].fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"} />
      </g>}
    </g>)}
    {artwork?.layer === "overlay" && frameImage}
    <defs><clipPath id={`${id}-frame`}><rect width={layout.width} height={layout.height} rx={layout.radius} /></clipPath></defs>
    {!empty && <g clipPath={`url(#${id}-frame)`}>{orderedElements(composition).map(element=><g key={element.id} data-decoration-id={element.id} transform={`translate(${element.x*layout.width} ${element.y*layout.height}) rotate(${element.rotation})`}><DecorationArt element={element} layout={layout} /></g>)}</g>}
    {composition.caption && layout.captionY !== undefined && <text x={layout.width / 2} y={layout.captionY} textAnchor="middle" className="strip-caption" fill="#F3E9D2">{composition.caption}</text>}
    {editorLayer}
  </svg>;
}
