"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { useMedia } from "./media-provider";
import { captureStill, decodeUpload } from "@/lib/media/still-image";
import { beginMotion } from "@/lib/media/motion-recorder";
import { runCountdown, wait } from "@/lib/media/countdown";
import type { Capture, MediaReference } from "@/lib/session/types";

export function useCapture(video: RefObject<HTMLVideoElement | null>) {
  const { session, dispatch } = usePhotoBoothSession();
  const { camera, store, state } = useMedia();
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [message, setMessage] = useState("");
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const recorder = useRef<ReturnType<typeof beginMotion>>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    operation.current?.abort();
    recorder.current?.cancel(); recorder.current = null;
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);
  const resetBusy = () => { setBusy(false); setCountdown(null); setFlash(false); };
  useEffect(() => {
    mounted.current = true;
    const hidden = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { mounted.current = false; document.removeEventListener("visibilitychange", hidden); cancel(); };
  }, [cancel, session.id]);
  const stream = camera.getVideoStream();
  useEffect(() => () => cancel(), [stream, cancel]);
  const complete = session.captures.length >= session.preferences.photoCount;

  const capture = async () => {
    if (operation.current || complete || state.status !== "ready" || !video.current) return;
    const element = video.current;
    const controller = new AbortController(); operation.current = controller;
    const allocated: MediaReference[] = [];
    setBusy(true); setMessage("");
    try {
      await runCountdown(session.preferences.timerSeconds, controller.signal, remaining => {
        setCountdown(remaining);
        if (remaining === 1) { const stream = camera.getRecordingStream(); recorder.current = stream ? beginMotion(stream) : null; }
      });
      const timestamp = Date.now();
      if (session.preferences.flash && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFlash(true); flashTimer.current = setTimeout(() => setFlash(false), 100);
      }
      const still = await captureStill(element, session.preferences.mirrored);
      controller.signal.throwIfAborted();
      let motion: Capture["motion"];
      if (recorder.current) {
        await wait(700, controller.signal);
        const clip = await recorder.current.finish(); controller.signal.throwIfAborted();
        if (clip) {
          const reference = store.add(clip.blob, element.videoWidth, element.videoHeight); allocated.push(reference);
          motion = { media: reference, durationMs: clip.durationMs, hasAudio: clip.hasAudio, mirrored: session.preferences.mirrored, crop: still.crop };
        }
      }
      controller.signal.throwIfAborted();
      const reference = store.add(still.blob, still.width, still.height); allocated.push(reference);
      dispatch({ type: "captures/add", sessionId: session.id, capture: { id: crypto.randomUUID(), source: "camera", still: reference, capturedAt: timestamp, filterAtCapture: session.customization.filterId, mirrorApplied: session.preferences.mirrored, ...(motion ? { motion } : {}) } });
      allocated.length = 0;
      setMessage(motion ? `Photo saved · motion ${motion.hasAudio ? "with audio" : "without audio"}.` : "Photo saved. Motion recording is unavailable in this browser.");
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Capture failed. Please try again.");
    } finally {
      for (const reference of allocated) if (reference.kind === "local") store.release(reference.resourceId);
      recorder.current?.cancel(); recorder.current = null;
      if (operation.current === controller) operation.current = null;
      if (mounted.current) resetBusy();
    }
  };

  const upload = async (files: File[] | null) => {
    if (!files?.length || operation.current || complete) return;
    const controller = new AbortController(); operation.current = controller;
    setBusy(true); setMessage("");
    const capacity = session.preferences.photoCount - session.captures.length;
    const selected = Array.from(files).slice(0, capacity);
    const errors: string[] = [];
    try {
      for (const file of selected) {
        try {
          const image = await decodeUpload(file, controller.signal); controller.signal.throwIfAborted();
          const still = store.add(image.blob, image.width, image.height);
          dispatch({ type: "captures/add", sessionId: session.id, capture: { id: crypto.randomUUID(), source: "upload", still, capturedAt: Date.now(), filterAtCapture: session.customization.filterId } });
        } catch (error) { if (controller.signal.aborted) break; errors.push(error instanceof Error ? error.message : "The image could not be opened."); }
      }
      if (!controller.signal.aborted) setMessage(errors[0] ?? (files.length > capacity ? `Added ${capacity} photos. Extra images were skipped.` : "Photos added from your device."));
    } finally { if (operation.current === controller) operation.current = null; if (mounted.current) resetBusy(); }
  };
  const restart = () => { cancel(); resetBusy(); setMessage(""); dispatch({ type: "captures/restart" }); };
  return { capture, upload, restart, busy, countdown, flash, message, complete };
}
