"use client";

import { ActionLink, BackLink, SegmentedControl, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { CameraPreview } from "@/components/media/camera-preview";
import { useMedia } from "@/components/media/media-provider";
import { PHOTO_COUNTS, TIMERS } from "@/lib/design-data";
import { usePhotoBoothSession } from "@/components/session/session-provider";

export function CameraSetup() {
  const { session, dispatch } = usePhotoBoothSession();
  const { camera, state } = useMedia();
  const { photoCount, timerSeconds, mirrored, deviceId } = session.preferences;
  const audioLabel = state.audio === "ready" ? "Audio on" : state.audio === "requesting" ? "Waiting for microphone…" : state.audio === "denied" ? "Microphone blocked · silent motion" : state.audio === "unavailable" ? "No microphone · silent motion" : "Optional audio for Live Moment";
  const toggleAudio = async () => {
    if (state.audio === "ready") { camera.stopAudio(); dispatch({ type: "camera/audio", enabled: false }); }
    else {
      dispatch({ type: "camera/audio", enabled: true });
      await camera.enableAudio();
    }
  };
  return <Panel className="setup-panel" labelledBy="setup-title">
    <header className="panel-heading"><BackLink href="/" label="Back to landing" /><h1 id="setup-title">Camera Setup</h1><p>Allow camera access to start.</p></header>
    <CameraPreview />
    <div className="setup-settings">
      <label htmlFor="camera-device">Camera</label><select id="camera-device" value={deviceId} disabled={state.status === "requesting"} onChange={(event) => { dispatch({ type: "camera/device", deviceId: event.target.value }); void camera.start(event.target.value); }} aria-describedby="setup-note">
        <option value="">Default camera</option>{state.devices.filter(device => device.id).map(device => <option key={device.id} value={device.id}>{device.label}</option>)}
      </select>
      <div className="mirror-control"><span>Mirror Camera</span><Switch checked={mirrored} onChange={(mirrored) => dispatch({ type: "camera/mirror", mirrored })} label="Mirror Camera" /></div>
      <span>Photo Count</span><SegmentedControl label="Photo count" values={PHOTO_COUNTS} value={photoCount} onChange={(count) => dispatch({ type: "camera/count", count })} />
      <span>Timer</span><SegmentedControl label="Timer" values={TIMERS} value={timerSeconds} onChange={(seconds) => dispatch({ type: "camera/timer", seconds })} suffix="s" />
    </div>
    <div className="audio-option"><span role="status">{audioLabel}</span><button type="button" className="text-link" disabled={state.status !== "ready" || state.audio === "requesting"} onClick={() => void toggleAudio()}>{state.audio === "ready" ? "Turn off" : state.audio === "denied" ? "Retry audio" : "Enable audio"}</button></div>
    <ActionLink href="/capture" className="setup-continue" onNavigate={() => dispatch({ type: "captures/begin" })}>Continue</ActionLink>
    <p id="setup-note" className="sr-only">Camera is required for taking photos. You can continue without it to upload images. Audio is optional. All media stays in this browser.</p>
  </Panel>;
}
