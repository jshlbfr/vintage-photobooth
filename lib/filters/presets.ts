export type TonePoint = readonly [number, number];
type RGB = readonly [number, number, number];
export type FilmParameters = {
  exposure: number; contrast: number; saturation: number; temperature: number; tint: number;
  highlights: number; shadows: number; blackPoint: number; curve: readonly TonePoint[];
  grain: number; vignette: number; bloom: number; chromatic: number; monochrome: boolean;
  /** Red, yellow, green, cyan, blue, magenta saturation offsets. */
  colors: readonly [number, number, number, number, number, number];
  shadowTone: RGB; highlightTone: RGB; skinProtection: number;
};
const neutral: FilmParameters = { exposure:0,contrast:1,saturation:1,temperature:0,tint:0,highlights:0,shadows:0,blackPoint:0,curve:[[0,0],[1,1]],grain:0,vignette:0,bloom:0,chromatic:0,monochrome:false,colors:[0,0,0,0,0,0],shadowTone:[0,0,0],highlightTone:[0,0,0],skinProtection:0 };
const portrait: FilmParameters = {...neutral,skinProtection:.8};
const soft: readonly TonePoint[] = [[0,.025],[.15,.17],[.5,.51],[.8,.8],[1,.97]];
const snapshot: readonly TonePoint[] = [[0,.005],[.12,.085],[.4,.405],[.72,.79],[.9,.94],[1,.995]];
export const FILTER_PRESETS = [
  {id:'original',name:'Original',description:'Untouched camera color.',parameters:neutral},
  {id:'classic',name:'Classic',description:'Natural color, gentle contrast and smooth highlights.',parameters:{...portrait,saturation:1.02,temperature:.025,highlights:-.09,curve:[[0,.005],[.18,.17],[.5,.51],[.82,.84],[1,.99]],colors:[.08,.02,-.035,0,0,0],grain:.006}},
  {id:'chrome',name:'Chrome',description:'Muted reds, earthy greens, deep blues and cool shadows.',parameters:{...portrait,saturation:.78,contrast:1.055,highlights:-.12,shadows:.025,colors:[-.14,-.08,-.18,.05,.28,-.08],shadowTone:[-.013,.003,.025],curve:[[0,.012],[.15,.115],[.5,.48],[.8,.81],[1,.975]],grain:.012}},
  {id:'velvet',name:'Velvet',description:'Soft portrait contrast and gently faded print tones.',parameters:{...portrait,contrast:.97,saturation:.83,temperature:.045,blackPoint:.018,shadows:.07,highlights:-.12,curve:soft,grain:.009}},
  {id:'emerald',name:'Emerald',description:'Cool cyan-green color with restrained warm tones.',parameters:{...portrait,temperature:-.055,tint:-.025,saturation:.91,colors:[-.08,-.10,.05,.17,-.05,0],shadowTone:[-.013,.017,.02],highlights:-.12,curve:[[0,.015],[.2,.18],[.5,.50],[.82,.85],[1,.98]],grain:.011}},
  {id:'golden-hour',name:'Golden Hour',description:'Warm highlights, creamy whites and rich red-yellow color.',parameters:{...portrait,temperature:.13,saturation:.97,colors:[.12,.12,-.04,0,-.04,0],highlightTone:[.012,.004,-.02],blackPoint:.018,highlights:-.14,shadows:.03,curve:soft,grain:.012}},
  {id:'flash-2000',name:'Flash 2000',description:'Crisp compact-camera color, bright whites and a cool backdrop.',parameters:{...portrait,contrast:1.055,saturation:1.12,highlights:-.10,shadows:.025,shadowTone:[-.01,.005,.023],colors:[.02,-.02,-.05,.04,.10,-.06],curve:snapshot,grain:.021,bloom:.04,chromatic:.0004}},
  {id:'disposable',name:'Disposable',description:'Warm imperfect film, faded blacks and tactile fine grain.',parameters:{...portrait,temperature:.11,tint:.025,saturation:.96,colors:[.13,.10,-.10,-.05,-.08,0],blackPoint:.045,highlights:-.16,curve:[[0,.015],[.18,.19],[.5,.51],[.82,.81],[1,.95]],grain:.035,vignette:.17,bloom:.025,chromatic:.0007}},
  {id:'night-flash',name:'Night Flash',description:'Deep cool shadows, warm midtones and glowing highlights.',parameters:{...portrait,contrast:1.07,saturation:.95,shadows:.04,highlights:-.19,shadowTone:[-.024,.002,.045],highlightTone:[.009,.003,-.005],temperature:.035,colors:[.04,-.025,-.12,.05,.12,-.06],curve:[[0,.009],[.12,.075],[.36,.35],[.65,.71],[.86,.89],[1,.98]],grain:.028,bloom:.10,vignette:.10,chromatic:.00065}},
  {id:'mono',name:'Mono',description:'Shaped silver monochrome with detailed skin and fine grain.',parameters:{...neutral,monochrome:true,highlights:-.10,shadows:.04,curve:[[0,.016],[.15,.11],[.45,.49],[.8,.86],[1,.985]],grain:.015}},
] as const;
export type FilterId = typeof FILTER_PRESETS[number]['id'];
export function getPreset(id: string) { return FILTER_PRESETS.find(preset => preset.id === id) ?? FILTER_PRESETS[0]; }
