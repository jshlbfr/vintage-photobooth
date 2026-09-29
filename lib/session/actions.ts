import type { FilterId, FrameColor, PhotoCount, TimerSeconds } from "../design-data";
import type { FrameStyle } from "../frame-templates";
import type { Capture, Customization, GeneratedOutput, OutputKind, PhotoBoothSession, PlacedSticker, PlacedText } from "./types";

export type SessionAction =
  | { type: "session/start" | "session/ensure"; session: PhotoBoothSession }
  | { type: "camera/device"; deviceId: string }
  | { type: "camera/mirror"; mirrored: boolean }
  | { type: "camera/count"; count: PhotoCount }
  | { type: "camera/timer"; seconds: TimerSeconds }
  | { type: "camera/flash"; enabled: boolean }
  | { type: "camera/audio"; enabled: boolean }
  | { type: "captures/begin" }
  | { type: "captures/restart" }
  | { type: "captures/add"; sessionId: string; capture: Capture }
  | { type: "customization/replace"; customization: Customization }
  | { type: "customization/filter"; filterId: FilterId }
  | { type: "customization/frame"; frameId: FrameStyle }
  | { type: "customization/color"; color: FrameColor }
  | { type: "customization/stickers"; stickers: readonly PlacedSticker[] }
  | { type: "customization/texts"; texts: readonly PlacedText[] }
  | { type: "rewards/unlock" }
  | { type: "outputs/record"; kind: OutputKind; output: GeneratedOutput };
