import type { PhotoBoothSession } from '../session/types';
export function liveMoments(session:PhotoBoothSession){
  return session.captures.flatMap((capture,index)=>capture.source==='camera'&&capture.motion?[{capture,photoNumber:index+1,motion:capture.motion}]:[]);
}
/** Preserve the recorded container. An unknown MIME gets a generic binary suffix. */
export function motionExtension(mime:string){
  const type=mime.split(';')[0].trim().toLowerCase();
  return ({'video/webm':'webm','video/mp4':'mp4','video/ogg':'ogv','video/quicktime':'mov','video/x-matroska':'mkv'} as Record<string,string>)[type]??'bin';
}

/** Full output is available only when every camera photo belongs to one source. */
export function continuousMoment(session:PhotoBoothSession){
  const cameras=session.captures.filter(c=>c.source==='camera');
  const first=cameras[0];
  if(!first?.motion?.sourceDurationMs||first.motion.media.kind!=='local')return undefined;
  const id=first.motion.media.resourceId;
  return cameras.every(c=>c.motion?.media.kind==='local'&&c.motion.media.resourceId===id)?first:undefined;
}
