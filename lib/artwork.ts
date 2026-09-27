import type { StickerKind } from "./design-data";

// Original files stay intact. Dimensions preserve their native aspect ratios.
export const DOODLES = {
  rays: { src: "/doodles/Sun rays.png", width: 259, height: 158 },
  "rays-alt": { src: "/doodles/sun ray 2.png", width: 116, height: 106 },
  hearts: { src: "/doodles/hearts.png", width: 92, height: 73 },
  sparkles: { src: "/doodles/sparkles.png", width: 82, height: 79 },
  "sparkles-alt": { src: "/doodles/sparkles v2.png", width: 139, height: 117 },
  underline: { src: "/doodles/line doodle.png", width: 416, height: 106 },
  arrow: { src: "/doodles/arrow pointing button.png", width: 108, height: 99 },
  plane: { src: "/doodles/paperplane.png", width: 100, height: 157 },
} as const;

const sticker = (number: number, width = 453, height = 335) => ({ src: `/stickers/Sticker ${number}.png`, width, height });
export const STICKER_ASSETS: Record<StickerKind, ReturnType<typeof sticker>> = {
  heart: sticker(1), record: sticker(2), dog: sticker(3), "good-photos": sticker(4),
  sunglasses: sticker(5), star: sticker(6), cherries: sticker(7), bow: sticker(8, 453, 352),
  "photo-booth": sticker(9), hearts: sticker(10), dice: sticker(11), sparkle: sticker(12),
  strip: sticker(13, 453, 368), smile: sticker(14, 408, 335), memories: sticker(15), camera: sticker(16),
};
