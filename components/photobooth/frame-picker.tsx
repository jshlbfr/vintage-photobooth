import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { framesForCount } from "@/lib/frame-templates";
import type { StripComposition } from "@/lib/composition";

export function FramePicker({ composition, frameIndex, onChange }: {
  composition: StripComposition;
  frameIndex: number;
  onChange: (index: number) => void;
}) {
  const frames = framesForCount(composition.count);
  const frame = frames[frameIndex];
  return <section className="frame-picker" aria-label="Frame selection">
    <div className="frame-carousel" role="group" aria-label="Available frames">
      <button type="button" className="round-arrow" aria-label="Previous frame" onClick={() => onChange((frameIndex + frames.length - 1) % frames.length)}><Icon name="chevron-left" /></button>
      <div className="frame-template"><PhotoStrip composition={composition} label={frame.name} /></div>
      <button type="button" className="round-arrow" aria-label="Next frame" onClick={() => onChange((frameIndex + 1) % frames.length)}><Icon name="chevron-right" /></button>
    </div>
    <p className="frame-selection" role="status" aria-live="polite" aria-atomic="true"><strong>{frame.name}</strong></p>
    <p className="sr-only">{frame.description}</p>
  </section>;
}
