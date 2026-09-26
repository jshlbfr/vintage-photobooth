import { useId } from "react";
import { Sticker } from "@/components/artwork/sticker";
import { getStripLayout, type StripComposition } from "@/lib/composition";

/** One view for capture, customize, print, results, and decorative sample strips. */
export function PhotoStrip({ composition, empty = false, className = "", label = "Sample photostrip" }: { composition: StripComposition; empty?: boolean; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const layout = getStripLayout(composition);
  return <svg className={`photo-strip ${className}`} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={`${label}, ${composition.count} photos`}>
    <rect width={layout.width} height={layout.height} rx={layout.radius} fill={composition.frameColor} />
    {layout.slots.map((slot, index) => <g key={index}>
      <defs><clipPath id={`${id}-slot-${index}`}><rect {...slot} rx={Math.min(layout.radius, 10)} /></clipPath></defs>
      <rect {...slot} rx={Math.min(layout.radius, 10)} fill="#FFFBEA" />
      {!empty && composition.photos[index] && <g clipPath={`url(#${id}-slot-${index})`}>
        <image href={composition.photos[index].src} {...slot} preserveAspectRatio="xMidYMid slice" style={{ filter: composition.filter }} />
        <rect {...slot} fill="#4a2c12" opacity=".08" />
      </g>}
    </g>)}
    {!empty && composition.decorations?.map((decoration, index) => <g key={index} transform={`translate(${decoration.x * layout.width} ${decoration.y * layout.height}) rotate(${decoration.rotation} ${decoration.size / 2} ${decoration.size / 2})`}><svg width={decoration.size} height={decoration.size} viewBox="0 0 64 64"><Sticker kind={decoration.kind} /></svg></g>)}
    {composition.caption && <text x={layout.width / 2} y={layout.captionY} textAnchor="middle" className="strip-caption" fill="#F3E9D2">{composition.caption}</text>}
  </svg>;
}
