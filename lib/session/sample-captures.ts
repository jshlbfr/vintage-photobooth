import { SAMPLE_PORTRAIT } from "../design-data";
import type { Capture, PhotoBoothSession } from "./types";

/** The only sample-capture factory. No media APIs or pretend camera objects. */
export function createSampleCaptures(session: PhotoBoothSession, timestamp: number): Capture[] {
  return Array.from({ length: session.preferences.photoCount }, (_, index) => ({
    id: `${session.id}:sample:${index + 1}`,
    source: "sample",
    still: { kind: "sample", src: SAMPLE_PORTRAIT, width: 1200, height: 1800 },
    capturedAt: timestamp,
    filterAtCapture: session.customization.filterId,
  }));
}
