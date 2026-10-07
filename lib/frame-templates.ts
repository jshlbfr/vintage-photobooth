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
  backing?: PhotoSlot;
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
  description?: string;
  variants: Partial<Record<PhotoCount, {
    asset: string;
    layout: FrameLayout;
    layer: "overlay" | "background";
  }>>;
};
export type FrameTemplate = GeneratedFrameTemplate | AssetFrameTemplate;

const base = {
  kind: "generated", supportedPhotoCounts: [1, 2, 4, 5, 6, 8, 10, 12],
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
// Coordinates measured in the unmodified 302 × 958 PNGs. Photo rectangles extend
// just under the window rims; the original alpha artwork supplies their worn edges.
const custom = (id: string, name: string, file: number, slots: readonly PhotoSlot[], backing: PhotoSlot): AssetFrameTemplate => ({
  kind: "asset", id, name, description: "Original vintage artwork · four photos only.",
  variants: { 4: { asset: `/frames/Vintage Frame 4-Image Strip ${file}.png`, layer: "overlay",
    layout: { width: 302, height: 958, radius: 0, slots, backing } } },
});
const slot = (x: number, y: number, width: number, height: number, radius = 10): PhotoSlot => ({x,y,width,height,radius});
export const CUSTOM_FRAMES = [
  custom("vintage-1", "Vintage Burgundy", 1, [slot(49,82,205,173),slot(49,276,206,180),slot(50,478,205,181),slot(49,681,205,180)], slot(24,34,252,894,18)),
  custom("vintage-2", "Vintage Cream", 2, [slot(39,65,213,181),slot(39,270,213,185),slot(39,478,213,186),slot(39,687,213,183)], slot(19,34,251,894,15)),
  custom("vintage-3", "Vintage Tape", 3, [slot(57,91,196,166),slot(56,281,197,176),slot(56,481,198,182),slot(58,686,195,175)], slot(33,36,239,892,15)),
  custom("vintage-4", "Vintage Film", 4, [slot(63,84,196,174),slot(63,282,196,179),slot(63,484,196,180),slot(63,687,196,180)], slot(22,38,259,892,16)),
  custom("vintage-5", "Vintage Paper", 5, [slot(50,64,202,181),slot(50,264,202,188),slot(50,470,202,186),slot(50,675,202,186)], slot(29,29,240,891,13)),
] as const;
export type FrameStyle = (typeof FRAME_STYLES)[number]["id"] | `vintage-${1|2|3|4|5}`;
export const FRAME_TEMPLATES: readonly FrameTemplate[] = [...FRAME_STYLES, ...CUSTOM_FRAMES];
export function framesForCount(count: PhotoCount) { return FRAME_TEMPLATES.filter(frame => supportsPhotoCount(frame,count)); }

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

  const columns = count >= 6 ? 2 : 1;
  const rows = count / columns;
  const side = template.sidePadding;
  const top = template.topPadding;
  const bottom = Math.max(template.bottomPadding, caption ? 56 : 0);
  const gap = template.photoGap;
  const photoWidth = template.width - side * 2;
  const photoHeight = photoWidth * (count === 1 ? 4 / 3 : count === 2 ? 1.08 : template.fourPhotoRatio);
  const width = side * 2 + columns * photoWidth + (columns - 1) * gap;
  const height = top + rows * photoHeight + (rows - 1) * gap + bottom;
  return {
    width, height, radius: template.frameRadius,
    slots: Array.from({ length: count }, (_, index) => ({
      x: side + (index % columns) * (photoWidth + gap), y: top + Math.floor(index / columns) * (photoHeight + gap), width: photoWidth, height: photoHeight,
      radius: template.photoRadius,
    })),
    ...(caption ? { captionY: height - bottom / 2 + 5 } : {}),
  };
}
