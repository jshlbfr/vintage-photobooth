/** Source-space geometry shared by SVG, PNG, GIF and moving strip windows. */
export type PhotoAdjustment = { zoom: number; x: number; y: number };
export type NormalizedCrop = { x: number; y: number; width: number; height: number };
export const DEFAULT_PHOTO_ADJUSTMENT: PhotoAdjustment = { zoom: 1, x: .5, y: .5 };
const bounded = (value: number, min: number, max: number, fallback: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export function safePhotoAdjustment(value: PhotoAdjustment): PhotoAdjustment {
  return { zoom: bounded(value.zoom, 1, 4, 1), x: bounded(value.x, 0, 1, .5), y: bounded(value.y, 0, 1, .5) };
}
export function photoCrop(width: number, height: number, targetWidth: number, targetHeight: number, adjustment = DEFAULT_PHOTO_ADJUSTMENT, initial?: NormalizedCrop) {
  if (![width,height,targetWidth,targetHeight].every(n => Number.isFinite(n) && n > 0)) throw new RangeError('Positive image and slot dimensions required.');
  const a = safePhotoAdjustment(adjustment);
  const baseWidth = width * (initial?.width ?? 1), baseHeight = height * (initial?.height ?? 1);
  const scale = Math.max(targetWidth / baseWidth, targetHeight / baseHeight) * a.zoom;
  const w = targetWidth / scale, h = targetHeight / scale;
  const cx = Math.min(width-w/2, Math.max(w/2, a.x*width));
  const cy = Math.min(height-h/2, Math.max(h/2, a.y*height));
  return { x: cx-w/2, y: cy-h/2, width: w, height: h };
}
export function constrainPhotoAdjustment(width:number,height:number,targetWidth:number,targetHeight:number,value:PhotoAdjustment,initial?:NormalizedCrop) {
  const a=safePhotoAdjustment(value),c=photoCrop(width,height,targetWidth,targetHeight,a,initial);
  return {...a,x:(c.x+c.width/2)/width,y:(c.y+c.height/2)/height};
}
export function dragPhoto(width:number,height:number,targetWidth:number,targetHeight:number,value:PhotoAdjustment,dx:number,dy:number,initial?:NormalizedCrop) {
  const c=photoCrop(width,height,targetWidth,targetHeight,value,initial);
  return constrainPhotoAdjustment(width,height,targetWidth,targetHeight,{...value,x:(c.x+c.width/2-dx*c.width/targetWidth)/width,y:(c.y+c.height/2-dy*c.height/targetHeight)/height},initial);
}
export function photoImageRect(width:number,height:number,slot:{x:number;y:number;width:number;height:number},adjustment?:PhotoAdjustment,initial?:NormalizedCrop) {
  const c=photoCrop(width,height,slot.width,slot.height,adjustment,initial),scale=slot.width/c.width;
  return {x:slot.x-c.x*scale,y:slot.y-c.y*scale,width:width*scale,height:height*scale};
}
