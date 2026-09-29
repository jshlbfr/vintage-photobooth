export type TonePoint = readonly [number, number];
export type FilmParameters = {
  exposure: number; contrast: number; saturation: number; temperature: number; tint: number;
  highlights: number; shadows: number; blackPoint: number; curve: readonly TonePoint[];
  grain: number; vignette: number; bloom: number; chromatic: number; monochrome: boolean;
};
const neutral: FilmParameters = { exposure: 0, contrast: 1, saturation: 1, temperature: 0, tint: 0, highlights: 0, shadows: 0, blackPoint: 0, curve: [[0,0],[1,1]], grain: 0, vignette: 0, bloom: 0, chromatic: 0, monochrome: false };
const gentle: readonly TonePoint[] = [[0,0],[.18,.15],[.5,.51],[.82,.86],[1,1]];
export const FILTER_PRESETS = [
  { id: 'original', name: 'Original', description: 'Untouched camera color.', parameters: neutral },
  { id: 'golden-hour', name: 'Golden hour', description: 'Warm negative color, soft highlights and fine grain.', parameters: { ...neutral, temperature: .14, saturation: .93, highlights: -.13, shadows: .04, curve: gentle, grain: .012, bloom: .035 } },
  { id: 'old-soul', name: 'Old soul', description: 'Muted warm prints with gently lifted blacks.', parameters: { ...neutral, temperature: .07, saturation: .72, blackPoint: .045, highlights: -.1, grain: .018, vignette: .08 } },
  { id: 'faded-diary', name: 'Faded diary', description: 'Faded archival color and compressed paper whites.', parameters: { ...neutral, saturation: .78, temperature: .025, curve: [[0,.065],[.2,.22],[.6,.59],[1,.94]], grain: .016 } },
  { id: 'sunday', name: 'Sunday', description: 'Fresh cool greens with open shadows.', parameters: { ...neutral, temperature: -.055, tint: -.045, shadows: .08, highlights: -.08, saturation: .94, curve: gentle } },
  { id: 'silver-screen', name: 'Silver screen', description: 'Silver monochrome with shaped midtones and fine grain.', parameters: { ...neutral, monochrome: true, curve: [[0,.015],[.15,.11],[.45,.49],[.8,.86],[1,.985]], grain: .014, highlights: -.06 } },
  { id: 'after-hours', name: 'After hours', description: 'Cool compact-camera contrast with protected highlights.', parameters: { ...neutral, exposure: -.08, contrast: 1.08, temperature: -.08, tint: .035, saturation: .82, shadows: .035, highlights: -.14, curve: gentle, vignette: .13, grain: .02, chromatic: .00065 } },
  { id: 'soft-focus', name: 'Soft focus', description: 'Gentle pastel color and restrained highlight bloom.', parameters: { ...neutral, contrast: .96, saturation: .86, blackPoint: .02, highlights: -.06, bloom: .075, grain: .006 } },
  { id: 'warm-memory', name: 'Warm memory', description: 'Amber warmth with rich midtones and subtle edge falloff.', parameters: { ...neutral, temperature: .18, tint: .02, saturation: .9, curve: gentle, blackPoint: .012, bloom: .025, vignette: .07, grain: .012 } },
] as const;
export type FilterId = typeof FILTER_PRESETS[number]['id'];
export function getPreset(id: string) { return FILTER_PRESETS.find(preset => preset.id === id) ?? FILTER_PRESETS[0]; }
