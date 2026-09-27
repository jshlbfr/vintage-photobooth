import { FILTER_PREVIEWS } from "../design-data";
import { getStripLayout, type StripComposition } from "../composition";
import type { PhotoBoothSession } from "./types";

export function hasCompleteCaptures(session: PhotoBoothSession): boolean {
  return session.captures.length === session.preferences.photoCount;
}

export function selectFilter(session: PhotoBoothSession) {
  return FILTER_PREVIEWS.find(filter => filter.id === session.customization.filterId) ?? FILTER_PREVIEWS[1];
}

/** Every screen consumes this selector, never its own sample arrays or defaults.
 * Local media resolution will be injected by the future browser media store. */
export function selectStripComposition(session: PhotoBoothSession): StripComposition {
  const composition: StripComposition = {
    count: session.preferences.photoCount,
    photos: session.captures.map((capture, index) => ({
      src: capture.still.kind === "sample" ? capture.still.src : undefined,
      alt: `${capture.source === "sample" ? "Sample p" : "P"}hotograph ${index + 1}`,
      fit: capture.source === "sample" ? "contain" : "cover",
    })),
    frameStyle: session.customization.frameId,
    frameColor: session.customization.frameColor,
    filter: selectFilter(session).css,
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
