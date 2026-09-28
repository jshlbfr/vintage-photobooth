import { FILTER_PREVIEWS, FRAME_COLORS, PHOTO_COUNTS, TIMERS } from "../design-data";
import { FRAME_STYLES, supportsPhotoCount } from "../frame-templates";
import type { SessionAction } from "./actions";
import type { Customization, PhotoBoothSession } from "./types";

function customize(session: PhotoBoothSession, patch: Partial<Customization>): PhotoBoothSession {
  return { ...session, customization: { ...session.customization, ...patch }, outputs: {} };
}

export function sessionReducer(session: PhotoBoothSession | null, action: SessionAction): PhotoBoothSession | null {
  if (action.type === "session/start") return action.session;
  if (action.type === "session/ensure") return session ?? action.session;
  if (!session) return session;

  switch (action.type) {
    case "camera/device":
      return { ...session, preferences: { ...session.preferences, deviceId: action.deviceId } };
    case "camera/mirror":
      return { ...session, preferences: { ...session.preferences, mirrored: action.mirrored } };
    case "camera/timer":
      return TIMERS.includes(action.seconds) ? { ...session, preferences: { ...session.preferences, timerSeconds: action.seconds } } : session;
    case "camera/flash":
      return { ...session, preferences: { ...session.preferences, flash: action.enabled } };
    case "camera/count": {
      if (!PHOTO_COUNTS.includes(action.count) || action.count === session.preferences.photoCount) return session;
      const frame = FRAME_STYLES.find(entry => entry.id === session.customization.frameId);
      return {
        ...session, preferences: { ...session.preferences, photoCount: action.count },
        // A different capture plan cannot keep an old, mismatched strip/output.
        capturePlanReady: false, captures: [], outputs: {},
        customization: { ...session.customization, frameId: frame && supportsPhotoCount(frame, action.count) ? frame.id : "classic" },
      };
    }
    case "camera/audio":
      return { ...session, preferences: { ...session.preferences, audioEnabled: action.enabled } };
    case "captures/begin": return { ...session, capturePlanReady: true };
    case "captures/restart": return { ...session, captures: [], outputs: {} };
    case "captures/add":
      if (action.sessionId !== session.id || !session.capturePlanReady || session.captures.length >= session.preferences.photoCount || session.captures.some(capture => capture.id === action.capture.id)) return session;
      return { ...session, captures: [...session.captures, action.capture], outputs: {} };
    case "customization/filter":
      return FILTER_PREVIEWS.some(filter => filter.id === action.filterId) ? customize(session, { filterId: action.filterId }) : session;
    case "customization/frame": {
      const frame = FRAME_STYLES.find(entry => entry.id === action.frameId);
      return frame && supportsPhotoCount(frame, session.preferences.photoCount) ? customize(session, { frameId: frame.id }) : session;
    }
    case "customization/color":
      return FRAME_COLORS.some(color => color.value === action.color) ? customize(session, { frameColor: action.color }) : session;
    case "customization/stickers": return customize(session, { stickers: action.stickers });
    case "customization/texts": return customize(session, { texts: action.texts });
    case "rewards/unlock": return { ...session, rewards: { enhancedFeaturesUnlocked: true } };
    case "outputs/record": return { ...session, outputs: { ...session.outputs, [action.kind]: action.output } };
  }
}
