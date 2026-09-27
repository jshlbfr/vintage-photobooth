"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionContext } from "./session-provider";
import { hasCompleteCaptures } from "@/lib/session/selectors";

export function SessionGate({ children }: { children: ReactNode }) {
  const { session, ensureSession } = useSessionContext();
  const pathname = usePathname();
  const router = useRouter();
  const setup = pathname === "/camera";
  const ready = Boolean(session && (setup || hasCompleteCaptures(session)));

  useEffect(() => {
    if (ready) return;
    if (setup) ensureSession();
    else router.replace("/camera");
  }, [ready, setup, ensureSession, router]);

  return ready ? children : <div className="cream-panel session-loading" role="status">Opening Camera Setup…</div>;
}
