import { getStripLayout, type StripComposition } from "../composition";
import type { MediaReference, PhotoBoothSession } from "./types";

export function hasCompleteCaptures(session: PhotoBoothSession): boolean {
  return session.captures.length === session.preferences.photoCount;
}

/** Every screen consumes this selector, never its own sample arrays or defaults.
 * The browser media store resolves local references into shared object URLs. */
export function selectStripComposition(session: PhotoBoothSession, resolveMedia?: (reference: MediaReference) => string | undefined): StripComposition {
  const composition: StripComposition = {
    count: session.preferences.photoCount,
    photos: session.captures.map((capture, index) => ({
      src: resolveMedia ? resolveMedia(capture.still) : capture.still.kind === "sample" ? capture.still.src : undefined,
      filterId: capture.filterAtCapture,
      alt: `${capture.source === "sample" ? "Sample p" : "P"}hotograph ${index + 1}`,
      fit: capture.source === "sample" ? "contain" : "cover",
    })),
    frameStyle: session.customization.frameId,
    frameColor: session.customization.frameColor,
  };
  const layout = getStripLayout(composition);
  return {
    ...composition,
    decorations: [...session.customization.stickers].sort((a, b) => a.layer - b.layer).map(sticker => ({
      kind: sticker.assetId, x: sticker.x, y: sticker.y, size: sticker.size * layout.width, rotation: sticker.rotation,
    })),
    texts: [...session.customization.texts].sort((a, b) => a.layer - b.layer),
  };
}
