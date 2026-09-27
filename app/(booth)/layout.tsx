import type { ReactNode } from "react";
import { SessionGate } from "@/components/session/session-gate";

export default function BoothLayout({ children }: { children: ReactNode }) {
  return <main id="main-content" className="booth-shell"><SessionGate>{children}</SessionGate></main>;
}
