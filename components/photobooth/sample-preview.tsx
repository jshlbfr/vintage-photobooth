import Image from "next/image";
import { FILTER_PREVIEWS, SAMPLE_PORTRAIT } from "@/lib/design-data";

export function SamplePreview({ mirrored = false, filter = FILTER_PREVIEWS[1].css, countdown = false }: { mirrored?: boolean; filter?: string; countdown?: boolean }) {
  return <div className="camera-preview">
    <Image src={SAMPLE_PORTRAIT} alt="Sample portrait used to preview the photobooth layout" fill sizes="(max-width: 700px) 90vw, 650px" className="sample-photo" style={{ filter, transform: `${mirrored ? "scaleX(-1) " : ""}scale(1.2)` }} preload />
    <span className="sample-badge">Sample preview</span>
    {countdown && <span className="countdown" aria-label="Sample countdown: 3">3</span>}
  </div>;
}
