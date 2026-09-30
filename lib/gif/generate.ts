import type { GifReply, GifRequest } from './worker';
export function generateGif(request:GifRequest,signal:AbortSignal,progress:(done:number,total:number)=>void):Promise<Blob>{
  signal.throwIfAborted();
  if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined')return Promise.reject(new Error('GIF generation needs a browser with worker Canvas support. Your photo download still works.'));
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./worker.ts',import.meta.url));
    // Bound even an encoder/worker failure that cannot return an error message.
    const timeout=setTimeout(()=>{cleanup();reject(new Error('GIF generation took too long. Please try again.'));},90000);
    const cleanup=()=>{clearTimeout(timeout);signal.removeEventListener('abort',abort);worker.terminate();};
    const abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};
    signal.addEventListener('abort',abort,{once:true});
    worker.onerror=()=>{cleanup();reject(new Error('GIF generation failed. Please try again.'));};
    worker.onmessage=({data}:MessageEvent<GifReply>)=>{
      if(data.kind==='progress'){progress(data.done,data.total);return;}
      cleanup();if(data.kind==='error')reject(new Error(data.message));else resolve(new Blob([data.buffer],{type:'image/gif'}));
    };
    try{worker.postMessage(request);}catch(error){cleanup();reject(error);}
  });
}
