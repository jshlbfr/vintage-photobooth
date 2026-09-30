"use client";

import { useState } from 'react';
import { useGif } from '@/components/media/use-gif';
import { ResultsMediaDialog,GifPreview,LiveMomentPreview } from '@/components/media/results-media-dialog';
import { usePhotoDownload } from "@/components/media/use-photo-download";
import { Panel } from "@/components/ui/panel";
import { BackLink } from "@/components/ui/controls";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { ResultAction } from "@/components/photobooth/result-action";
import { Doodle } from "@/components/artwork/doodle";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useStripComposition } from "@/components/media/media-provider";

export function ResultsScreen() {
  const { startSession } = usePhotoBoothSession();
  const photo=usePhotoDownload(),gif=useGif();
  const [media,setMedia]=useState<'gif'|'live'|null>(null);
  const close=()=>{gif.cancel();setMedia(null);};
  const composition = useStripComposition();
  return <><Panel className="results-panel" labelledBy="results-title">
    <BackLink href="/customize" label="Back to customize preview" />
    <div className="results-strip"><PhotoStrip composition={composition} label="Your session photostrip" /></div>
    <header className="results-heading"><Doodle kind="rays" className="results-rays" /><h1 id="results-title">YOUR PHOTOS<br />ARE READY!</h1><Doodle kind="rays-alt" className="results-rays-alt" /><p className="script">Okayyy, these are going in the archives.</p><Doodle kind="hearts" className="results-hearts" /></header>
    <div className="results-primary-actions"><ResultAction icon="download" title="Download Photo" description={photo.busy?"Preparing your PNG…":"Save a high-resolution PNG"} free onClick={photo.download} busy={photo.busy} /><ResultAction icon="gif" title="Generate GIF" description="Animate your photo sequence" onClick={()=>{setMedia('gif');void gif.generate();}} /><ResultAction icon="play" title="Generate Live Moment" description="Replay the moments around each photo" onClick={()=>setMedia('live')} /><ResultAction icon="qr" title="Share via QR" description="Coming soon" /><p id="results-preview-note" className="preview-note" role="status">{photo.message}</p></div>
    <div className="results-secondary-actions"><ResultAction href="/camera" icon="camera" title="Take Another" description="Start a new session" onNavigate={startSession} /><ResultAction href="/customize" icon="edit" title="Edit Again" description="Go back to customize" /></div>
  </Panel>{media&&<ResultsMediaDialog title={media==='gif'?'Your photo sequence':'Your Live Moments'} onClose={close}>
    {media==='live'?<LiveMomentPreview />:<>
      {gif.src&&<GifPreview src={gif.src} />}
      <p className="media-note" role="status">{gif.message||'Your photos, in order. Each frame lasts 0.65 seconds.'}</p>
      <div className="media-dialog-actions">{gif.src&&<a className="button" href={gif.src} download="vintage-photobooth.gif">Download GIF</a>}<button type="button" className="button" disabled={gif.busy} onClick={()=>void gif.generate(true)}>{gif.busy?'Generating GIF…':gif.src?'Regenerate':'Try again'}</button></div>
    </>}
  </ResultsMediaDialog>}</>;
}
