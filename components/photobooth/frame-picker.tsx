import { Icon } from "@/components/ui/icon";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { FRAME_STYLES } from "@/lib/design-data";
import type { StripComposition } from "@/lib/composition";

export function FramePicker({ composition, frameIndex, onChange }: { composition: StripComposition; frameIndex: number; onChange: (index: number) => void }) {
  return <div className="frame-picker" role="group" aria-label="Sample frame styles"><button className="round-arrow" aria-label="Previous frame" onClick={() => onChange((frameIndex + FRAME_STYLES.length - 1) % FRAME_STYLES.length)}><Icon name="chevron-left" /></button><div className="frame-template"><PhotoStrip composition={composition} empty label={FRAME_STYLES[frameIndex].name} /><span className="sr-only" role="status">{FRAME_STYLES[frameIndex].name}</span></div><button className="round-arrow" aria-label="Next frame" onClick={() => onChange((frameIndex + 1) % FRAME_STYLES.length)}><Icon name="chevron-right" /></button></div>;
}
