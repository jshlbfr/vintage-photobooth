import type { PhotoCount } from "./design-data";

/** Logical pixels, independent of DOM size. Canvas can multiply every coordinate
 * by outputWidth / layout.width; SVG uses these same coordinates directly. */
export type PhotoSlot = { x: number; y: number; width: number; height: number; radius: number };
export type FrameLayout = {
  width: number;
  height: number;
  radius: number;
  slots: readonly PhotoSlot[];
  captionY?: number;
};
type GeneratedFrameTemplate = {
  kind: "generated";
  id: string;
  name: string;
  description: string;
  supportedPhotoCounts: readonly PhotoCount[];
  width: number;
  sidePadding: number;
  topPadding: number;
  bottomPadding: number;
  photoGap: number;
  photoRadius: number;
  frameRadius: number;
  fourPhotoRatio: number;
};

/** Future custom artwork supplies exact geometry per supported count. Missing
 * variants are unsupported, never stretched or populated with empty slots.
 * Assets must be registered explicitly; public/frames is not scanned or loaded. */
export type AssetFrameTemplate = {
  kind: "asset";
  id: string;
  name: string;
  variants: Partial<Record<PhotoCount, {
    asset: string;
    layout: FrameLayout;
    layer: "overlay" | "background";
  }>>;
};
export type FrameTemplate = GeneratedFrameTemplate | AssetFrameTemplate;

const base = {
  kind: "generated", supportedPhotoCounts: [1, 2, 4, 6],
  width: 224, sidePadding: 14, topPadding: 14, bottomPadding: 14,
  photoGap: 18, photoRadius: 8, frameRadius: 10, fourPhotoRatio: 166 / 196,
} as const;

export const FRAME_STYLES = [
  { ...base, id: "classic", name: "Classic", description: "Balanced borders and traditional spacing." },
  { ...base, id: "tight", name: "Tight", description: "Larger photos with narrow borders and close spacing.", sidePadding: 9, topPadding: 9, bottomPadding: 9, photoGap: 6, photoRadius: 4, frameRadius: 6 },
  { ...base, id: "airy", name: "Airy", description: "Generous borders, open spacing and soft corners.", sidePadding: 22, topPadding: 24, bottomPadding: 24, photoGap: 26, photoRadius: 12, frameRadius: 14 },
  { ...base, id: "flush", name: "Flush", description: "Almost edge-to-edge, with fine square dividers.", sidePadding: 3, topPadding: 3, bottomPadding: 3, photoGap: 3, photoRadius: 0, frameRadius: 0 },
  { ...base, id: "small-bottom", name: "Small bottom", description: "A subtle extra margin below the last photograph.", bottomPadding: 30, photoRadius: 2, frameRadius: 2 },
  { ...base, id: "medium-bottom", name: "Medium bottom", description: "A traditional printed-strip footer.", bottomPadding: 52, photoRadius: 2, frameRadius: 2 },
  { ...base, id: "large-bottom", name: "Large bottom", description: "A restrained instant-photo footer.", bottomPadding: 78, photoRadius: 2, frameRadius: 2 },
  { ...base, id: "wide", name: "Wide", description: "A wider print with landscape photo windows.", width: 260, sidePadding: 12, photoGap: 14, fourPhotoRatio: .72, photoRadius: 5, frameRadius: 6 },
  { ...base, id: "narrow", name: "Narrow", description: "Slim proportions with crisp, close-set windows.", width: 190, sidePadding: 12, photoGap: 12, fourPhotoRatio: .94, photoRadius: 0, frameRadius: 2 },
] as const satisfies readonly GeneratedFrameTemplate[];
export type FrameStyle = (typeof FRAME_STYLES)[number]["id"];

export const FRAME_TEMPLATES: readonly FrameTemplate[] = FRAME_STYLES;

export function getFrameTemplate(id: string): FrameTemplate {
  const template = FRAME_TEMPLATES.find((entry) => entry.id === id);
  if (!template) throw new RangeError(`Unknown frame: ${id}`);
  return template;
}

export function supportsPhotoCount(template: FrameTemplate, count: PhotoCount) {
  return template.kind === "generated"
    ? template.supportedPhotoCounts.includes(count)
    : template.variants[count] !== undefined;
}

export function resolveFrameLayout(template: FrameTemplate, count: PhotoCount, caption = false): FrameLayout {
  if (!supportsPhotoCount(template, count)) throw new RangeError(`${template.id} does not support ${count} photos.`);
  if (template.kind === "asset") return template.variants[count]!.layout;

  // Six photos use shorter windows and compact gutters, not four-photo slots
  // repeated six times. One photo is deliberately portrait-oriented.
  const compact = count === 6;
  const side = template.sidePadding * (compact ? .85 : 1);
  const top = template.topPadding * (compact ? .75 : 1);
  const bottom = Math.max(template.bottomPadding * (compact ? .75 : 1), caption ? 56 : 0);
  const gap = template.photoGap * (compact ? .65 : 1);
  const photoWidth = template.width - side * 2;
  const photoHeight = compact ? Math.min(photoWidth * .6, 124)
    : photoWidth * (count === 1 ? 4 / 3 : count === 2 ? 1.08 : template.fourPhotoRatio);
  const height = top + count * photoHeight + (count - 1) * gap + bottom;
  return {
    width: template.width, height, radius: template.frameRadius,
    slots: Array.from({ length: count }, (_, index) => ({
      x: side, y: top + index * (photoHeight + gap), width: photoWidth, height: photoHeight,
      radius: template.photoRadius,
    })),
    ...(caption ? { captionY: height - bottom / 2 + 5 } : {}),
  };
}
