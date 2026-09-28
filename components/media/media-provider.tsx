"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CameraController } from "@/lib/media/camera-controller";
import { MediaResourceStore } from "@/lib/media/resource-store";
import { usePhotoBoothSession, useSessionContext } from "@/components/session/session-provider";
import { selectStripComposition } from "@/lib/session/selectors";

const MediaContext = createContext<{ camera: CameraController; store: MediaResourceStore } | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [media] = useState(() => ({ camera: new CameraController(), store: new MediaResourceStore() }));
  const { session, dispatch } = useSessionContext();
  const pathname = usePathname();
  const cameraRoute = pathname === "/camera" || pathname === "/capture";
  const previousId = useRef<string | null>(null);
  const previousResources = useRef(new Set<string>());
  const state = useSyncExternalStore(media.camera.subscribe, media.camera.getSnapshot, media.camera.getServerSnapshot);

  useEffect(() => {
    if (previousId.current !== (session?.id ?? null)) {
      media.camera.stop(); media.store.clear(); previousResources.current.clear();
      previousId.current = session?.id ?? null;
    }
  }, [session?.id, media]);
  useEffect(() => {
    const current = new Set<string>();
    for (const capture of session?.captures ?? []) {
      for (const reference of [capture.still, capture.motion?.media]) if (reference?.kind === "local") current.add(reference.resourceId);
    }
    for (const output of Object.values(session?.outputs ?? {})) if (output) current.add(output.resourceId);
    for (const id of previousResources.current) if (!current.has(id)) media.store.release(id);
    previousResources.current = current;
  }, [session?.captures, session?.outputs, media]);
  useEffect(() => {
    if (!cameraRoute) { media.camera.stop(); return; }
    const refresh = () => { void media.camera.refreshDevices(); };
    refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, [cameraRoute, media]);
  useEffect(() => {
    if (state.status === "ready" && session && state.deviceId !== session.preferences.deviceId) dispatch({ type: "camera/device", deviceId: state.deviceId });
  }, [state.status, state.deviceId, session, dispatch]);
  useEffect(() => {
    const stop = () => media.camera.stop();
    window.addEventListener("pagehide", stop);
    return () => { window.removeEventListener("pagehide", stop); media.camera.stop(); media.store.clear(); };
  }, [media]);
  return <MediaContext.Provider value={media}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const media = useContext(MediaContext);
  if (!media) throw new Error("MediaProvider is required.");
  const state = useSyncExternalStore(media.camera.subscribe, media.camera.getSnapshot, media.camera.getServerSnapshot);
  return { ...media, state };
}

export function useStripComposition() {
  const { session } = usePhotoBoothSession();
  const { store } = useMedia();
  return selectStripComposition(session, store.resolve);
}
