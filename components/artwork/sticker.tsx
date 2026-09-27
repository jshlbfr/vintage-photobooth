import Image, { getImageProps } from "next/image";
import { STICKER_ASSETS } from "@/lib/artwork";
import type { StickerKind } from "@/lib/design-data";

export function Sticker({ kind }: { kind: StickerKind }) {
  return <Image {...STICKER_ASSETS[kind]} alt="" className="sticker-art" sizes="64px" />;
}

/** SVG composition uses the same artwork, optimized without HTML inside SVG. */
export function StripSticker({ kind, size }: { kind: StickerKind; size: number }) {
  const asset = STICKER_ASSETS[kind];
  const { props } = getImageProps({ src: asset.src, alt: "", width: 96, height: Math.round(96 * asset.height / asset.width) });
  return <image href={props.src} width={size} height={size} preserveAspectRatio="xMidYMid meet" />;
}
