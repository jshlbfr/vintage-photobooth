"use client";

import { ActionLink, BackLink, Button, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { SamplePreview } from "@/components/photobooth/sample-preview";
import { FilterPicker } from "@/components/photobooth/filter-picker";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { selectStripComposition } from "@/lib/session/selectors";

const instructions = [
  { title: "PICK YOUR LOOK", description: "Choose a filter. Flash if you need it." },
  { title: "STRIKE A POSE", description: "Hit Capture. Get ready for the countdown." },
  { title: "KEEP IT MOVING", description: "Move naturally—we capture the moments in between." },
];

export function CaptureScreen() {
  const { session, dispatch } = usePhotoBoothSession();
  const { flash, mirrored, photoCount, timerSeconds } = session.preferences;
  const composition = selectStripComposition(session);

  return <Panel className="workspace-panel capture-panel" labelledBy="capture-title">
    <h1 id="capture-title" className="sr-only">Photobooth capture preview</h1>
    <div className="capture-main">
      <header className="capture-toolbar"><div className="capture-counter"><BackLink href="/camera" label="Back to camera setup" /><span className="capture-count-label">PHOTO COUNT:</span><strong aria-label={`${session.captures.length} of ${photoCount} sample photos`}>{session.captures.length}/{photoCount}</strong></div><div className="flash-control"><span>Flash</span><Switch checked={flash} onChange={(enabled) => dispatch({ type: "camera/flash", enabled })} label="Screen flash" /><button className="icon-button" type="button" disabled title="Camera switching is not available in this sample preview" aria-label="Switch camera (not available in sample preview)"><Icon name="switch-camera" /></button></div></header>
      <SamplePreview filter={composition.filter} mirrored={mirrored} countdown={timerSeconds} />
      <div className="capture-actions"><Button disabled title="Photo uploads will be available in the capture milestone">Upload</Button><Button disabled title="Camera capture will be available in the capture milestone">Capture</Button></div>
      <FilterPicker value={session.customization.filterId} onChange={(filterId) => dispatch({ type: "customization/filter", filterId })} />
    </div>
    <div className="capture-strip"><PhotoStrip composition={composition} /></div>
    <ol className="capture-instructions">{instructions.map((step, index) => <li key={step.title}><h2><span>{index + 1}</span>{step.title}</h2><p>{step.description}</p></li>)}</ol>
    <ActionLink href="/customize" className="choose-frame">Choose Frame</ActionLink>
  </Panel>;
}
