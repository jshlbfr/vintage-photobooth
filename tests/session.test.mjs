import "./register-typescript.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { createSession } = await import("../lib/session/defaults.ts");
const { sessionReducer: reduce } = await import("../lib/session/reducer.ts");
const { hasCompleteCaptures, selectStripComposition } = await import("../lib/session/selectors.ts");
const { FRAME_STYLES } = await import("../lib/frame-templates.ts");
const { FRAME_COLORS, FILTER_PREVIEWS } = await import("../lib/design-data.ts");
const fresh = () => createSession("session-a", 1000);
const capture = id => ({ id, source: "camera", still: { kind: "local", resourceId: id, mimeType: "image/jpeg", width: 1920, height: 1080 }, capturedAt: 2000, filterAtCapture: "chrome" });
const fill = session => {
  session = reduce(session, { type: "captures/begin" });
  for (let i = session.captures.length; i < session.preferences.photoCount; i++) session = reduce(session, { type: "captures/add", sessionId: session.id, capture: capture(`photo-${i}`) });
  return session;
};

for (const count of [1, 2, 4, 5, 6, 8, 10, 12]) {
  test(`${count} photos: setup is the sole count source through the entire composition`, () => {
    let session = reduce(fresh(), { type: "camera/count", count });
    assert.equal(session.captures.length, 0);
    assert.equal(hasCompleteCaptures(session), false);
    session = fill(session);
    assert.equal(hasCompleteCaptures(session), true);
    assert.equal(session.captures.length, count);
    assert.equal(new Set(session.captures.map(capture => capture.id)).size, count);
    for (const template of FRAME_STYLES) {
      session = reduce(session, { type: "customization/frame", frameId: template.id });
      const composition = selectStripComposition(session);
      assert.equal(composition.count, count);
      assert.equal(composition.photos.length, count);
      assert.equal(composition.frameStyle, template.id);
    }
    assert.deepEqual(fill(session).captures, session.captures, "back/continue preserves captures");
  });
}

test("preferences, filter, geometry and all colors survive unrelated changes", () => {
  let session = fresh();
  for (const action of [
    { type: "camera/count", count: 6 }, { type: "camera/device", deviceId: "sample-rear" },
    { type: "camera/mirror", mirrored: false }, { type: "camera/timer", seconds: 10 },
    { type: "camera/flash", enabled: false }, { type: "captures/begin" },
    { type: "customization/frame", frameId: "wide" },
  ]) session = reduce(session, action);
  const captures = session.captures;
  for (const filter of FILTER_PREVIEWS) {
    session = reduce(session, { type: "customization/filter", filterId: filter.id });
    for (const color of FRAME_COLORS) {
      session = reduce(session, { type: "customization/color", color: color.value });
      const composition = selectStripComposition(session);
      assert.equal(session.customization.filterId, filter.id);
      assert.equal(composition.frameColor, color.value);
      assert.equal(composition.frameStyle, "wide");
      assert.equal(session.captures, captures);
    }
  }
  assert.deepEqual(session.preferences, { photoCount: 6, deviceId: "sample-rear", mirrored: false, timerSeconds: 10, flash: false, audioEnabled: false });
});

test("changing count invalidates old captures/outputs and re-prepares exactly the new count", () => {
  let session = fill(fresh());
  session = reduce(session, { type: "outputs/record", kind: "photo", output: { resourceId: "test", mimeType: "image/png", createdAt: 2000 } });
  session = reduce(session, { type: "camera/count", count: 1 });
  assert.equal(hasCompleteCaptures(session), false);
  assert.deepEqual(session.outputs, {});
  session = fill(session);
  assert.equal(session.captures.length, 1);
});

test("a fresh session clears customization, media references, rewards and outputs", () => {
  let session = fill(fresh());
  session = reduce(session, { type: "customization/stickers", stickers: [{ id: "s", assetId: "heart", x: .2, y: .3, size: .2, rotation: 4, layer: 1 }] });
  session = reduce(session, { type: "customization/texts", texts: [{ id: "t", content: "Memory", x: .5, y: .9, size: .06, rotation: 0, layer: 2, color: "#fff", font: "display", alignment: "middle" }] });
  session = reduce(session, { type: "rewards/unlock" });
  session = reduce(session, { type: "outputs/record", kind: "gif", output: { resourceId: "test", mimeType: "image/gif", createdAt: 2000 } });
  assert.equal(selectStripComposition(session).decorations.length, 1);
  assert.equal(selectStripComposition(session).texts.length, 1);
  const next = createSession("session-b", 3000);
  assert.deepEqual(reduce(session, { type: "session/start", session: next }), next);
  assert.equal(next.captures.length, 0);
  assert.equal(next.customization.stickers.length, 0);
  assert.equal(next.customization.texts.length, 0);
  assert.equal(next.rewards.enhancedFeaturesUnlocked, false);
  assert.deepEqual(next.outputs, {});
});

test("every composition edit invalidates previously generated outputs", () => {
  const output = { resourceId: "test", mimeType: "image/png", createdAt: 2000 };
  for (const action of [
    { type: "customization/filter", filterId: "emerald" },
    { type: "customization/frame", frameId: "tight" },
    { type: "customization/color", color: "#702C2B" },
    { type: "customization/stickers", stickers: [] },
    { type: "customization/texts", texts: [] },
  ]) {
    const session = reduce(fresh(), { type: "outputs/record", kind: "photo", output });
    assert.deepEqual(reduce(session, action).outputs, {});
    assert.equal(session.outputs.photo, output, "reducer does not mutate prior state");
  }
});

test("ensure is idempotent and invalid selections cannot corrupt a session", () => {
  const session = fresh();
  assert.equal(reduce(session, { type: "session/ensure", session: createSession("ignored", 2000) }), session);
  assert.equal(reduce(null, { type: "session/ensure", session }), session);
  assert.equal(reduce(null, { type: "camera/count", count: 6 }), null);
  for (const action of [
    { type: "camera/count", count: 3 }, { type: "camera/timer", seconds: 8 },
    { type: "customization/frame", frameId: "missing" },
    { type: "customization/color", color: "not-a-color" },
    { type: "customization/filter", filterId: "missing" },
  ]) assert.equal(reduce(session, action), session);
});


test("capture guards reject stale sessions, duplicate IDs, unconfirmed plans and overflow", () => {
  const add = { type: "captures/add", sessionId: "session-a", capture: capture("one") };
  const initial = fresh();
  assert.equal(reduce(initial, add), initial);
  let session = reduce(initial, { type: "captures/begin" });
  assert.equal(session.captures.length, 0, "continue never fabricates images");
  assert.equal(reduce(session, { ...add, sessionId: "old-session" }), session);
  session = reduce(session, add);
  assert.equal(reduce(session, add), session);
  session = fill(session);
  assert.equal(reduce(session, { ...add, capture: capture("overflow") }), session);
  const restarted = reduce(session, { type: "captures/restart" });
  assert.deepEqual(restarted.preferences, session.preferences);
  assert.deepEqual(restarted.captures, []);
  assert.equal(restarted.capturePlanReady, true);
});

test("composition resolves shared local references without duplicating images", () => {
  const session = fill(fresh());
  const composition = selectStripComposition(session, ref => `blob:local/${ref.resourceId}`);
  assert.equal(composition.photos[0].src, "blob:local/photo-0");
  assert.equal(selectStripComposition(session).photos[0].src, undefined);
});


test("Original starts every session and per-photo filters survive later selection changes", () => {
  let session = reduce(fresh(), { type: "captures/begin" });
  assert.equal(session.customization.filterId, "original");
  for (const [index, filter] of ["original", "golden-hour", "mono"].entries()) {
    session = reduce(session, { type: "customization/filter", filterId: filter });
    session = reduce(session, { type: "captures/add", sessionId: session.id, capture: {...capture(`filter-${index}`),filterAtCapture:filter} });
  }
  session = reduce(session, { type: "customization/filter", filterId: "original" });
  assert.deepEqual(selectStripComposition(session).photos.map(photo => photo.filterId), ["original", "golden-hour", "mono"]);
});
