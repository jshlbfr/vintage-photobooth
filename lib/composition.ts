import type { PhotoCount, StickerKind } from "./design-data";
import { getFrameTemplate, resolveFrameLayout } from "./frame-templates";

/** Presentation geometry, shared by every strip. No media or session lifecycle here. */
export type StripComposition = {
  count: PhotoCount;
  photos: readonly { src?: string; alt: string; fit?: "cover" | "contain" }[];
  frameColor: string;
  frameStyle: string;
  filter: string;
  caption?: string;
  texts?: readonly {
    id: string; content: string; x: number; y: number; size: number; rotation: number;
    font: "ui" | "display" | "script"; color: string; alignment: "start" | "middle" | "end";
  }[];
  decorations?: readonly { kind: StickerKind; x: number; y: number; size: number; rotation: number }[];
};

export function getStripLayout(composition: Pick<StripComposition, "count" | "caption" | "frameStyle">) {
  return resolveFrameLayout(getFrameTemplate(composition.frameStyle), composition.count, Boolean(composition.caption));
}

/** Normalized centered cover crop for the future renderer and camera composition. */
export function getCoverCrop(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  if (Math.min(sourceWidth, sourceHeight, targetWidth, targetHeight) <= 0) {
    throw new RangeError("Image and slot dimensions must be positive.");
  }
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = targetWidth / scale;
  const height = targetHeight / scale;
  return { x: (sourceWidth - width) / 2, y: (sourceHeight - height) / 2, width, height };
}
