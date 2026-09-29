# Milestone 5 — customization editor and high-resolution PNG

1. **Flash timing.** The body-level, fixed, full-opacity `#FFFFFF` overlay remains
   above all UI. Two animation frames allow a paint; the shutter waits until
   roughly 120 ms after flash onset, reads the actual video, and the overlay
   remains until roughly 400 ms. Encoding can extend the hold on a slow device.
   Flash OFF adds no illumination wait. Pause finishes an active shutter cycle
   and its motion clip, then stops before the next countdown. Abort/navigation
   clears the overlay. No DOM capture or system brightness control is involved.

2. **Files created.** `components/editor/decoration-art.tsx`, `editor-controls.tsx`,
   `strip-editor.tsx`; `components/media/use-photo-download.ts`;
   `lib/editor/geometry.ts`, `text.ts`; `lib/render/strip-renderer.ts`;
   `tests/editor.test.mjs`, `tests/browser-editor.mjs`; this report.

3. **Files modified.** `app/globals.css`; `components/media/use-capture.ts`;
   `components/photobooth/photo-strip.tsx`, `result-action.tsx`;
   `components/screens/customize-screen.tsx`, `results-screen.tsx`;
   `lib/composition.ts`; `lib/session/actions.ts`, `reducer.ts`, `selectors.ts`,
   `types.ts`; `tests/browser-media.mjs`; `README.md`.
   No dependency or production asset changes.

4. **Editor architecture.** Customize edits the session's existing customization
   data through the reducer. The right-hand SVG is editable; a compact inspector
   replaces the left frame selector while an object is selected. The picker
   remains available for adding more stickers. Selection is local UI state.
   A bounded 40-step undo/redo history covers additions, transforms, text/style,
   deletion, layers, frames and colors. Pointer gestures commit one history entry;
   text and slider changes are incremental. History resets when leaving Customize;
   the editable composition persists.

5. **Sticker model.** Each instance has its own UUID, asset ID, center x/y, size,
   rotation and layer. All 16 supplied transparent PNGs are selectable. Additions
   receive deterministic staggered positions and never remove picker artwork.
   Multiple copies of one asset remain independent.

6. **Text model.** Each text instance has the same transform/layer fields plus
   content, color, font and alignment. Text starts as “Your text”; three lines and
   120 characters keep the tool restrained. The existing Poppins, Playfair Display
   and Allura fonts and five colors are available. No new fonts were downloaded.

7. **Coordinates.** Centers use strip-relative x/y in [0,1]. Sticker size means
   width divided by strip width; text size means font size divided by strip width.
   Rotation is degrees. Shared frame geometry supplies logical dimensions in
   every view and in Canvas. A frame change preserves normalized transforms;
   a color change does not alter geometry.

8. **Move, resize, rotate, delete.** Pointer coordinates are transformed through
   the SVG's inverse screen matrix, accounting for scaling and letterboxing.
   Pointer capture retains drags outside handles; cancel restores the prior state.
   Resize uses distance from the center and preserves the asset's native ratio.
   Rotation uses the continuous angular delta. Size limits, sliders, directional
   buttons, arrow keys, Delete/Backspace and an explicit Delete action are provided.
   Typing fields retain their normal keyboard behavior. Centers stay on the strip
   so partially clipped decorations remain recoverable.

9. **Layers.** Stickers and text share one stable layer ordering. New decorations
   appear on top; Bring forward/Send backward swap adjacent elements across both
   types. Ordering is identical in SVG and Canvas.

10. **Shared composition.** The selector resolves actual session captures and their
    per-photo filters plus frame/color and decorations. Capture, Customize, Print,
    Results and export consume the shared composition and generated frame layout.
    The SVG's decoration art and Canvas use the same size, center, rotation, text
    metrics and ordering. Editor handles exist only in Customize.

11. **Canvas renderer.** A clean Canvas draws the rounded physical frame, clipped
    photo slots, decorations and text. Photos use aspect-preserving cover/contain
    geometry and high-quality smoothing. Transparent strip corners remain
    transparent. Page background, preview shadow, handles and controls are excluded.
    Original camera crop/orientation/mirroring are already encoded in source stills
    and are not applied a second time.

12. **Resolution.** Target width is 1200 px for one-column and 2000 px for two-column
    strips, bounded by a 4096 px longest side and about eight megapixels. Height
    follows shared geometry. The renderer reads original still sources, never the
    800 px preview derivatives. A temporary photo surface is sized for the required
    output, capped at 2048 px on its longest side, and released after each photo.

13. **Filters.** Every photo retains its own Milestone 4 filter ID. The same pixel
    engine grades source-derived working images in a local worker; Original bypasses
    grading. Browsers without worker Canvas support use the bounded Canvas fallback.
    Grain and bloom can have small resolution-dependent differences from previews.

14. **Download Photo.** The free Results button renders on demand, shows progress,
    records an `image/png` Blob in the local resource store, and triggers a real
    browser download named `vintage-photobooth-<session>.png`. Repeated downloads
    reuse the cached output. Errors remain visible and allow retry. Composition
    changes invalidate generated outputs, releasing obsolete URLs.

15. **Edit Again.** Navigation restores the same editable session objects, media,
    filter assignments, frame/color, transforms and layers. No flattened PNG replaces
    the composition. Print retains its strip-feed animation and waits for the user
    to click See Your Photos; it never calls `window.print()` or redirects itself.

16. **Take Another.** Starts a fresh session with empty captures, motion, decorations,
    outputs and rewards and default customization. Media-store ownership releases
    original/output URLs; preview leases release derived URLs. Leaving Results
    aborts an in-progress render.

17. **Performance.** Dragging updates only lightweight SVG draft transforms; the
    session commits at pointer release. No high-resolution rendering occurs during
    editing. Export processes photos sequentially, yields between them, and uses
    worker grading where supported. Output and source resources have explicit
    ownership and cancellation. No packages were added.

18. **Responsive/accessibility behavior.** Desktop retains three columns with the
    inspector in the left column. Mobile stacks a larger editable strip, inspector/
    frame selector, pickers and actions. The editable strip and manipulation targets use
    `touch-action: none`; page scrolling remains available outside the strip. Handles retain
    a 28 px pointer target independent of preview scale; sliders and directional
    controls provide alternatives. Text selection does not force mobile scrolling.
    Controls have accessible labels and focusable decoration hit regions.

19. **Validation.** All 58 native unit tests passed. They cover shared geometry for all eight counts and
    nine frame styles, interleaved layers, normalized transforms, safe bounds,
    aspect ratios, output invalidation and export budgets. The Chromium editor suite
    exercises duplicate stickers, mouse/touch moves, resize/rotation, text styling,
    undo/redo, frame/color changes, Edit Again, actual local PNG downloads/cache,
    Take Another cleanup and Print waiting. PNGs were opened for visual review and
    inspected for resolution and transparent corners. All eight browser-downloaded PNGs
    matched the renderer output byte-for-byte. The editor run passed 120 layout checks
    with zero console/runtime errors; its four-flash sequence measured 399.6–400.9 ms.
    A mixed-filter PNG retained a monochrome first photo and colored Original second
    photo. All 44 supplied asset hashes matched their baseline. The network audit allows
    only local GETs/data/Blob resources and rejects `/frames/` requests.
    The final camera regression suite also passed all eight counts and 200 layout
    checks with zero browser errors: 36 enabled shutters produced exactly 36 flashes,
    measured at 399.2–405.0 ms, with camera reads
    119.7–125.8 ms after white-overlay onset. This includes 1-photo
    manual and 4/8/12-photo continuous captures, plus Flash OFF and reduced motion.

20. **Limits.** Browser automation uses Chromium synthetic camera/microphone devices;
    physical display illumination, OS camera dialogs and Safari/iOS/Firefox still
    need hands-on verification. Screen brightness/exposure response cannot be
    guaranteed. Export detail is limited by source photos and supplied sticker
    resolution. Text uses explicit line breaks, with no rich-text or automatic
    wrapping; very long lines intentionally clip to the physical strip. Undo history
    is in-memory within Customize. GIF, final Live Moment UI, ads, QR/cloud sharing,
    custom PNG frames and Event Mode remain unimplemented.

21. **ESLint:** `npm run lint` passed.
22. **TypeScript:** `npx tsc --noEmit` passed.
23. **Production build:** `npm run build -- --webpack` passed.

Browser API references: [Pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture),
[SVG screen transforms](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM),
[font readiness](https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts).
