import { Icon } from "@/components/ui/icon";
import { framesForCount } from "@/lib/frame-templates";
import { getStripLayout, type StripComposition } from "@/lib/composition";

export function FramePicker({ composition, frameIndex, onChange }: {
  composition: StripComposition;
  frameIndex: number;
  onChange: (index: number) => void;
}) {
  const frames = framesForCount(composition.count);
  const frame = frames[frameIndex];
  const layout = getStripLayout(composition);
  const bounds=layout.backing ?? {x:0,y:0,width:layout.width,height:layout.height};
  return <section className="frame-picker" aria-label="Frame selection">
    <h2 className="frame-picker-title">Frame</h2>
    <div className="frame-carousel" role="group" aria-label="Available frames">
      <button type="button" className="round-arrow" aria-label="Previous frame" onClick={() => onChange((frameIndex + frames.length - 1) % frames.length)}><Icon name="chevron-left" /></button>
      <div className="frame-template"><svg className="photo-strip frame-outline" viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label={`${frame.name}, empty frame with ${composition.count} photo windows`}>
        <rect {...(layout.backing ?? {width:layout.width,height:layout.height})} rx={layout.backing?.radius ?? layout.radius} fill="#000000" />
        {layout.slots.map((slot,index)=><rect key={index} {...slot} rx={slot.radius} fill="var(--cream)" />)}
      </svg></div>
      <button type="button" className="round-arrow" aria-label="Next frame" onClick={() => onChange((frameIndex + 1) % frames.length)}><Icon name="chevron-right" /></button>
    </div>
    <p className="frame-selection" role="status" aria-live="polite" aria-atomic="true"><strong>{frame.name}</strong></p>
    <p className="sr-only">{frame.description}</p>
  </section>;
}
