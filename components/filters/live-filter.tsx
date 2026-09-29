"use client";
import { useEffect, useRef, useState, type RefObject } from 'react';
import { gradeCanvas } from '@/lib/filters/engine';
import type { FilterId } from '@/lib/filters/presets';
import type { PreviewResult } from '@/lib/filters/preview-worker';

export function LiveFilter({ video, filter, mirrored }: {
  video: RefObject<HTMLVideoElement | null>; filter: FilterId; mirrored: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    const source = video.current, target = canvas.current;
    if (filter === 'original' || !source || !target) return;
    let cancelled = false, pending = false, visible = false;
    let frame = 0, lastFrame = -Infinity, previewWidth = 512, fastFrames = 0;
    let worker: Worker | null = null;
    const videoFrames = typeof source.requestVideoFrameCallback === 'function';
    const show = () => { if (!visible) { visible = true; setReady(filter); } };
    const fallback = () => { worker?.terminate(); worker = null; pending = false; previewWidth = 320; };
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        worker = new Worker(new URL('../../lib/filters/preview-worker.ts', import.meta.url));
        worker.onmessage = ({ data }: MessageEvent<PreviewResult>) => {
          pending = false;
          if ('error' in data) { fallback(); return; }
          try {
            if (cancelled) return;
            if (target.width !== data.bitmap.width || target.height !== data.bitmap.height) {
              target.width = data.bitmap.width; target.height = data.bitmap.height;
            }
            target.getContext('2d')?.drawImage(data.bitmap, 0, 0);
            show();
            // Stay within a camera-frame budget instead of accumulating delayed frames.
            if (data.elapsed > 25) { previewWidth = Math.max(320, Math.round(previewWidth * .8)); fastFrames = 0; }
            else if (data.elapsed < 12 && ++fastFrames >= 30) { previewWidth = Math.min(640, previewWidth + 64); fastFrames = 0; }
          } finally { data.bitmap.close(); }
        };
        worker.onerror = fallback;
      } catch { fallback(); }
    }
    const draw = (now: number) => {
      if (cancelled) return;
      frame = videoFrames ? source.requestVideoFrameCallback(draw) : requestAnimationFrame(draw);
      if (pending || document.hidden || source.readyState < 2 || (!videoFrames && now - lastFrame < 30)) return;
      lastFrame = now;
      const width = Math.min(previewWidth, source.videoWidth);
      const height = Math.max(1, Math.round(source.videoHeight * width / source.videoWidth));
      if (worker) {
        pending = true;
        void createImageBitmap(source, { resizeWidth: width, resizeHeight: height, resizeQuality: 'low' }).then(bitmap => {
          if (cancelled || !worker) { bitmap.close(); pending = false; return; }
          try { worker.postMessage({ bitmap, filter }, [bitmap]); }
          catch { bitmap.close(); fallback(); }
        }).catch(() => { pending = false; });
      } else {
        // Small, frame-scheduled fallback for browsers without worker Canvas support.
        const started = performance.now();
        try {
          if (target.width !== width || target.height !== height) { target.width = width; target.height = height; }
          target.getContext('2d', { willReadFrequently: true })?.drawImage(source, 0, 0, width, height);
          gradeCanvas(target, filter); show();
          if (performance.now() - started > 25) previewWidth = Math.max(240, Math.round(previewWidth * .8));
        } catch { /* Keep the raw camera available if a preview cannot be rendered. */ }
      }
    };
    frame = videoFrames ? source.requestVideoFrameCallback(draw) : requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      if (videoFrames) source.cancelVideoFrameCallback(frame); else cancelAnimationFrame(frame);
      worker?.terminate();
    };
  }, [video, filter]);
  return filter === 'original' ? null : <canvas ref={canvas} aria-hidden="true" className="live-filter-canvas" style={{ visibility: ready === filter ? 'visible' : 'hidden', transform: mirrored ? 'scaleX(-1)' : undefined }} />;
}
