# Milestone 6 — signature filters, GIF, and Live Moment

Completed September 30, 2026. All media processing remains local. No advertising,
QR, backend, storage service, custom PNG frames, or Event Mode was added.
The existing reward state is unchanged; enhanced features are directly testable.

## 1. Files created

- `components/filters/use-thumbnail-source.ts`: shared small camera sample for thumbnails.
- `components/media/use-gif.ts`: generation, progress, cancellation and session output integration.
- `components/media/results-media-dialog.tsx`: accessible native modal, GIF preview, Live Moment selector/player/download.
- `lib/gif/geometry.ts`: slot-derived dimensions and 650 ms timing.
- `lib/gif/generate.ts`: worker ownership, cancellation, errors and timeout.
- `lib/gif/worker.ts`: original-photo decoding, grading, cropping and GIF encoding.
- `lib/media/live-moment.ts`: applicable recordings and MIME extension mapping.
- `tests/motion.test.mjs`: geometry, selector, format and worker lifecycle checks.
- `tests/browser-motion.mjs`: synthetic-camera media integration checks.
- `docs/milestone-6.md`: this report.

## 2. Files modified

- `lib/filters/presets.ts`, `lib/filters/engine.ts`: final ten presets, selective hue response, split toning and skin protection.
- `components/photobooth/filter-picker.tsx`, `components/screens/capture-screen.tsx`: camera-based thumbnail source.
- `components/screens/results-screen.tsx`, `app/globals.css`: functional media actions and compact responsive dialogs.
- `package.json`, `package-lock.json`: exact `modern-gif@2.1.0` dependency and its palette dependency.
- `tests/filters.test.mjs`: approved names, skin patches, texture and original-pixel checks.
- `tests/session.test.mjs`, `tests/browser-media.mjs`, `tests/browser-editor.mjs`: updated names and ten-thumbnail expectations.
- `README.md`: current behavior, architecture and test instructions.

Next remains 16.3.6; React and React DOM remain 19.2.8. No project scaffolding,
route restructuring, or changes to supplied production images were needed.

## 3. Final preset definitions

The picker uses exactly these names and stable IDs, in this order:

| Name | ID |
| --- | --- |
| Original | `original` |
| Classic | `classic` |
| Chrome | `chrome` |
| Velvet | `velvet` |
| Emerald | `emerald` |
| Golden Hour | `golden-hour` |
| Flash 2000 | `flash-2000` |
| Disposable | `disposable` |
| Night Flash | `night-flash` |
| Mono | `mono` |

Definitions remain data-driven in `lib/filters/presets.ts`. No camera/film brand
names appear in the production picker. Sessions are memory-only, so no persisted
legacy-preset migration is necessary.

## 4. Processing characteristics

| Preset | Photographic treatment |
| --- | --- |
| Original | No grading or added effects. |
| Classic | Near-neutral color, gently shaped contrast, richer reds, restrained greens, soft highlight shoulder and very fine grain. |
| Chrome | Muted reds/greens, relatively stronger blues, cool shadows, deeper contrast and controlled highlights. |
| Velvet | Lifted shadows/black point, softer contrast, subdued saturation, warm-neutral skin and a faded-print curve. |
| Emerald | Selective cyan/green response, cooler balance and soft highlights; warm skin hues receive protection. |
| Golden Hour | Warm highlight toning, enriched reds/yellows, lifted blacks, creamy whites and restrained contrast. |
| Flash 2000 | Snapshot curve, vivid controlled color, bright whites, cool shadow toning, fine noise and subtle highlight bloom. |
| Disposable | Warm imperfect balance, faded blacks, stronger red/yellow response, more visible grain and subtle vignette. |
| Night Flash | Deep cool shadows, warm midtones, punchier contrast, compressed highlights, stronger selective bloom and moderate grain. |
| Mono | Deliberate 25% red / 65% green / 10% blue luminance conversion, shaped tonal curve and equal-channel grain. |

All colored presets use tone curves and selective processing rather than flat
color overlays. Bloom blurs a highlight mask only. Chromatic offsets are tiny
and increase toward edges. Grain is deterministic, luminance-weighted and uses
normalized coordinates; exact grain appearance varies with output resolution.

## 5. Original remains untouched

New sessions default to Original. The live view uses the video directly; still
previews bypass the grading cache; `gradeCanvas` and `processPixels` return
without grading. Only required crop, scaling and intentional mirror/orientation
operations remain. Unit tests verify byte-exact RGBA passthrough. Original
sources remain available independently of every derivative and filter choice.

## 6. Skin-tone protection

A continuous warm-hue/chroma mask attenuates temperature, tint, shadow toning
and selective saturation shifts. It also reduces global saturation changes on
likely skin colors. It is a color heuristic, not face detection. Texture is
never smoothed. Portrait-patch tests cover dark through light warm skin tones,
checking preserved color relationships, unclipped channels and small texture
variations. A ten-look gallery of the supplied sample portrait was visually
reviewed. Real faces under varied lighting still need physical-device review.

## 7. Live-preview architecture

The existing video-frame-scheduled worker remains. It processes one frame at a
time, adapts width from 320–640 pixels to processing cost and drops work rather
than accumulating stale frames. Unsupported worker paths retain the small Canvas
fallback. Original creates no filtered preview Canvas. All nine graded previews
rendered 22–23 frames per 1.1 seconds against Chromium's synthetic camera during
this run, approximately matching that source's 20 fps.

Filter thumbnails share one 200-pixel-wide, ungraded camera sample per camera or
mirror change, then use the same engine at small size. A sample portrait remains
the fallback while the camera is unavailable. Thumbnails are snapshots, not ten
simultaneously running video filters.

## 8. High-resolution rendering

The existing PNG renderer reads each original still and its `filterAtCapture`,
then uses the shared worker engine and crop geometry. It never renders a
screenshot or grades an already-graded thumbnail. Existing bounds remain:
1200-pixel single-column / 2000-pixel two-column target widths, 4096-pixel maximum
edge and roughly 8 MP output; per-photo processing is capped at a 2048-pixel long
edge. Actual dimensions depend on count/template. Browser checks compared all
ten presets against expected processed pixels in the exported PNG.

## 9. Performance and caching

Tone lookup tables are cached by preset. Existing still-preview leases share
results by source URL, filter and size and release them after the last consumer.
PNG and GIF outputs are cached in the session resource store and invalidated by
composition edits. Thumbnails avoid native-resolution work. Expensive GIF work
is separate from the UI, and source images are decoded sequentially.

## 10. GIF encoder and choice

Added exact `modern-gif@2.1.0`, with `modern-palette` as its transitive dependency.
Its typed browser API, palette quantization and Floyd–Steinberg dithering fit
photographic content. The upstream [changelog](https://github.com/qq15725/modern-gif/blob/main/CHANGELOG.md)
records the April 16, 2026 release adding dithering; the
[project documentation](https://github.com/qq15725/modern-gif) describes its
encoding API. The package's unpacked size reported by npm was 167,505 bytes.
The two emitted GIF worker chunks together are about 33.7 KB, or 12.7 KB gzip,
including the shared filter/crop code. No general media/transcoding framework
was added. Installation reported zero audit vulnerabilities at install time.

## 11. GIF generation architecture

Results opens a compact modal with progress, preview, download and Regenerate.
The session's original still Blobs are processed in capture order with individual
filter assignments. Each frame contains a photograph, not the decorated strip.
The existing center-cover crop preserves aspect without stretching. Repeat
clicks cannot start concurrent jobs. Closing the dialog cancels unfinished work;
completed output is reused on reopening. Errors offer a retry.

## 12. GIF worker behavior

A dedicated worker decodes one source at a time, grades a working image capped at
960 pixels on its long edge, draws the output frame and sends progress messages.
The encoder retains the bounded low-resolution frame sequence for its global
palette. At most 12 output frames are accepted. A 90-second deadline handles an
unresponsive worker; completion, cancellation and errors terminate it. Bitmaps
are closed and work Canvases cleared. The finished ArrayBuffer is transferred
back and wrapped in a local `image/gif` Blob.

## 13. GIF dimensions and timing

Dimensions follow the first photo slot of the selected generated template and
fit within 480 × 640. A one-photo Classic slot produces 480 × 640; the Classic
four- and twelve-photo sessions tested produce 480 × 407 because those approved
slots are landscape. No forced portrait distortion is introduced. Frame duration
is exactly 650 ms; looping is infinite. Download filename is
`vintage-photobooth.gif`. GIF remains palette-limited and may show dithering.

## 14. Live Moment Results UX

Generate Live Moment opens one native video player and a simple Photo N selector.
Only camera captures with actual recordings appear; uploads retain their original
photo numbering and are omitted from the selector. Upload-only sessions receive
a clear empty state. The associated still poster uses its selected filter.
The UI explicitly labels motion video as unfiltered. Controls use `playsInline`
and playback starts only through user action. Closing/switching unmounts the old
player; it does not leave a grid of video decoders active.

## 15. Audio behavior

The existing independent opt-in microphone preference and recorder are preserved.
Permitted audio is embedded in the motion Blob; disabled, denied or unavailable
audio leaves silent motion. No separate audio download is created. Synthetic
browser checks verified one decoded audio track with audio enabled, zero with
it disabled/denied, successful playback, and zero microphone calls when disabled.
Opening or switching a clip does not autoplay audio.

## 16. Download formats

Download uses the original recorded Blob URL, without transcoding. The actual
Blob MIME takes precedence and codec parameters are stripped only when choosing
the filename extension. Mappings cover WebM, MP4, Ogg, QuickTime and Matroska;
unknown MIME uses `.bin` instead of pretending it is WebM. Chromium produced
WebM in the integration tests; downloaded bytes matched the recorded Blob for
all three audio scenarios. MP4 and other extension mappings have unit coverage.

## 17. Browser-specific recording limits

The existing recorder uses `MediaRecorder.isTypeSupported()` and retains the
format actually returned by the browser. Codec support, audio multiplexing,
permission behavior and playback/download UI vary across browsers. Unsupported
or failed recording leaves photography usable. Player failure provides a message
and still allows downloading the original recording. Safari/iOS, Firefox and
physical-camera/microphone behavior were not exercised in this environment.

## 18. Memory and Object URL cleanup

GIFs join the existing resource ownership model. Regeneration revokes the old
output after replacement; composition changes invalidate cached outputs;
Take Another clears originals, motion and generated outputs. Cancellation and
route unmount terminate encoding. Thumbnail camera URLs and derived preview
leases release on unmount/change. Original motion URLs are shared, not duplicated
per selection. Browser tests verified reset leaves zero tracked Blob URLs and
all camera/microphone tracks ended. No media is persisted across refreshes.

## 19. Regression results

- **71/71 unit tests passed**, including original pixels, preset differences, skin patches, per-capture state, all-count geometry, MIME handling and worker termination.
- **Camera suite:** all 1/2/4/5/6/8/10/12 counts; 200 layout checks; 36 full-screen flashes at approximately 397–405 ms; source-frame reads while white overlay is active after the illumination delay. Manual 1s, continuous 3/5/10s, Pause/Resume, Smile!, Flash off and reduced-motion Flash on passed.
- **Editor suite:** all eight counts; 120 layout checks; sticker/text mouse and touch transforms, layering, undo/redo, deletion, frame/color changes, edit persistence and high-resolution PNG output passed.
- **Media suite:** all ten presets verified in PNG/GIF output; responsive graded previews; 4/12-frame GIF order, loop, 650 ms timing, downloads, cache, regeneration and cancellation; audio-on/off/denied motion, two-camera-plus-two-upload selection, native playback and matching downloads passed. 49 layout checks and zero browser errors.
- Test-fixture GIFs completed in approximately 0.32 s (4 photos) and 0.67 s (12), with UI timer callbacks continuing. These are synthetic, small source-image timings, not real-device performance promises.
- Print waited for See Your Photos and never invoked system printing. Download Photo remained free. All nine generated templates and the two-column rules remained intact.
- Browser request assertions saw only local GET/blob/data requests and no media upload. No `/frames/` asset was requested. All 44 supplied asset SHA-256 hashes matched the pre-change baseline.

Reproduce using README commands and the three `tests/browser-*.mjs` scripts with
an installed Chromium executable and production server on port 3003. Ignored
`.review/` artifacts contain detailed reports, screenshots, generated media and
the portrait comparison; these artifacts are intentionally not committed.

## 20. Known limitations

Motion remains the original unfiltered, untranscoded camera recording, including
its original field of view/orientation; its filtered still poster can differ in
crop/mirroring. GIF requires Worker/OffscreenCanvas support and reports a useful
error if unavailable. GIF grain/palette detail differs from full-resolution PNG.
The skin heuristic cannot guarantee every complexion/lighting condition, and a
physical low-light screen-flash portrait test remains for user review. A display
cannot override device brightness limits. Browser checks used synthetic devices,
not a real microphone/speaker listening test or mobile hardware.

The existing layout assumes at least 320 CSS pixels of content width; classic
desktop scrollbars can consume part of a 320-pixel emulated window. Native mobile
layout was reviewed at mobile-oriented widths, not on a physical phone.
QR, ads, custom frames and all Milestone 7 work remain intentionally pending.

## 21. ESLint

`npm run lint`: passed, no errors or warnings.

## 22. TypeScript

`npx tsc --noEmit`: passed.

## 23. Production build

`npm run build -- --webpack`: passed, all application routes prerendered. The
existing webpack option was used for this environment. No application code was
changed after the validated production build; subsequent changes added tests
and documentation only.

Milestone 6 stops here, pending review and approval for Milestone 7.
