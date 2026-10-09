"use client";

import { RewardDialog } from '@/components/rewards/reward-dialog';
import { QRShare } from '@/components/sharing/qr-share';
import { VideoResults } from '@/components/media/video-results';
import { useState } from 'react';
import { useGif } from '@/components/media/use-gif';
import { ResultsMediaDialog,GifPreview } from '@/components/media/results-media-dialog';
import { usePhotoDownload } from "@/components/media/use-photo-download";
import { Panel } from "@/components/ui/panel";
import { BackLink } from "@/components/ui/controls";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { ResultAction } from "@/components/photobooth/result-action";
import { Doodle } from "@/components/artwork/doodle";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useStripComposition } from "@/components/media/media-provider";

export function ResultsScreen() {
  const { startSession, session, dispatch } = usePhotoBoothSession();
  const photo=usePhotoDownload(),gif=useGif();
  const [media,setMedia]=useState<'gif'|'live'|'qr'|null>(null);
  const [pending,setPending]=useState<'gif'|'live'|'qr'|null>(null);
  const open=(kind:'gif'|'live'|'qr')=>{setMedia(kind);if(kind==='gif')void gif.generate();};
  const enhanced=(kind:'gif'|'live'|'qr')=>{if(session.rewards.enhancedFeaturesUnlocked)open(kind);else setPending(kind);};
  const close=()=>{gif.cancel();setMedia(null);};
  const composition = useStripComposition();
  return <><Panel className="results-panel" labelledBy="results-title">
    <BackLink href="/customize" label="Back to customize preview" />
    <div className="results-strip"><PhotoStrip composition={composition} label="Your session photostrip" /></div>
    <div className="results-content"><header className="results-heading"><Doodle kind="rays" className="results-rays" /><h1 id="results-title">YOUR PHOTOS<br />ARE READY!</h1><div className="results-subtitle"><Doodle kind="rays-alt" className="results-rays-alt" /><p className="script">Okayyy, these are going in the archives.</p></div><Doodle kind="hearts" className="results-hearts" /></header>
    <div className="results-primary-actions"><ResultAction icon="download" title="Download Photo" description={photo.busy?"Preparing your PNG…":"Save a high-resolution PNG"} free onClick={photo.download} busy={photo.busy} /><ResultAction icon="gif" title="Generate GIF" description="Animate your photo sequence" onClick={()=>enhanced('gif')} /><ResultAction icon="play" title="Generate Live Moment" description="Live Strip or Full Live Moment" onClick={()=>enhanced('live')} /><ResultAction icon="qr" title="Share via QR" description="Share your strip for 10 minutes" onClick={()=>enhanced('qr')} /><p id="results-preview-note" className="preview-note" role="status">{photo.message}</p></div>
    <hr className="results-divider" /><div className="results-secondary-actions"><ResultAction href="/camera" icon="camera" title="Take Another" description="Start a new session" onNavigate={startSession} /><ResultAction href="/customize" icon="edit" title="Edit Again" description="Go back to customize" /></div></div>
  </Panel>{pending&&<RewardDialog sessionId={session.id} onClose={()=>setPending(null)} onSuccess={receipt=>{dispatch({type:"rewards/unlock",receipt});const next=pending;setPending(null);open(next);}}/>}{media&&<ResultsMediaDialog title={media==='gif'?'Your photo sequence':media==='qr'?'Share via QR':'Your Live Moments'} onClose={close}>
    {media==='live'?<VideoResults />:media==='qr'?<QRShare />:<>
      {gif.src&&<GifPreview src={gif.src} />}
      <p className="media-note" role="status">{gif.message||'Your photos, in order. Each frame lasts 0.65 seconds.'}</p>
      <div className="media-dialog-actions">{gif.src&&<a className="button" href={gif.src} download="vintage-photobooth.gif">Download GIF</a>}<button type="button" className="button" disabled={gif.busy} onClick={()=>void gif.generate(true)}>{gif.busy?'Generating GIF…':gif.src?'Regenerate':'Try again'}</button></div>
    </>}
  </ResultsMediaDialog>}</>;
}
