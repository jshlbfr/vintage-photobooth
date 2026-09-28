export function selectRecordingType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    .find(type => MediaRecorder.isTypeSupported(type));
}

/** Records only the short shutter window. Unsupported recording never blocks a still. */
export function beginMotion(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  try {
    const type = selectRecordingType();
    const recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 2_500_000 });
    const chunks: Blob[] = [];
    let cancelled = false;
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const started = performance.now();
    let resolve!: (result: { blob: Blob; durationMs: number; hasAudio: boolean } | null) => void;
    const result = new Promise<{ blob: Blob; durationMs: number; hasAudio: boolean } | null>(done => { resolve = done; });
    const settle = (success: boolean) => {
      if (settled) return;
      settled = true; clearTimeout(timeout);
      recorder.ondataavailable = null; recorder.onstop = null; recorder.onerror = null;
      const blob = success && !cancelled && chunks.length ? new Blob(chunks, { type: recorder.mimeType || chunks[0].type }) : null;
      chunks.length = 0;
      resolve(blob?.size ? { blob, durationMs: Math.round(performance.now() - started), hasAudio: stream.getAudioTracks().some(track => track.readyState === "live") } : null);
    };
    recorder.ondataavailable = event => { if (event.data.size && !cancelled) chunks.push(event.data); };
    recorder.onstop = () => settle(true);
    recorder.onerror = () => { try { if (recorder.state !== "inactive") recorder.stop(); } catch {} settle(false); };
    recorder.start();
    const stop = () => {
      if (settled) return;
      try { if (recorder.state !== "inactive") recorder.stop(); } catch { settle(false); }
      timeout = setTimeout(() => settle(false), 2500);
    };
    return { finish: () => { stop(); return result; }, cancel: () => { cancelled = true; stop(); settle(false); } };
  } catch { return null; }
}
