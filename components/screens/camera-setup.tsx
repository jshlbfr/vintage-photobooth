"use client";

import { ActionLink, BackLink, SegmentedControl, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { SamplePreview } from "@/components/photobooth/sample-preview";
import { PHOTO_COUNTS, TIMERS } from "@/lib/design-data";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { SAMPLE_CAMERAS } from "@/lib/session/defaults";
import { selectFilter } from "@/lib/session/selectors";

export function CameraSetup() {
  const { session, dispatch } = usePhotoBoothSession();
  const { photoCount, timerSeconds, mirrored, deviceId } = session.preferences;

  return <Panel className="setup-panel" labelledBy="setup-title">
    <header className="panel-heading"><BackLink href="/" label="Back to landing" /><h1 id="setup-title">Camera Setup</h1><p>Allow camera access to start.</p></header>
    <SamplePreview mirrored={mirrored} filter={selectFilter(session).css} />
    <div className="setup-settings">
      <label htmlFor="camera-device">Camera</label><select id="camera-device" value={deviceId} onChange={(event) => dispatch({ type: "camera/device", deviceId: event.target.value })} aria-describedby="setup-note">{SAMPLE_CAMERAS.map(camera => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select>
      <div className="mirror-control"><span id="mirror-label">Mirror Camera</span><Switch checked={mirrored} onChange={(mirrored) => dispatch({ type: "camera/mirror", mirrored })} label="Mirror Camera" /></div>
      <span id="count-label">Photo Count</span><SegmentedControl label="Photo count" values={PHOTO_COUNTS} value={photoCount} onChange={(count) => dispatch({ type: "camera/count", count })} />
      <span>Timer</span><SegmentedControl label="Timer" values={TIMERS} value={timerSeconds} onChange={(seconds) => dispatch({ type: "camera/timer", seconds })} suffix="s" />
    </div>
    <ActionLink href="/capture" className="setup-continue" onNavigate={() => dispatch({ type: "captures/prepare-samples", timestamp: Date.now() })}>Continue</ActionLink>
    <p id="setup-note" className="sr-only">Visual preview only. Settings persist for this session; refreshing returns to Camera Setup. No camera or microphone is accessed.</p>
  </Panel>;
}
