import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { FRAME_STYLES } from "@/lib/design-data";
import type { StripComposition } from "@/lib/composition";

export function FramePicker({ composition, frameIndex, onChange }: {
  composition: StripComposition;
  frameIndex: number;
  onChange: (index: number) => void;
}) {
  const frame = FRAME_STYLES[frameIndex];
  return <section className="frame-picker" aria-label="Frame selection">
    <div className="frame-carousel" role="group" aria-label="Built-in frames">
      <button type="button" className="round-arrow" aria-label="Previous frame" onClick={() => onChange((frameIndex + FRAME_STYLES.length - 1) % FRAME_STYLES.length)}><Icon name="chevron-left" /></button>
      <div className="frame-template"><PhotoStrip composition={composition} label={frame.name} /></div>
      <button type="button" className="round-arrow" aria-label="Next frame" onClick={() => onChange((frameIndex + 1) % FRAME_STYLES.length)}><Icon name="chevron-right" /></button>
    </div>
    <p className="frame-selection" role="status" aria-live="polite" aria-atomic="true"><strong>{frame.name}</strong></p>
    <p className="sr-only">{frame.description}</p>
  </section>;
}
