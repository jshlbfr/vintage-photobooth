import { FILTER_PREVIEWS, FRAME_COLORS } from "../design-data";
import type { PhotoBoothSession } from "./types";

/** IDs/time are supplied by the caller, keeping initialization and reducer pure. */
export function createSession(id: string, createdAt: number): PhotoBoothSession {
  return {
    id, createdAt,
    preferences: { deviceId: "", mirrored: true, photoCount: 4, timerSeconds: 3, flash: true, audioEnabled: false, captureSound: true },
    capturePlanReady: false,
    captures: [],
    customization: { filterId: FILTER_PREVIEWS[0].id, frameId: "classic", frameColor: FRAME_COLORS[3].value, stickers: [], texts: [] },
    rewards: { enhancedFeaturesUnlocked: false },
    outputs: {},
  };
}
