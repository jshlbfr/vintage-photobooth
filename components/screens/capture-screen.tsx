"use client";

import { useState } from "react";
import { ActionLink, BackLink, Button, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { SamplePreview } from "@/components/photobooth/sample-preview";
import { FilterPicker } from "@/components/photobooth/filter-picker";
import { sampleComposition } from "@/lib/composition";
import { FILTER_PREVIEWS, PHOTO_COUNTS, type PhotoCount } from "@/lib/design-data";

const instructions = [
  { title: "PICK YOUR LOOK", description: "Choose a filter. Flash if you need it." },
  { title: "STRIKE A POSE", description: "Hit Capture. Get ready for the countdown." },
  { title: "KEEP IT MOVING", description: "Move naturally—we capture the moments in between." },
];

export function CaptureScreen() {
  const [flash, setFlash] = useState(true);
  const [filter, setFilter] = useState(1);
  const [count, setCount] = useState<PhotoCount>(4);
  const composition = sampleComposition({ count, filter: FILTER_PREVIEWS[filter].css });

  return <Panel className="workspace-panel capture-panel" labelledBy="capture-title">
    <h1 id="capture-title" className="sr-only">Photobooth capture preview</h1>
    <div className="capture-main">
      <header className="capture-toolbar"><div className="capture-counter"><BackLink href="/camera" label="Back to camera setup" /><label htmlFor="preview-count">PHOTO COUNT:</label><select id="preview-count" aria-label="Sample strip photo count" value={count} onChange={(event) => { const next = Number(event.target.value); if (PHOTO_COUNTS.includes(next as PhotoCount)) setCount(next as PhotoCount); }}>{PHOTO_COUNTS.map((value) => <option key={value} value={value}>{value}/{value}</option>)}</select></div><div className="flash-control"><span>Flash</span><Switch checked={flash} onChange={setFlash} label="Screen flash" /><button className="icon-button" type="button" disabled title="Camera switching is not available in this sample preview" aria-label="Switch camera (not available in sample preview)"><Icon name="switch-camera" /></button></div></header>
      <SamplePreview filter={composition.filter} countdown />
      <div className="capture-actions"><Button disabled title="Photo uploads will be available in the capture milestone">Upload</Button><Button disabled title="Camera capture will be available in the capture milestone">Capture</Button></div>
      <FilterPicker value={filter} onChange={setFilter} />
    </div>
    <div className="capture-strip"><PhotoStrip composition={composition} /></div>
    <ol className="capture-instructions">{instructions.map((step, index) => <li key={step.title}><h2><span>{index + 1}</span>{step.title}</h2><p>{step.description}</p></li>)}</ol>
    <ActionLink href="/customize" className="choose-frame">Choose Frame</ActionLink>
  </Panel>;
}
