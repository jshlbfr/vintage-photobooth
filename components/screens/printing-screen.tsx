"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { Doodle } from "@/components/artwork/doodle";
import { useStripComposition } from "@/components/media/media-provider";

export function PrintingScreen() {
  const [complete, setComplete] = useState(false);
  const composition = useStripComposition();
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setComplete(true), reducedMotion ? 50 : 1700);
    return () => window.clearTimeout(timer);
  }, []);

  return <Panel className="printing-panel" labelledBy="printing-title"><Doodle kind="sparkles" /><h1 id="printing-title">PRINTING YOUR PHOTOS<span className="printing-dots">...</span></h1><p className="script">Good things take a little moment.</p><div className="print-machine"><div className="printer-slot" /><div className="print-output"><PhotoStrip composition={composition} /></div></div><p className="printing-status" role="status">{complete ? "Your photos are ready to collect." : "Your strip is on its way."}</p><div className="print-continuation">{complete && <Link href="/results" className="button">See Your Photos <span aria-hidden="true">→</span></Link>}</div></Panel>;
}
