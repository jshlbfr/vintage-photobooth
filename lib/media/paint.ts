/** Two frame boundaries allow a committed overlay to paint before reading video. */
export function afterPaint(signal: AbortSignal): Promise<void> {
  return new Promise((resolve,reject)=>{
    signal.throwIfAborted();
    let frame = 0;
    const abort=()=>{cancelAnimationFrame(frame);signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
    signal.addEventListener('abort',abort,{once:true});
    frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{signal.removeEventListener('abort',abort);resolve();});});
  });
}
