import { getStripLayout, type StripComposition } from '../composition';
export const GIF_DELAY_MS=650;
export function gifDimensions(composition:StripComposition){
  const slot=getStripLayout(composition).slots[0],scale=Math.min(480/slot.width,640/slot.height);
  return {width:Math.round(slot.width*scale),height:Math.round(slot.height*scale)};
}
