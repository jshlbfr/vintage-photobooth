"use client";

import { ActionLink } from "@/components/ui/controls";
import { useSessionContext } from "./session-provider";

export function StartSessionLink() {
  const { startSession } = useSessionContext();
  return <ActionLink href="/camera" className="button-cream" arrow={false} onNavigate={startSession}>START</ActionLink>;
}
