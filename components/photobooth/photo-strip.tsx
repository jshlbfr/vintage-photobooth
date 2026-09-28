import { useId } from "react";
import { StripSticker } from "@/components/artwork/sticker";
import { getStripLayout, type StripComposition } from "@/lib/composition";
import { getFrameTemplate } from "@/lib/frame-templates";

/** One view for capture, customize, print, results, and decorative sample strips. */
export function PhotoStrip({ composition, empty = false, className = "", label = "Your photostrip" }: { composition: StripComposition; empty?: boolean; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const layout = getStripLayout(composition);
  const template = getFrameTemplate(composition.frameStyle);
  const artwork = template.kind === "asset" ? template.variants[composition.count] : undefined;
  const frameImage = artwork && <image href={artwork.asset} width={layout.width} height={layout.height} />;
  return <svg className={`photo-strip strip-preview ${className}`} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={`${label}, ${composition.count} photos`}>
    <rect width={layout.width} height={layout.height} rx={layout.radius} fill={composition.frameColor} />
    {artwork?.layer === "background" && frameImage}
    {layout.slots.map((slot, index) => <g key={index}>
      <defs><clipPath id={`${id}-slot-${index}`}><rect {...slot} rx={slot.radius} /></clipPath></defs>
      <rect {...slot} rx={slot.radius} fill={empty || !composition.photos[index]?.src ? "#e7ddc8" : "#050403"} />
      {!empty && composition.photos[index]?.src && <g clipPath={`url(#${id}-slot-${index})`}>
        <image href={composition.photos[index].src} {...slot} preserveAspectRatio={composition.photos[index].fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"} style={{ filter: composition.filter }} />
        <rect {...slot} fill="#4a2c12" opacity=".08" />
      </g>}
    </g>)}
    {artwork?.layer === "overlay" && frameImage}
    {!empty && composition.decorations?.map((decoration, index) => <g key={index} transform={`translate(${decoration.x * layout.width} ${decoration.y * layout.height}) rotate(${decoration.rotation} ${decoration.size / 2} ${decoration.size / 2})`}><StripSticker kind={decoration.kind} size={decoration.size} /></g>)}
    {composition.caption && layout.captionY !== undefined && <text x={layout.width / 2} y={layout.captionY} textAnchor="middle" className="strip-caption" fill="#F3E9D2">{composition.caption}</text>}
    {composition.texts?.map(text => <text key={text.id} x={text.x * layout.width} y={text.y * layout.height} fontSize={text.size * layout.width} fontFamily={`var(--font-${text.font})`} fill={text.color} textAnchor={text.alignment} transform={`rotate(${text.rotation} ${text.x * layout.width} ${text.y * layout.height})`}>{text.content}</text>)}
  </svg>;
}
