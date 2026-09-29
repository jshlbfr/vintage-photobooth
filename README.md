# Vintage Photobooth

Milestone 4 adds manual/continuous capture with Pause/Resume, full-viewport
photographic flash, eight photo counts and a non-destructive Canvas filter engine.
Camera photos, optional audio and motion remain local in the browser.
See [the milestone report](docs/milestone-4.md).
Follow-up [capture and layout refinements](docs/capture-refinements.md) improve
live filter responsiveness, flash illumination timing and Customize spacing.
Reference screenshots are never rendered as the interface.

## Local development

```bash
npm run dev
```

Open http://localhost:3000. If the environment blocks Turbopack's internal port
binding, use `npm run dev -- --webpack`.

## Review routes

| Route | Visual preview |
| --- | --- |
| `/` | Landing with supplied vintage collage artwork |
| `/camera` | Setup, camera permission/selection and optional audio |
| `/capture` | Live camera, countdown, upload, restart and actual captured strip |
| `/customize` | Frame/color previews and sticker/text controls |
| `/print` | Short strip-feed animation; waits for See Your Photos |
| `/results` | Actual captured strip and action hierarchy |

START creates a fresh session. Choose **1 / 2 / 4 / 5 / 6 / 8 / 10 / 12 photos only in Camera
Setup**, enable your camera, then Continue. Timer 1s takes one photo per click;
3s/5s/10s run a continuous sequence with Pause/Resume. The last second says Smile!.
Counts 6 and above use a wider two-column strip.
Upload fills available slots from local images. Continue never creates photos.
Device, mirror,
timer, flash, current filter, frame and color selections persist through client-side
navigation. Capture, Customize, Print and Results render the same composition.
Edit Again preserves everything; Take Another resets to defaults at Camera.

State lives in memory. Refreshing a later step or opening it directly without
an active capture set redirects to Camera Setup. Opening Camera directly
initializes defaults. Back links preserve the active session. Separate tabs
have separate sessions.

Camera access requires HTTPS or localhost. Microphone access is separately
opt-in; denial leaves stills and silent motion working. MediaRecorder support
varies by browser; stills work when recording is unavailable. Clips record only
the short shutter window. All camera/microphone tracks stop on leaving Setup/
Capture; media remains local and is released when removed or the session resets.

Sticker/text editing, download, GIF, final Live Moment playback/export, QR and
ads remain unavailable. No user media is uploaded, and no persistent storage or
backend is implemented. Print never invokes browser/system printing. Reduced
motion skips the animation; both modes require clicking See Your Photos.

## Architecture

- `app/globals.css`: design tokens, shared styles, and responsive reflow.
- `app/layout.tsx`: metadata, ambient artwork and font variables. Poppins is the
  UI font; Playfair Display and Allura are approved for Results and remain
  temporary substitutes on Landing pending a licensed Forward Serif web font.
- `components/ui/`: shared controls, panels, and icons.
- `components/screens/`: rendering and typed session interactions.
- `components/session/`: Context/reducer provider, fresh-session START link and
  route guard. Provider wraps page children in the root layout so navigation
  through Landing also preserves state until START is pressed.
- `lib/session/`: types, defaults, action union, pure reducer and selectors.
  Captures store lightweight references into a browser-owned Blob/URL store.
- `lib/filters/` and `components/filters/`: typed photographic presets, shared
  pixel processing, a frame-scheduled worker preview and reference-counted derived previews.
- `lib/media/`: camera controller, Blob ownership, accurate cancellable countdown,
  source-resolution Canvas still/upload processing and short MediaRecorder clips.
- `components/media/`: route/session cleanup provider, video preview and capture hook.
- `components/photobooth/photo-strip.tsx`: the single SVG strip renderer used by
  the picker, Capture, Customize, Print and Results.
- `lib/frame-templates.ts`: canonical logical-pixel geometry, nine generated
  templates, and the future asset-template contract with per-count variants.
- `lib/composition.ts`: shared presentation model and crop
  math for a later rendering pipeline. No DOM screenshot export.
- `lib/design-data.ts`: frame colors/styles and eight original preview looks.
  Presets use the shared Canvas engine in `lib/filters/`. Original is the
  default and bypasses grading. Each capture retains its own filter ID.
- `components/artwork/` and `lib/artwork.ts`: supplied decorative assets and
  actual stickers with responsive Next.js image handling.
- `public/images/README.md`: sample photograph sources and licensing reference.

The `(booth)` layout applies the session guard. A future `app/share/[id]` route
can remain outside the private booth flow. Custom PNG frames remain untouched
and unused. Sticker/text state is typed but editing controls remain disabled.

## Validation

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
node --test tests/*.test.mjs
npm run build
```

When Turbopack's port binding is unavailable: `npm run build -- --webpack`.
Google Fonts are downloaded at build time and then self-hosted by Next.js;
building requires access to Google Fonts. No application dependencies were added.

Tests use native TypeScript stripping and a local import-resolution hook,
validated on Node 24. No test runner package was added. The earlier milestone
reports remain historical references; `docs/milestone-4.md` records current
behavior and validation.

Optional camera integration checks use an existing Chromium executable with
synthetic devices: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-media.mjs`.
Start the production server on port 3003 first. See the milestone report for
coverage and physical-device limitations.

Flash is an opaque white overlay over the entire viewport for 150 ms per shutter.
It remains enabled with reduced motion when the user selects Flash. The source
still always comes from the camera video, independent of the overlay.
