import { FRAME_STYLES, SAMPLE_PORTRAIT, type FrameStyle, type PhotoCount, type StickerKind } from "@/lib/design-data";

/** Presentation geometry, shared by every strip. No media or session lifecycle here. */
export type StripComposition = {
  count: PhotoCount;
  photos: readonly { src: string; alt: string }[];
  frameColor: string;
  frameStyle: FrameStyle;
  filter: string;
  caption?: string;
  decorations?: readonly { kind: StickerKind; x: number; y: number; size: number; rotation: number }[];
};

export function getStripLayout(composition: Pick<StripComposition, "count" | "caption" | "frameStyle">) {
  const width = 224;
  const padding = 14;
  const photoWidth = width - padding * 2;
  const photoHeight = 166;
  const gap = 18;
  const footer = composition.caption ? 42 : 0;
  const height = padding * 2 + composition.count * photoHeight + (composition.count - 1) * gap + footer;
  const radius = FRAME_STYLES.find((style) => style.id === composition.frameStyle)?.radius ?? 10;
  return {
    width, height, radius,
    slots: Array.from({ length: composition.count }, (_, index) => ({
      x: padding, y: padding + index * (photoHeight + gap), width: photoWidth, height: photoHeight,
    })),
    captionY: height - 22,
  };
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

export function sampleComposition(overrides: Partial<StripComposition> = {}): StripComposition {
  return {
    count: 4,
    photos: Array.from({ length: 6 }, (_, index) => ({ src: SAMPLE_PORTRAIT, alt: `Sample portrait ${index + 1}` })),
    frameColor: "#1D1812",
    frameStyle: "classic",
    filter: "sepia(.75) saturate(.5) contrast(1.12) brightness(.88)",
    ...overrides,
  };
}

export const SAMPLE_DECORATIONS: NonNullable<StripComposition["decorations"]> = [
  { kind: "hearts", x: .02, y: .02, size: 46, rotation: -14 },
  { kind: "good-photos", x: .62, y: .2, size: 65, rotation: -12 },
  { kind: "dice", x: .01, y: .43, size: 57, rotation: 12 },
  { kind: "star", x: .74, y: .69, size: 48, rotation: 12 },
  { kind: "smile", x: .08, y: .86, size: 54, rotation: -15 },
];
