"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { createSession } from "@/lib/session/defaults";
import { sessionReducer } from "@/lib/session/reducer";
import type { SessionAction } from "@/lib/session/actions";
import type { PhotoBoothSession } from "@/lib/session/types";

type SessionContextValue = {
  session: PhotoBoothSession | null;
  dispatch: Dispatch<SessionAction>;
  startSession: () => void;
  ensureSession: () => void;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, null);
  const startSession = useCallback(() => dispatch({ type: "session/start", session: createSession(crypto.randomUUID(), Date.now()) }), []);
  const ensureSession = useCallback(() => dispatch({ type: "session/ensure", session: createSession(crypto.randomUUID(), Date.now()) }), []);
  const value = useMemo(() => ({ session, dispatch, startSession, ensureSession }), [session, startSession, ensureSession]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("SessionProvider is required.");
  return context;
}

/** Only mounted beneath SessionGate, which ensures a valid active session. */
export function usePhotoBoothSession() {
  const context = useSessionContext();
  if (!context.session) throw new Error("SessionGate must wrap booth screens.");
  return { ...context, session: context.session };
}
