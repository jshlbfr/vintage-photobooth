import { FILTER_PREVIEWS, FRAME_COLORS } from "../design-data";
import type { PhotoBoothSession } from "./types";

export const SAMPLE_CAMERAS = [
  { id: "sample-front", name: "Sample front camera" },
  { id: "sample-rear", name: "Sample rear camera" },
] as const;

/** IDs/time are supplied by the caller, keeping initialization and reducer pure. */
export function createSession(id: string, createdAt: number): PhotoBoothSession {
  return {
    id, createdAt,
    preferences: { deviceId: SAMPLE_CAMERAS[0].id, mirrored: true, photoCount: 4, timerSeconds: 3, flash: true },
    captures: [],
    customization: { filterId: FILTER_PREVIEWS[1].id, frameId: "classic", frameColor: FRAME_COLORS[3].value, stickers: [], texts: [] },
    rewards: { enhancedFeaturesUnlocked: false },
    outputs: {},
  };
}
