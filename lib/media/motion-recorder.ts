export function selectRecordingType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    .find(type => MediaRecorder.isTypeSupported(type));
}

/** One encoder for the active capture session. Tracks are borrowed from CameraController. */
export function beginMotion(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  try {
    const type = selectRecordingType();
    const recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 2_500_000 });
    const chunks: Blob[] = [];
    const hasAudio = stream.getAudioTracks().some(track => track.readyState === "live");
    let settled = false, stopping = false, failed = false, bytes = 0;
    let elapsed = 0, runningSince: number | null = performance.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const currentTimeMs = () => elapsed + (runningSince === null ? 0 : performance.now() - runningSince);
    const freezeClock = () => { elapsed = currentTimeMs(); runningSince = null; };
    type Result = { blob: Blob; durationMs: number; hasAudio: boolean };
    let resolve!: (result: Result | null) => void;
    const result = new Promise<Result | null>(done => { resolve = done; });
    const settle = (success: boolean) => {
      if (settled) return;
      settled = true; freezeClock(); clearTimeout(timeout);
      recorder.ondataavailable = null; recorder.onstop = null; recorder.onerror = null;
      const blob = success && chunks.length ? new Blob(chunks, { type: recorder.mimeType || chunks[0].type }) : null;
      chunks.length = 0;
      resolve(blob?.size ? { blob, durationMs: Math.round(elapsed), hasAudio } : null);
    };
    const cancel = () => {
      failed = true;
      try { if (recorder.state !== "inactive") recorder.stop(); } catch {}
      settle(false);
    };
    recorder.ondataavailable = event => {
      if (settled || !event.data.size) return;
      bytes += event.data.size;
      // Bound long/abandoned sessions without reducing still-image quality.
      if (bytes > 100 * 1024 * 1024) { cancel(); return; }
      chunks.push(event.data);
    };
    recorder.onstop = () => { if (!stopping) failed = true; settle(stopping); };
    recorder.onerror = cancel;
    recorder.start(1000);
    return {
      currentTimeMs,
      get available() { return !failed; },
      pause: () => { if (!settled && recorder.state === "recording") { try { recorder.pause(); freezeClock(); } catch { cancel(); } } },
      resume: () => { if (!settled && recorder.state === "paused") { try { recorder.resume(); runningSince = performance.now(); } catch { cancel(); } } },
      finish: () => {
        if (!settled && !stopping) {
          stopping = true; freezeClock();
          try { if (recorder.state !== "inactive") recorder.stop(); else settle(false); } catch { settle(false); }
          if (!settled) timeout = setTimeout(() => { failed = true; settle(false); }, 5000);
        }
        return result;
      },
      cancel,
    };
  } catch { return null; }
}
