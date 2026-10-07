"use client";
import {useState} from 'react';
import {useVideoOutput,type VideoOutput} from './use-video-output';
import {LiveStripPreview} from './live-strip-preview';
import {motionExtension} from '@/lib/media/live-moment';
export function VideoResults(){
  const [kind,setKind]=useState<VideoOutput>('live-strip'),[preview,setPreview]=useState(true),video=useVideoOutput();
  const output=video.output(kind),hasMotion=!!video.fullSource;
  return <><div className="video-output-tabs" role="group" aria-label="Live Moment output"><button disabled={video.busy} aria-pressed={kind==='live-strip'} onClick={()=>setKind('live-strip')}>Live Strip</button><button disabled={video.busy} aria-pressed={kind==='full-live-moment'} onClick={()=>setKind('full-live-moment')}>Full Live Moment</button></div>
    <p className="media-note">{kind==='live-strip'?'Your customized photo strip, brought to life. Muted; shorter moments hold until the strip restarts.':'One continuous camera recording, with recorded microphone audio when available. Intentional pauses and manual waiting are omitted. Original camera color.'}</p>
    {output?.src?<video className="live-moment-video" key={output.src} src={output.src} controls playsInline muted={kind==='live-strip'} preload="metadata"/>:kind==='live-strip'&&!video.busy&&preview?<LiveStripPreview composition={video.composition} sources={video.sources}/>:null}
    {kind==='live-strip'&&!output&&!video.busy&&<button className="text-link" onClick={()=>setPreview(v=>!v)}>{preview?'Pause preview':'Play preview'}</button>}
    {kind==='full-live-moment'&&!hasMotion&&<p className="media-empty">No complete continuous recording is available. The camera may have been interrupted, or this session uses uploaded photos. Your photos and available Live Strip moments remain safe.</p>}
    <p className="media-note" role="status">{video.message}</p>
    <div className="media-dialog-actions"><button className="button" disabled={video.busy||(kind==='full-live-moment'&&!hasMotion)} onClick={()=>void video.generate(kind)}>{video.busy?'Generating video…':`${output?'Regenerate':'Generate'} ${kind==='live-strip'?'Live Strip':'Full Live Moment'}`}</button>{output?.src&&<a className="button" href={output.src} download={`vintage-photobooth-${kind}.${motionExtension(output.mime)}`}>Download {kind==='live-strip'?'Live Strip':'Full Live Moment'}</a>}</div>
    {video.busy&&<button className="text-link" onClick={video.cancel}>Cancel generation</button>}
  </>;
}
