import type { PhotoBoothSession } from '../session/types';
export function liveMoments(session:PhotoBoothSession){
  return session.captures.flatMap((capture,index)=>capture.source==='camera'&&capture.motion?[{capture,photoNumber:index+1,motion:capture.motion}]:[]);
}
/** Preserve the recorded container. An unknown MIME gets a generic binary suffix. */
export function motionExtension(mime:string){
  const type=mime.split(';')[0].trim().toLowerCase();
  return ({'video/webm':'webm','video/mp4':'mp4','video/ogg':'ogv','video/quicktime':'mov','video/x-matroska':'mkv'} as Record<string,string>)[type]??'bin';
}
