import './register-typescript.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
const { CameraController, cameraError } = await import('../lib/media/camera-controller.ts');
const { MediaResourceStore } = await import('../lib/media/resource-store.ts');
const { runCountdown } = await import('../lib/media/countdown.ts');
const { beginMotion, selectRecordingType } = await import('../lib/media/motion-recorder.ts');

class Track extends EventTarget {
  constructor(kind, id) { super(); this.kind = kind; this.id = id; this.readyState = 'live'; this.stops = 0; }
  stop() { this.readyState = 'ended'; this.stops++; }
  getSettings() { return { deviceId: this.id }; }
}
class Stream {
  constructor(tracks) { this.tracks = tracks; }
  getTracks() { return this.tracks; }
  getVideoTracks() { return this.tracks.filter(track => track.kind === 'video'); }
  getAudioTracks() { return this.tracks.filter(track => track.kind === 'audio'); }
}
function environment(t, getUserMedia, enumerateDevices = async () => [{ kind: 'videoinput', deviceId: 'front', label: '' }, { kind: 'videoinput', deviceId: 'back', label: 'Rear camera' }]) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia, enumerateDevices } } });
  globalThis.window = { isSecureContext: true }; globalThis.MediaStream = Stream;
  t.after(() => { Object.defineProperty(globalThis, 'navigator', previous); delete globalThis.window; delete globalThis.MediaStream; });
}

test('camera selection stops the old track, enumerates labels and keeps optional audio separate', async t => {
  const calls = [], tracks = [];
  environment(t, async constraints => {
    calls.push(constraints);
    const track = new Track(constraints.video ? 'video' : 'audio', constraints.video?.deviceId?.exact ?? 'front');
    tracks.push(track); return new Stream([track]);
  });
  const camera = new CameraController();
  await camera.start();
  assert.equal(camera.getSnapshot().status, 'ready');
  assert.equal(camera.getSnapshot().devices[0].label, 'Camera 1');
  assert.equal(calls[0].audio, false);
  await camera.enableAudio();
  assert.equal(calls[1].video, false);
  assert.equal(camera.getRecordingStream().getAudioTracks().length, 1);
  await camera.start('back');
  assert.equal(tracks[0].stops, 1);
  assert.equal(camera.getSnapshot().deviceId, 'back');
  assert.equal(tracks[1].readyState, 'live');
  camera.stop();
  assert.ok(tracks.every(track => track.readyState === 'ended'));
});

test('microphone denial does not stop camera, and stays denied after camera cleanup', async t => {
  const video = new Track('video', 'front');
  environment(t, async constraints => { if (constraints.audio) throw new DOMException('Denied', 'NotAllowedError'); return new Stream([video]); });
  const camera = new CameraController(); await camera.start(); await camera.enableAudio();
  assert.equal(camera.getSnapshot().audio, 'denied');
  assert.equal(camera.getSnapshot().status, 'ready');
  assert.equal(camera.getRecordingStream().getAudioTracks().length, 0);
  camera.stop(); assert.equal(camera.getSnapshot().audio, 'denied');
});

for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError', 'OverconstrainedError', 'UnknownError']) {
  test(`camera ${name} provides recovery without throwing`, async t => {
    environment(t, async () => { throw new DOMException('failure', name); });
    const camera = new CameraController(); await camera.start();
    assert.equal(camera.getSnapshot().status, 'error');
    assert.equal(camera.getSnapshot().error, cameraError(new DOMException('failure', name)));
    assert.ok(camera.getSnapshot().error.length > 30);
  });
}

test('late camera and microphone grants after stop are released, not attached', async t => {
  let resolveRequest;
  environment(t, () => new Promise(resolve => { resolveRequest = resolve; }));
  const camera = new CameraController();
  const pending = camera.start(); const video = new Track('video', 'front'); camera.stop();
  resolveRequest(new Stream([video])); await pending;
  assert.equal(video.stops, 1); assert.equal(camera.getVideoStream(), null);
  const start = camera.start(); resolveRequest(new Stream([new Track('video', 'front')])); await start;
  const audioRequest = camera.enableAudio(), audio = new Track('audio', 'mic'); camera.stop();
  resolveRequest(new Stream([audio])); await audioRequest;
  assert.equal(audio.stops, 1); assert.equal(camera.getSnapshot().audio, 'off');
});

test('out-of-order camera selection cannot replace the newest stream', async t => {
  const resolves = [];
  environment(t, () => new Promise(resolve => resolves.push(resolve)));
  const camera = new CameraController();
  const first = camera.start('front'), second = camera.start('back');
  const front = new Track('video', 'front'), back = new Track('video', 'back');
  resolves[1](new Stream([back])); await second;
  resolves[0](new Stream([front])); await first;
  assert.equal(camera.getSnapshot().deviceId, 'back'); assert.equal(front.stops, 1); assert.equal(back.stops, 0);
  back.dispatchEvent(new Event('ended')); assert.equal(camera.getSnapshot().status, 'error');
  assert.equal(back.stops, 1);
});

test('insecure context and missing media API provide useful errors', async t => {
  environment(t, undefined); const camera = new CameraController();
  window.isSecureContext = false; await camera.start(); assert.match(camera.getSnapshot().error, /HTTPS/);
  window.isSecureContext = true; await camera.start(); assert.match(camera.getSnapshot().error, /does not support/);
});

test('resource store shares one Blob URL and revokes exactly once on release/reset', t => {
  const created = [], revoked = [];
  t.mock.method(URL, 'createObjectURL', blob => { created.push(blob); return `blob:local/${created.length}`; });
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url));
  const store = new MediaResourceStore(), blob = new Blob(['pixels'], { type: 'image/jpeg' });
  const first = store.add(blob, 1920, 1080), second = store.add(blob, 100, 100);
  assert.equal(store.getBlob(first.resourceId), blob); assert.equal(store.resolve(first), 'blob:local/1');
  store.release(first.resourceId); store.release(first.resourceId); assert.equal(store.resolve(first), undefined);
  assert.equal(store.resolve(second), 'blob:local/2'); store.clear(); store.clear();
  assert.deepEqual(revoked, ['blob:local/1', 'blob:local/2']);
});

test('countdown abort cancels before shutter and produces no later ticks', async () => {
  const controller = new AbortController(), ticks = [];
  const countdown = runCountdown(3, controller.signal, tick => ticks.push(tick));
  controller.abort(); await assert.rejects(countdown, { name: 'AbortError' });
  assert.deepEqual(ticks, [3]);
});

test('unsupported recording and constructor failure fall back to still-only', t => {
  const previous = globalThis.MediaRecorder;
  t.after(() => { if (previous) globalThis.MediaRecorder = previous; else delete globalThis.MediaRecorder; });
  delete globalThis.MediaRecorder; assert.equal(beginMotion(new Stream([])), null);
  globalThis.MediaRecorder = class { static isTypeSupported(type) { return type === 'video/mp4'; } constructor() { throw new Error('Unavailable'); } };
  assert.equal(selectRecordingType(), 'video/mp4'); assert.equal(beginMotion(new Stream([])), null);
});

test('missing microphone hardware leaves a usable silent camera', async t => {
  environment(t, async constraints => { if (constraints.audio) throw new DOMException('Missing', 'NotFoundError'); return new Stream([new Track('video', 'front')]); });
  const camera = new CameraController(); await camera.start(); await camera.enableAudio();
  assert.equal(camera.getSnapshot().audio, 'unavailable'); assert.equal(camera.getSnapshot().status, 'ready');
  camera.stop();
});

test('recording failure and cancellation resolve without stopping preview tracks', async t => {
  const previous = globalThis.MediaRecorder;
  t.after(() => { if (previous) globalThis.MediaRecorder = previous; else delete globalThis.MediaRecorder; });
  const instances = [];
  globalThis.MediaRecorder = class {
    static isTypeSupported(type) { return type === 'video/webm'; }
    constructor() { instances.push(this); this.state = 'inactive'; this.mimeType = 'video/webm'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; queueMicrotask(() => { this.ondataavailable?.({ data: new Blob(['video'], { type: this.mimeType }) }); this.onstop?.(); }); }
  };
  const track = new Track('video', 'front'), stream = new Stream([track]);
  const failed = beginMotion(stream); instances[0].onerror(); assert.equal(await failed.finish(), null);
  const cancelled = beginMotion(stream); cancelled.cancel(); assert.equal(await cancelled.finish(), null);
  const successful = beginMotion(stream), clip = await successful.finish();
  assert.equal(clip.blob.type, 'video/webm'); assert.equal(clip.hasAudio, false);
  assert.equal(track.readyState, 'live');
});
