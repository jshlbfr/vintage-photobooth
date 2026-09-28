import type { FilterId, FrameColor, PhotoCount, StickerKind, TimerSeconds } from "../design-data";
import type { FrameStyle } from "../frame-templates";

export type CameraPreferences = {
  deviceId: string;
  mirrored: boolean;
  photoCount: PhotoCount;
  timerSeconds: TimerSeconds;
  flash: boolean;
  audioEnabled: boolean;
};

/** Local resources are references into a browser-owned media store.
 * Blobs, streams and object-URL lifecycle do not belong in React state. */
export type MediaReference =
  | { kind: "sample"; src: string; width: number; height: number }
  | { kind: "local"; resourceId: string; mimeType: string; width: number; height: number };

export type Capture = {
  id: string;
  source: "sample" | "camera" | "upload";
  still: MediaReference;
  motion?: { media: MediaReference; durationMs: number; hasAudio: boolean; mirrored: boolean; crop: { x: number; y: number; width: number; height: number } };
  mirrorApplied?: boolean;
  capturedAt: number;
  filterAtCapture: FilterId;
};

/** Positions and sizes are normalized to the strip, independent of DOM size. */
type PlacedElement = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  layer: number;
};
export type PlacedSticker = PlacedElement & { assetId: StickerKind };
export type PlacedText = PlacedElement & {
  content: string;
  color: string;
  font: "ui" | "display" | "script";
  alignment: "start" | "middle" | "end";
};
export type Customization = {
  filterId: FilterId;
  frameId: FrameStyle;
  frameColor: FrameColor;
  stickers: readonly PlacedSticker[];
  texts: readonly PlacedText[];
};
export type OutputKind = "photo" | "gif" | "live-moment";
export type GeneratedOutput = { resourceId: string; mimeType: string; createdAt: number };
export type PhotoBoothSession = {
  id: string;
  createdAt: number;
  preferences: CameraPreferences;
  capturePlanReady: boolean;
  captures: readonly Capture[];
  customization: Customization;
  rewards: { enhancedFeaturesUnlocked: boolean };
  outputs: Partial<Record<OutputKind, GeneratedOutput>>;
};
