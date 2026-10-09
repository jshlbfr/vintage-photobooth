# Milestone 9.5 — implementation and release report

Implementation branch: `milestone-9-5`. Production baseline: `2fd720c` on `main`.
The current repository was audited first, and the user approved implementation.
The subsequent Customize layout correction takes precedence over the original
request to center the desktop heading across the whole panel.

## 1–6. Photo adjustments, storage and matching outputs

Select a photo in the right-hand Customize strip, then drag it within its window.
The compact Adjust Photo inspector provides a 1–4× zoom slider, Reset Photo and
Done. Arrow keys nudge the selected photo; Shift increases the step. The first
touch selects a photo; subsequent drags move it. Scrolling remains available
outside the active photo, and decoration hit targets remain above photo targets.

`Customization.photoAdjustments` maps capture IDs to `{zoom,x,y}`. Coordinates are
normalized source-image centers, not preview pixels. Cover geometry clamps the
effective center to the source bounds using the actual slot aspect and zoom.
Responsive resizing and compatible frame changes retain the saved intent; the
effective crop adapts to each window. Reset changes only the selected photo.

Camera capture now stores the full video frame, mirrored when requested, with
its initial preview crop recorded separately. The default crop remains the same,
but discarded preview edges no longer prevent repositioning. Editing never
overwrites the captured/uploaded source. PNG rendering reads that stored source,
uses zoom-aware processing dimensions, and no longer forces every source through
the previous 2048-pixel intermediate cap. Final output keeps the established
4096-pixel/approximately-eight-megapixel composition budget.

`lib/editor/photo-geometry.ts` supplies crop/placement math to SVG previews, PNG
rendering, GIF frames and Live Strip motion. Moving sources convert horizontal
coordinates for mirrored recordings. Missing video retains the adjusted still
layer. Custom-frame window metadata and original assets are unchanged.

GIF remains the existing photo-sequence product, not a decorated-strip animation.
Each frame uses its corresponding slot crop; differing custom-window aspect
ratios are contained within the GIF canvas instead of stretched. Live Strip keeps
the frame, filters, decorations and per-slot adjustments. Full Live Moment does
not receive strip adjustments or digital flash grading and retains chronological
recording/audio behavior.

The existing customization history handles photo edits. Pointer movement changes
only a lightweight draft; a finished drag/slider interaction makes one history
entry. Undo/Redo restores composition snapshots and invalidates generated outputs.
History remains editor-local as before; Edit Again preserves the composition,
while reopening the editor starts a new history stack.

## 7–9. Capture and session behavior

Every numeric tick and the start of Smile's final full second play the existing
short beep when Capture Sound is enabled. Numeric 1 is still not displayed.
Shutter audio runs immediately before reading the camera frame, after the flash
lead-in. Capture Sound never enables microphone recording.

Flash remains one fixed, full-viewport, opaque white overlay per shutter. After
two animation-frame boundaries, its 480 ms visible interval starts; sampling waits
160 ms after those paint boundaries. The previous implementation used a 400 ms
overlay and roughly 120 ms from activation. Encoding does not remove the overlay
early; cancellation/unmount clears it. Continuous recording does not pause between
automatic shots, and the next countdown does not gain an extra full second.

Physical illumination/exposure cannot be guaranteed by browser code. A stored
flash flag therefore also applies a restrained midtone lift before the selected
filter in still previews/exports, GIF and Live Strip. The curve keeps black/white
endpoints, adds at most about 11.5 RGB levels, and leaves source media intact.
Flash Off gets neither the overlay nor this lift. No torch or system brightness
control is invoked, and reduced motion does not disable the selected flash.

Capture Restart and a changed photo count now clear stickers, text objects and
photo adjustments as well as captures/outputs. Existing camera/style preferences
remain available within that session. Results → Take Another creates a fully new
session with defaults and releases owned media. Edit Again retains customization.

## 10–13. UI refinements

- The desktop heading is centered over the left controls, as subsequently requested.
  The right preview spans the heading/content rows and receives a wider column,
  making the selected strip larger. Controls align toward the top with more
  clearance above the bottom actions, and Print matches Add Text in width, height and baseline. Frame arrows
  remain centered beside the thumbnail, with its name directly below.
  Mobile retains a centered heading above the preview.
- A visible tip beneath the main preview explains photo selection, dragging and zoom.
- Frame selection shows empty black vector frames using the actual window
  geometry, without captured images, decorations or frame artwork images. The
  larger right preview shows the complete selected custom artwork and photos.
- Undo/Redo use curved arrows from the existing SVG icon component, accessible
  names/tooltips and disabled styling. Per the subsequent request, buttons are
  compact (34×32 pixels desktop, 36×36 pixels mobile) with 16-pixel icons.
- Landing hides only its navigation Start CTA. Informational pages retain theirs.
  Decorative strips move modestly inward on desktop/tablet; existing mobile
  placement and all image assets remain intact.
- The FAQ uses native exclusive `details` grouping; opening another question closes
  the first, and the open question can be closed. No accordion package was added.
- Print uses the existing hearts doodle. Animation and explicit See Your Photos
  navigation remain; system printing is never invoked.
- How It Works, Features and FAQ copy describe the new controls/flash accurately.

## 14–15. Preview and intentional release

CI now also validates `milestone-9-5` and `feature/**` pushes. No workflow deploys
or promotes production. Preview builds suppress publisher advertising and add
noindex headers/metadata plus restrictive robots rules. Local reward simulation
remains unavailable on deployed hosts.

[Controlled release instructions](release-workflow.md) cover environment scopes,
branch protection, staged Production builds, operator-only promotion and rollback.
Account settings have not been changed. A feature branch does not by itself stop
Vercel from publishing a later main push; auto-domain-assignment must be reviewed
and disabled before treating main merges as staged releases.

## 16. Files changed

- Model/geometry: `lib/composition.ts`, `lib/editor/photo-geometry.ts`,
  `lib/session/{types,defaults,reducer,selectors}.ts`.
- Editing: `components/editor/{strip-editor,photo-controls}.tsx`,
  `components/screens/customize-screen.tsx`, `components/photobooth/{photo-strip,frame-picker}.tsx`,
  `components/ui/icon.tsx`, `app/globals.css`.
- Capture/filter/export: `components/media/{use-capture,use-gif}.ts`,
  `components/filters/filtered-image.tsx`, `lib/media/still-image.ts`,
  `lib/filters/{engine,preview-worker}.ts`, `lib/render/strip-renderer.ts`,
  `lib/gif/worker.ts`, `lib/video/{live-strip,playback}.ts`.
- Content/Preview: `components/content/{site-chrome,content-ads,content-ads-client}.tsx`,
  `components/screens/printing-screen.tsx`, `app/{page,layout}.tsx`,
  `app/{faq,features,how-it-works}/page.tsx`, `app/robots.ts`, `lib/site-faq.ts`,
  `next.config.ts`.
- Checks/docs: `.github/workflows/validate.yml`, `tests/photo-adjustments.test.mjs`,
  `tests/browser-milestone95.mjs`, existing editor/M7/M8 expectation adjustments,
  README and these milestone/release documents.

No dependency, original production asset, database migration, sharing API,
reward-provider or Full Live Moment export implementation was replaced.

## 17. Validation status

- 117 unit tests pass, including all counts, custom windows, portrait/landscape
  geometry, extreme drags, resolution independence, per-photo reset, session reset,
  mirrored video crops, Full Live Moment isolation and bounded flash exposure.
- Lint and TypeScript pass. Optimized Webpack production build passes.
- Production dependency audit: zero vulnerabilities.
- M9.5 browser acceptance: 50 viewport checks; drag/zoom/reset/Undo/Redo,
  touch input, frame changes, stickers, Print/Results/Edit Again, fresh sessions,
  portrait/landscape uploads, GIF and Live Strip export, exclusive FAQ, sound mute,
  manual and continuous capture pass. The final spacing/button correction additionally passes 14 focused viewport
  checks, including equal action sizes/baselines and left-area header centering.
- Actual Customize SVG versus 1291×4096 downloaded PNG: sampled RGB mean absolute
  error 0.54 levels (0–255 scale). Geometry matches; preview resampling/JPEG and
  output resolution account for small pixel differences.
- M9 HTTP and sharing fixture regressions pass, including exact ten-minute expiry,
  authentication, same-origin checks, PNG validation, cleanup and outage behavior.
- M9 browser regression passes 24 layouts, ad-document isolation, free PNG flow,
  optional microphone and deployed-style reward denial.
- 45 built client bundles scanned: no configured secret values found.
- M8 regression passes: 84 viewport checks, nine downloadable video exports, all
  five custom frames, Full Live Moment with/without audio, continuous 4/8/10/12
  capture, and 12 photos at a ten-second timer (~12 MB source recording).
  The separate extended Full Live Moment stress variant was not rerun.
- Final revised-layout acceptance passes. Remote CI/Preview status will be
  checked after the feature-branch push; production promotion is not authorized
  as part of that push.

## 18–19. Limits and operator actions

Pinch/wheel zoom and Fit mode were intentionally omitted; the accessible slider
and constrained Fill mode provide the required interactions. Highly zoomed images
cannot recover detail absent from their source. Large source files can increase
peak export memory; canvases/bitmaps are released and photos process sequentially.
Motion/GIF retain existing bounded output sizes and browser codec limitations.

Validation uses synthetic devices in Chromium, not physical iOS/Android cameras.
Device exposure, real microphone quality and mobile hardware performance still
need operator testing. Regional Google CMP/account settings and live Supabase
configuration remain the separate M9 launch gates; no AdSense review was submitted.

Review the Preview commit and the release guide, then configure GitHub/Vercel
controls and environment scopes. Production promotion remains the operator's
explicit action. **M9.5 release control is not fully verified until those account
settings and the manual promotion/rollback workflow have been checked.**
