export const PHOTO_COUNTS = [1, 2, 4, 5, 6, 8, 10, 12] as const;
export type PhotoCount = (typeof PHOTO_COUNTS)[number];
export const TIMERS = [1, 3, 5, 10] as const;
export type TimerSeconds = (typeof TIMERS)[number];

export const FRAME_COLORS = [
  { name: "Vanilla", value: "#F4EBDD" },
  { name: "Oat", value: "#D8C4A5" },
  { name: "Espresso", value: "#2A211A" },
  { name: "Ink", value: "#171513" },
  { name: "Burgundy", value: "#702C2B" },
  { name: "Brick", value: "#9B4034" },
  { name: "Dusty rose", value: "#C88F8A" },
  { name: "Terracotta", value: "#B76235" },
  { name: "Honey", value: "#C39A45" },
  { name: "Olive", value: "#74704A" },
  { name: "Forest", value: "#344B3B" },
  { name: "Slate blue", value: "#64798A" },
  { name: "Midnight", value: "#293745" },
  { name: "Lilac", value: "#8D8293" },
  { name: "Cocoa", value: "#65483A" },
  { name: "Stone", value: "#AAA59C" },
] as const;

export { FILTER_PRESETS as FILTER_PREVIEWS, type FilterId } from "./filters/presets";
export type FrameColor = (typeof FRAME_COLORS)[number]["value"];

export const SAMPLE_PORTRAIT = "/images/sample-portrait.jpg";

export const STICKERS = [
  "camera", "heart", "sunglasses", "sparkle",
  "record", "good-photos", "cherries", "strip",
  "dog", "star", "photo-booth", "smile",
  "bow", "hearts", "dice", "memories",
] as const;
export type StickerKind = (typeof STICKERS)[number];

export { FRAME_STYLES, type FrameStyle } from "./frame-templates";
