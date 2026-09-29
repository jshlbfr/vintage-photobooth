"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useMedia } from "./media-provider";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { LiveFilter } from "@/components/filters/live-filter";

export function CameraPreview({ videoRef: suppliedRef, countdown }: {
  videoRef?: RefObject<HTMLVideoElement | null>; countdown?: number | null;
}) {
  const fallbackRef = useRef<HTMLVideoElement>(null);
  const videoRef = suppliedRef ?? fallbackRef;
  const { camera, state } = useMedia();
  const { session } = usePhotoBoothSession();
  const [playError, setPlayError] = useState(false);
  const stream = camera.getVideoStream();
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    video.srcObject = stream;
    if (stream) void video.play().then(() => { if (active) setPlayError(false); }).catch(() => { if (active) setPlayError(true); });
    return () => { active = false; video.pause(); video.srcObject = null; };
  }, [stream, videoRef]);
  const start = async () => {
    await camera.start(session.preferences.deviceId);
    if (session.preferences.audioEnabled && camera.getSnapshot().audio !== "denied") await camera.enableAudio();
  };
  return <div className="camera-preview live-camera-preview">
    <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" className="live-camera-video" style={{ transform: session.preferences.mirrored ? "scaleX(-1)" : undefined }} />
    {state.status === "ready" && <LiveFilter video={videoRef} filter={session.customization.filterId} mirrored={session.preferences.mirrored} />}
    {state.status !== "ready" && <div className="camera-empty"><p role={state.error ? "alert" : "status"}>{state.error ?? (state.status === "requesting" ? "Waiting for camera permission…" : "Step inside. Your camera stays local.")}</p><button type="button" className="button button-cream" disabled={state.status === "requesting"} onClick={() => void start()}>{state.error ? "Try Camera Again" : "Enable Camera"}</button>{state.status === "requesting" && <button type="button" className="text-link" onClick={camera.stop}>Cancel</button>}</div>}
    {state.status === "ready" && playError && <button className="button preview-play" type="button" onClick={() => void videoRef.current?.play().then(() => setPlayError(false)).catch(() => setPlayError(true))}>Start Preview</button>}
    {countdown !== undefined && countdown !== null && countdown > 0 && <span className="countdown" role="status" aria-live="polite">{countdown === 1 ? "Smile!" : countdown}</span>}
  </div>;
}
