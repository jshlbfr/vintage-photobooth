"use client";

import { Panel } from "@/components/ui/panel";
import { BackLink } from "@/components/ui/controls";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { ResultAction } from "@/components/photobooth/result-action";
import { Doodle } from "@/components/artwork/doodle";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { selectStripComposition } from "@/lib/session/selectors";

export function ResultsScreen() {
  const { session, startSession } = usePhotoBoothSession();
  const composition = selectStripComposition(session);
  return <Panel className="results-panel" labelledBy="results-title">
    <BackLink href="/customize" label="Back to customize preview" />
    <div className="results-strip"><PhotoStrip composition={composition} label="Your session photostrip" /></div>
    <header className="results-heading"><Doodle kind="rays" className="results-rays" /><h1 id="results-title">YOUR PHOTOS<br />ARE READY!</h1><Doodle kind="rays-alt" className="results-rays-alt" /><p className="script">Okayyy, these are going in the archives.</p><Doodle kind="hearts" className="results-hearts" /></header>
    <div className="results-primary-actions"><ResultAction icon="download" title="Download Photo" description="Save to your device" free /><ResultAction icon="gif" title="Generate GIF" description="Watch an ad to unlock" /><ResultAction icon="play" title="Generate Live Moment" description="Watch an ad to unlock" /><ResultAction icon="qr" title="Share via QR" description="Watch an ad to unlock" /><p id="results-preview-note" className="preview-note">Sample preview · downloads and sharing aren’t available yet.</p></div>
    <div className="results-secondary-actions"><ResultAction href="/camera" icon="camera" title="Take Another" description="Start a new session" onNavigate={startSession} /><ResultAction href="/customize" icon="edit" title="Edit Again" description="Go back to customize" /></div>
  </Panel>;
}
