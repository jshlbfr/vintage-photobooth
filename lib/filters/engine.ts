import { getPreset, type FilterId, type TonePoint } from './presets';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
function curveAt(x: number, points: readonly TonePoint[]) {
  const end = points.findIndex(point => point[0] >= x);
  if (end <= 0) return points[Math.max(0, end)][1];
  const [x0,y0] = points[end-1], [x1,y1] = points[end];
  const t = (x-x0)/(x1-x0);
  // Smooth interpolation gives soft shoulders without discontinuous tonal steps.
  return y0 + (y1-y0)*t;
}
const tables = new Map<FilterId, Float32Array>();
function toneTable(id: FilterId) {
  let table = tables.get(id); if (table) return table;
  const p = getPreset(id).parameters;
  table = Float32Array.from({ length: 4096 }, (_, i) => {
    let v = clamp(i/4095 * 2**p.exposure);
    v += p.shadows * (1-v)**3 * .35 + p.highlights * v**3 * .35;
    v = clamp((v-.5)*p.contrast+.5);
    return clamp(p.blackPoint+(1-p.blackPoint)*curveAt(v,p.curve));
  });
  tables.set(id,table); return table;
}
function noise(x: number, y: number, seed: number) {
  let n = Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);
  n = Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967295-.5;
}
/** Mutates only the caller's working pixels. Original is byte-for-byte passthrough.
 * Coordinates/noise are normalized so thumbnail, preview and future output share a look. */
export function processPixels(data: Uint8ClampedArray, width: number, height: number, id: FilterId, seed = 17) {
  if (id === 'original') return data;
  const p = getPreset(id).parameters, lut = toneTable(id);
  const source = p.chromatic ? data.slice() : data;
  const highlights = p.bloom ? new Float32Array(width*height) : null;
  for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
    const i=(y*width+x)*4, edge=Math.min(1,((x/width-.5)**2+(y/height-.5)**2)*2);
    const offset=Math.round(width*p.chromatic*edge);
    let r=source[(y*width+Math.min(width-1,x+offset))*4]/255;
    let g=source[i+1]/255, b=source[(y*width+Math.max(0,x-offset))*4+2]/255;
    // Channel balance, strongest in midtones; no flat color overlay.
    r += p.temperature*.18*r*(1-r)*4 + p.tint*.04;
    b -= p.temperature*.18*b*(1-b)*4;
    g -= p.tint*.1*g*(1-g)*4;
    const luma=.25*r+.65*g+.1*b;
    if (p.monochrome) r=g=b=luma;
    else { r=luma+(r-luma)*p.saturation; g=luma+(g-luma)*p.saturation; b=luma+(b-luma)*p.saturation; }
    const shade=1-p.vignette*edge*edge;
    const grain=(noise(Math.floor(x/width*900),Math.floor(y/height*900),seed)+noise(Math.floor(x/width*450),Math.floor(y/height*450),seed+7)*.4)*p.grain*(.4+.6*(1-luma));
    data[i]=255*clamp(lut[Math.round(clamp(r)*4095)]*shade+grain);
    data[i+1]=255*clamp(lut[Math.round(clamp(g)*4095)]*shade+grain);
    data[i+2]=255*clamp(lut[Math.round(clamp(b)*4095)]*shade+grain);
    if(highlights) highlights[y*width+x]=Math.max(0,luma-.65)/.35;
  }
  if (highlights) {
    // Separable box blur of highlights only; photographic detail stays sharp.
    const radius=Math.max(1,Math.round(width*.012)), temp=new Float32Array(highlights.length);
    for(let y=0;y<height;y++) {
      let sum=0;for(let x=-radius;x<=radius;x++)sum+=highlights[y*width+Math.max(0,Math.min(width-1,x))];
      for(let x=0;x<width;x++){temp[y*width+x]=sum/(radius*2+1);sum+=highlights[y*width+Math.min(width-1,x+radius+1)]-highlights[y*width+Math.max(0,x-radius)];}
    }
    for(let x=0;x<width;x++) {
      let sum=0;for(let y=-radius;y<=radius;y++)sum+=temp[Math.max(0,Math.min(height-1,y))*width+x];
      for(let y=0;y<height;y++){const glow=sum/(radius*2+1)*p.bloom;const i=(y*width+x)*4;for(let c=0;c<3;c++)data[i+c]+= (255-data[i+c])*glow;sum+=temp[Math.min(height-1,y+radius+1)*width+x]-temp[Math.max(0,y-radius)*width+x];}
    }
  }
  return data;
}
/** Same pixel engine at any requested resolution; callers choose their preview budget. */
export function gradeCanvas(canvas: HTMLCanvasElement | OffscreenCanvas, id: FilterId, seed = 17) {
  if(id==='original')return;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  processPixels(frame.data,frame.width,frame.height,id,seed);ctx.putImageData(frame,0,0);
}
