"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { ActionLink, BackLink, Button, Switch } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { useThumbnailSource } from "@/components/filters/use-thumbnail-source";
import { FilterPicker } from "@/components/photobooth/filter-picker";
import { CameraPreview } from "@/components/media/camera-preview";
import { useMedia, useStripComposition } from "@/components/media/media-provider";
import { useCapture } from "@/components/media/use-capture";
import { usePhotoBoothSession } from "@/components/session/session-provider";

const instructions = [
  { title: "PICK YOUR LOOK", description: "Choose a filter. Flash if you need it." },
  { title: "STRIKE A POSE", description: "Hit Capture. Get ready for the countdown." },
  { title: "KEEP IT MOVING", description: "Move naturally—we capture the moments in between." },
];

export function CaptureScreen() {
  const { session, dispatch } = usePhotoBoothSession();
  const { camera, state } = useMedia();
  const video = useRef<HTMLVideoElement>(null);
  const thumbnailSource=useThumbnailSource(video,session.preferences.mirrored,state.deviceId);
  const input = useRef<HTMLInputElement>(null);
  const capture = useCapture(video);
  const composition = useStripComposition();
  const devices = state.devices.filter(device => device.id);
  const switchCamera = () => {
    const index = devices.findIndex(device => device.id === state.deviceId);
    const next = devices[(index + 1) % devices.length];
    if (next) void camera.start(next.id);
  };
  return <>{capture.flash && createPortal(<div className="screen-flash" aria-hidden="true" />, document.body)}<Panel className="workspace-panel capture-panel" labelledBy="capture-title">
    <h1 id="capture-title" className="sr-only">Photobooth capture</h1>
    <div className="capture-main">
      <header className="capture-toolbar"><div className="capture-counter"><BackLink href="/camera" label="Back to camera setup" /><span className="capture-count-label">PHOTO COUNT:</span><strong aria-live="polite" aria-label={`${session.captures.length} of ${session.preferences.photoCount} photos`}>{session.captures.length}/{session.preferences.photoCount}</strong></div><div className="flash-control"><span>Flash</span><Switch checked={session.preferences.flash} onChange={(enabled) => dispatch({ type: "camera/flash", enabled })} label="Screen flash" disabled={capture.busy} /><button className="icon-button" type="button" disabled={capture.busy || state.status === "requesting" || devices.length < 2} title={devices.length < 2 ? "One camera available" : "Switch to the next camera"} aria-label="Switch camera" onClick={switchCamera}><Icon name="switch-camera" /></button></div></header>
      <CameraPreview videoRef={video} countdown={capture.countdown} />
      <div className="capture-actions"><Button disabled={capture.busy || capture.complete} onClick={() => input.current?.click()}>Upload</Button>{capture.busy && capture.continuous && capture.phase !== "uploading" ? <Button onClick={capture.pause} aria-label="Pause capture">Pause</Button> : <Button disabled={capture.busy || capture.complete || state.status !== "ready"} onClick={() => void capture.capture()}>{capture.busy ? "Please wait…" : capture.phase === "paused" ? "Resume" : "Capture"}</Button>}</div>
      <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" multiple tabIndex={-1} aria-label="Upload photos" onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); void capture.upload(files); event.currentTarget.value = ""; }} />
      <div className="capture-feedback"><p role="status">{capture.message || (capture.complete ? "All photos are ready. Choose your frame." : "Photos and motion stay on this device.")}</p>{(session.captures.length > 0 || capture.busy) && <button className="text-link" type="button" onClick={capture.restart}>Restart</button>}</div>
      <FilterPicker source={thumbnailSource} value={session.customization.filterId} onChange={(filterId) => dispatch({ type: "customization/filter", filterId })} disabled={capture.busy} />
    </div>
    <div className="capture-strip"><PhotoStrip composition={composition} label="Your captured photostrip" /></div>
    <ol className="capture-instructions">{instructions.map((step, index) => <li key={step.title}><h2><span className="instruction-badge"><b>{index + 1}</b></span>{step.title}</h2><p>{step.description}</p></li>)}</ol>
    {capture.complete && !capture.busy ? <ActionLink href="/customize" className="choose-frame" onNavigate={camera.stop}>Choose Frame</ActionLink> : <Button className="choose-frame" disabled>Choose Frame <Icon name="arrow-right" /></Button>}
  </Panel></>;
}
