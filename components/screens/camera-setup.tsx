"use client";

import { useState } from "react";
import { ActionLink, BackLink, SegmentedControl, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { SamplePreview } from "@/components/photobooth/sample-preview";
import { PHOTO_COUNTS, TIMERS, type PhotoCount } from "@/lib/design-data";

export function CameraSetup() {
  const [count, setCount] = useState<PhotoCount>(4);
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(3);
  const [mirrored, setMirrored] = useState(true);

  return <Panel className="setup-panel" labelledBy="setup-title">
    <header className="panel-heading"><BackLink href="/" label="Back to landing" /><h1 id="setup-title">Camera Setup</h1><p>Allow camera access to start.</p></header>
    <SamplePreview mirrored={mirrored} />
    <div className="setup-settings">
      <label htmlFor="camera-device">Camera</label><select id="camera-device" defaultValue="sample" aria-describedby="setup-note"><option value="sample">Sample camera</option></select>
      <div className="mirror-control"><span id="mirror-label">Mirror Camera</span><Switch checked={mirrored} onChange={setMirrored} label="Mirror Camera" /></div>
      <span id="count-label">Photo Count</span><SegmentedControl label="Photo count" values={PHOTO_COUNTS} value={count} onChange={setCount} />
      <span>Timer</span><SegmentedControl label="Timer" values={TIMERS} value={timer} onChange={setTimer} suffix="s" />
    </div>
    <ActionLink href="/capture" className="setup-continue">Continue</ActionLink>
    <p id="setup-note" className="sr-only">Visual preview only. These settings apply to this page. No camera or microphone is accessed.</p>
  </Panel>;
}
