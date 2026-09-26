export const PHOTO_COUNTS = [1, 2, 4, 6] as const;
export type PhotoCount = (typeof PHOTO_COUNTS)[number];
export const TIMERS = [3, 5, 10] as const;

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

// Preview-only CSS treatments. Production image processing belongs to milestone 5.
export const FILTER_PREVIEWS = [
  { name: "Golden hour", css: "sepia(.85) saturate(.8) contrast(1.08)" },
  { name: "Old soul", css: "sepia(.75) saturate(.5) contrast(1.12) brightness(.88)" },
  { name: "Faded diary", css: "sepia(.55) saturate(.4) contrast(.95)" },
  { name: "Sunday", css: "sepia(.35) saturate(.5) contrast(1.08)" },
  { name: "Silver screen", css: "grayscale(1) contrast(1.08)" },
  { name: "After hours", css: "grayscale(1) contrast(1.25) brightness(.85)" },
  { name: "Soft focus", css: "grayscale(.85) contrast(.85)" },
  { name: "Warm memory", css: "sepia(.5) saturate(.75) brightness(1.08)" },
] as const;

export const SAMPLE_PORTRAIT = "/images/sample-portrait.jpg";

export const STICKERS = [
  "camera", "heart", "sunglasses", "sparkle",
  "record", "good-photos", "cherries", "strip",
  "flower", "star", "photo-booth", "smile",
  "bow", "hearts", "dice", "memories",
] as const;
export type StickerKind = (typeof STICKERS)[number];

export const FRAME_STYLES = [
  { id: "classic", name: "Classic strip", radius: 10 },
  { id: "square", name: "The archive", radius: 0 },
  { id: "soft", name: "Soft corners", radius: 24 },
] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number]["id"];
