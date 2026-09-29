import "./register-typescript.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { FRAME_STYLES, getFrameTemplate, resolveFrameLayout, supportsPhotoCount } from "../lib/frame-templates.ts";

test("classic four-photo geometry retains the Figma proportions", () => {
  const layout = resolveFrameLayout(getFrameTemplate("classic"), 4);
  assert.equal(layout.width, 224);
  assert.equal(layout.height, 746);
  assert.deepEqual(layout.slots[0], { x: 14, y: 14, width: 196, height: 166, radius: 8 });
  assert.equal(layout.slots[3].y, 566);
});

for (const template of FRAME_STYLES) {
  test(`${template.name}: all counts fit, remain vertical and have no missing slots`, () => {
    for (const count of [1, 2, 4, 5, 6, 8, 10, 12]) {
      const layout = resolveFrameLayout(template, count);
      assert.equal(layout.slots.length, count);
      assert.ok(layout.height > layout.width);
      for (const [index, slot] of layout.slots.entries()) {
        assert.ok(slot.width > 0 && slot.height > 0);
        assert.ok(slot.x >= 0 && slot.y >= 0);
        assert.ok(slot.x + slot.width <= layout.width + 1e-8);
        assert.ok(slot.y + slot.height <= layout.height + 1e-8);
        const columns = count >= 6 ? 2 : 1;
        if (index >= columns) assert.ok(slot.y >= layout.slots[index - columns].y + layout.slots[index - columns].height);
        if (columns === 2 && index % 2) assert.ok(slot.x >= layout.slots[index - 1].x + layout.slots[index - 1].width);
      }
      if (count === 1) assert.ok(layout.slots[0].height > layout.slots[0].width);
      if (count === 6) {
        const four = resolveFrameLayout(template, 4);
        assert.ok(layout.height < four.height * 1.25, "six photos stay compact");
        assert.equal(layout.slots[0].height, four.slots[0].height);
        assert.ok(layout.width > four.width * 1.8);
      }
      const captioned = resolveFrameLayout(template, count, true);
      const last = captioned.slots.at(-1);
      assert.ok(captioned.captionY > last.y + last.height);
      assert.ok(captioned.captionY < captioned.height);
    }
  });
}

test("all nine geometries are distinct at every count", () => {
  for (const count of [1, 2, 4, 5, 6, 8, 10, 12]) {
    assert.equal(new Set(FRAME_STYLES.map(template => JSON.stringify(resolveFrameLayout(template, count)))).size, 9);
  }
});

test("future asset templates support only their explicit count variants", () => {
  const layout = resolveFrameLayout(FRAME_STYLES[0], 4);
  const template = { kind: "asset", id: "test-only", name: "Fixture", variants: { 4: { asset: "/fixture.png", layer: "overlay", layout } } };
  assert.equal(supportsPhotoCount(template, 4), true);
  assert.equal(supportsPhotoCount(template, 6), false);
  assert.equal(resolveFrameLayout(template, 4), layout);
  assert.throws(() => resolveFrameLayout(template, 2), RangeError);
  assert.throws(() => getFrameTemplate("missing"), RangeError);
});
