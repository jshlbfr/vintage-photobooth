import "./register-typescript.mjs";
import assert from "node:assert/strict";
import test from "node:test";

const { createSession } = await import("../lib/session/defaults.ts");
const { sessionReducer: reduce } = await import("../lib/session/reducer.ts");
const { hasCompleteCaptures, selectStripComposition } = await import("../lib/session/selectors.ts");
const { FRAME_STYLES } = await import("../lib/frame-templates.ts");
const { FRAME_COLORS, FILTER_PREVIEWS } = await import("../lib/design-data.ts");
const fresh = () => createSession("session-a", 1000);

for (const count of [1, 2, 4, 6]) {
  test(`${count} photos: setup is the sole count source through the entire composition`, () => {
    let session = reduce(fresh(), { type: "camera/count", count });
    assert.equal(session.captures.length, 0);
    assert.equal(hasCompleteCaptures(session), false);
    session = reduce(session, { type: "captures/prepare-samples", timestamp: 2000 });
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
    assert.equal(reduce(session, { type: "captures/prepare-samples", timestamp: 3000 }), session, "back/continue preserves captures");
  });
}

test("preferences, filter, geometry and all colors survive unrelated changes", () => {
  let session = fresh();
  for (const action of [
    { type: "camera/count", count: 6 }, { type: "camera/device", deviceId: "sample-rear" },
    { type: "camera/mirror", mirrored: false }, { type: "camera/timer", seconds: 10 },
    { type: "camera/flash", enabled: false }, { type: "captures/prepare-samples", timestamp: 2000 },
    { type: "customization/frame", frameId: "wide" },
  ]) session = reduce(session, action);
  const captures = session.captures;
  for (const filter of FILTER_PREVIEWS) {
    session = reduce(session, { type: "customization/filter", filterId: filter.id });
    for (const color of FRAME_COLORS) {
      session = reduce(session, { type: "customization/color", color: color.value });
      const composition = selectStripComposition(session);
      assert.equal(composition.filter, filter.css);
      assert.equal(composition.frameColor, color.value);
      assert.equal(composition.frameStyle, "wide");
      assert.equal(session.captures, captures);
    }
  }
  assert.deepEqual(session.preferences, { photoCount: 6, deviceId: "sample-rear", mirrored: false, timerSeconds: 10, flash: false });
});

test("changing count invalidates old captures/outputs and re-prepares exactly the new count", () => {
  let session = reduce(fresh(), { type: "captures/prepare-samples", timestamp: 1000 });
  session = reduce(session, { type: "outputs/record", kind: "photo", output: { resourceId: "test", mimeType: "image/png", createdAt: 2000 } });
  session = reduce(session, { type: "camera/count", count: 1 });
  assert.equal(hasCompleteCaptures(session), false);
  assert.deepEqual(session.outputs, {});
  session = reduce(session, { type: "captures/prepare-samples", timestamp: 3000 });
  assert.equal(session.captures.length, 1);
});

test("a fresh session clears customization, media references, rewards and outputs", () => {
  let session = reduce(fresh(), { type: "captures/prepare-samples", timestamp: 2000 });
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
    { type: "customization/filter", filterId: "sunday" },
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
