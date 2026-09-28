export type CameraState = {
  status: "idle" | "requesting" | "ready" | "error";
  devices: readonly { id: string; label: string }[];
  deviceId: string;
  error: string | null;
  audio: "off" | "requesting" | "ready" | "denied" | "unavailable";
  revision: number;
};
export const INITIAL_CAMERA_STATE: CameraState = { status: "idle", devices: [], deviceId: "", error: null, audio: "off", revision: 0 };

export function cameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow camera access in your browser’s site settings, then try again. You can also upload photos.";
  if (name === "NotFoundError") return "No camera was found. Connect a camera or upload photos instead.";
  if (name === "NotReadableError") return "This camera is unavailable or may be in use by another app. Close it there and try again.";
  if (name === "OverconstrainedError") return "This camera is no longer available. Select another camera and try again.";
  return "The camera could not start. Try another camera or upload your photos.";
}

export class CameraController {
  private state = INITIAL_CAMERA_STATE;
  private listeners = new Set<() => void>();
  private video: MediaStream | null = null;
  private audio: MediaStream | null = null;
  private videoRequest = 0;
  private audioRequest = 0;
  private detachEnded?: () => void;
  private detachAudioEnded?: () => void;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL_CAMERA_STATE;
  getVideoStream = () => this.video;
  getRecordingStream() {
    if (!this.video) return null;
    return new MediaStream([...this.video.getVideoTracks(), ...(this.audio?.getAudioTracks() ?? [])]);
  }
  private update(patch: Partial<CameraState>) {
    this.state = { ...this.state, ...patch, revision: this.state.revision + 1 };
    this.listeners.forEach(listener => listener());
  }
  private stopVideo() {
    this.detachEnded?.(); this.detachEnded = undefined;
    this.video?.getTracks().forEach(track => track.stop()); this.video = null;
  }
  stopAudio() {
    this.audioRequest++;
    this.detachAudioEnded?.(); this.detachAudioEnded = undefined;
    this.audio?.getTracks().forEach(track => track.stop()); this.audio = null;
    if (this.state.audio === "ready" || this.state.audio === "requesting") this.update({ audio: "off" });
  }
  stop = () => {
    this.videoRequest++; this.stopVideo(); this.stopAudio();
    this.update({ status: "idle", error: null });
  };
  async refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "videoinput")
        .map((device, index) => ({ id: device.deviceId, label: device.label || `Camera ${index + 1}` }));
      this.update({ devices });
      if (this.state.status === "ready" && this.state.deviceId && devices.length && !devices.some(device => device.id === this.state.deviceId)) {
        this.stop(); this.update({ status: "error", error: "The selected camera disconnected. Select an available camera and try again." });
      }
    } catch { /* Enumeration failure must not stop a functioning preview. */ }
  }
  async start(deviceId = "") {
    const request = ++this.videoRequest;
    this.stopVideo();
    if (!window.isSecureContext) { this.stopAudio(); this.update({ status: "error", error: "Camera access needs HTTPS or localhost. You can still upload photos." }); return; }
    if (!navigator.mediaDevices?.getUserMedia) { this.stopAudio(); this.update({ status: "error", error: "This browser does not support camera access. Try a current browser or upload photos." }); return; }
    this.update({ status: "requesting", error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "user" } }),
        width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 },
      } });
      if (request !== this.videoRequest) { stream.getTracks().forEach(track => track.stop()); return; }
      const track = stream.getVideoTracks()[0];
      if (!track) { stream.getTracks().forEach(track => track.stop()); throw new Error("No video track"); }
      this.video = stream;
      const ended = () => { this.stop(); this.update({ status: "error", error: "The camera disconnected. Select an available camera or reconnect and try again." }); };
      track.addEventListener("ended", ended);
      this.detachEnded = () => track.removeEventListener("ended", ended);
      this.update({ status: "ready", deviceId: track.getSettings().deviceId || deviceId });
      await this.refreshDevices();
    } catch (error) {
      if (request === this.videoRequest) { this.stopAudio(); this.update({ status: "error", error: cameraError(error) }); }
    }
  }
  async enableAudio() {
    if (this.state.status !== "ready" || this.state.audio === "requesting" || this.state.audio === "ready") return;
    const request = ++this.audioRequest;
    this.update({ audio: "requesting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { echoCancellation: true, noiseSuppression: true } });
      if (request !== this.audioRequest || this.state.status !== "ready") { stream.getTracks().forEach(track => track.stop()); return; }
      this.audio = stream;
      const track = stream.getAudioTracks()[0];
      if (!track) { this.stopAudio(); this.update({ audio: "unavailable" }); return; }
      const ended = () => { this.stopAudio(); this.update({ audio: "unavailable" }); };
      track.addEventListener("ended", ended);
      this.detachAudioEnded = () => track.removeEventListener("ended", ended);
      this.update({ audio: "ready" });
    } catch (error) {
      if (request === this.audioRequest) this.update({ audio: error instanceof Error && error.name === "NotAllowedError" ? "denied" : "unavailable" });
    }
  }
}
