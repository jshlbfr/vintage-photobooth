"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { Doodle } from "@/components/artwork/doodle";
import { usePhotoBoothSession } from "@/components/session/session-provider";
import { selectStripComposition } from "@/lib/session/selectors";

export function PrintingScreen() {
  const router = useRouter();
  const { session } = usePhotoBoothSession();
  const composition = selectStripComposition(session);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => router.replace("/results"), reducedMotion ? 300 : 1800);
    return () => window.clearTimeout(timer);
  }, [router]);

  return <Panel className="printing-panel" labelledBy="printing-title"><Doodle kind="sparkles" /><h1 id="printing-title">PRINTING YOUR PHOTOS<span className="printing-dots">...</span></h1><p className="script">Good things take a little moment.</p><div className="print-machine"><div className="printer-slot" /><div className="print-output"><PhotoStrip composition={composition} /></div></div><p className="printing-status" role="status">Your sample strip is on its way.</p><Link href="/results" className="text-link">See your photos <span aria-hidden="true">→</span></Link></Panel>;
}
