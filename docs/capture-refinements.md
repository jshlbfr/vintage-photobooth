# Capture and layout refinements

Customize now uses three equal desktop columns, more evenly distributed color
and sticker controls, and frame previews constrained to their available height.
The Capture strip centers against the full panel, leaving clearance above Choose
Frame. Instruction numbers use trimmed font metrics inside centered badges.

Filtered live previews follow incoming video frames and process pixels in a local
Worker using OffscreenCanvas. Only one frame is in flight; frames never accumulate
in a queue. Preview width adapts between 320 and 640 pixels to processing time.
Browsers without worker canvas support retain a smaller main-thread fallback.
Workers, frame callbacks and transferred bitmaps are cleaned up when changing
filters or leaving the camera. Original still bypasses all grading, and saved
photos continue to read the full-resolution video source.

With Flash enabled, the full-opacity white viewport paints first, then waits
60 ms before reading the camera frame. It remains visible for at least another
80 ms while the still encodes. Cancellation clears the overlay and pending waits.
Flash OFF skips both the overlay and illumination delay. Device exposure latency
and display brightness still determine the physical lighting effect.

Focused Chromium checks using synthetic media measured all eight photographic
filters at 20 fps (the previous preview was capped near 8 fps). The fallback path
also rendered successfully. Manual and four-photo captures produced exactly one
flash per shutter: 161–176 ms total, with 67–83 ms before the video read. Flash
OFF produced no overlay. These are local test measurements, not hardware-wide
performance guarantees.

Desktop layouts were reviewed at 1440 × 1024 and 1366 × 768, and mobile layouts at
390 and 320 pixels wide. The repeatable `tests/browser-media.mjs` suite now checks
full-panel strip centering, frame-selector containment, and flash illumination
and hold timing, in addition to its existing capture/session checks.

Validation: all 47 unit tests, lint, TypeScript and the production Webpack build
passed. The full Chromium suite passed all eight photo counts and 200 layout
checks with zero browser errors. Its 36 enabled captures produced 36 flashes,
including the 1-photo manual and 4/8/12-photo continuous flows; measured duration
was 154–192 ms under browser scheduling. All 44 supplied asset hashes are unchanged.
