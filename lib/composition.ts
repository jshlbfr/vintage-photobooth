import type { PhotoAdjustment, NormalizedCrop } from './editor/photo-geometry';
import type { PlacedSticker, PlacedText } from "./session/types";
import type { PhotoCount, FilterId } from "./design-data";
import { getFrameTemplate, resolveFrameLayout } from "./frame-templates";

/** Presentation geometry, shared by every strip. No media or session lifecycle here. */
export type StripComposition = {
  count: PhotoCount;
  photos: readonly { id?: string; width?: number; height?: number; adjustment?: PhotoAdjustment; initialCrop?: NormalizedCrop; flashExposure?: boolean; src?: string; alt: string; fit?: "cover" | "contain"; filterId?: FilterId }[];
  frameColor: string;
  frameStyle: string;
  caption?: string;
  texts?: readonly PlacedText[];
  decorations?: readonly PlacedSticker[];
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
