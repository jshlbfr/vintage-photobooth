import { getCoverCrop, getStripLayout, type StripComposition } from '../composition';
import type { Capture } from '../session/types';
export function videoDimensions(width:number,height:number,maxWidth=720,maxHeight=1440){
  const scale=Math.min(maxWidth/width,maxHeight/height,1);
  return {width:Math.max(2,Math.round(width*scale/2)*2),height:Math.max(2,Math.round(height*scale/2)*2)};
}
export function stripVideoDimensions(composition:StripComposition){
  const layout=getStripLayout(composition),scale=Math.min(720/layout.width,1440/layout.height);
  return videoDimensions(layout.width*scale,layout.height*scale);
}
export function motionCrop(width:number,height:number,motion:NonNullable<Capture['motion']>,targetWidth:number,targetHeight:number){
  const c=motion.crop,base={x:c.x*width,y:c.y*height,width:c.width*width,height:c.height*height};
  const inside=getCoverCrop(base.width,base.height,targetWidth,targetHeight);
  return {x:base.x+inside.x,y:base.y+inside.y,width:inside.width,height:inside.height};
}
export function clipSeconds(capture:Capture){return Math.max(.2,(capture.motion?.durationMs??1000)/1000);}
