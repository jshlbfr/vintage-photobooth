# Vintage Photobooth

Milestone 8 adds the five original custom frames, a full final-second Smile stage,
and one continuous capture recording with per-photo countdown segments.
Live Strip uses the final composition and saved photo filters; Full Live Moment
preserves the uninterrupted camera session and optional microphone audio.
PNG, GIF, video and audio processing remain local. Only an explicitly requested
final PNG share is uploaded, with server-enforced ten-minute access.
See [the Milestone 8 report](docs/milestone-8.md) and
[Supabase setup instructions](docs/sharing-setup.md). The real rewarded-ad provider
remains unavailable pending production configuration and approval.
Earlier reports cover [Milestone 4](docs/milestone-4.md) and
[capture/layout refinements](docs/capture-refinements.md).
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
| `/customize` | Frame/color, sticker/text editing and undo/redo |
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
varies by browser; stills work when recording is unavailable. Recording begins
with the first countdown and continues through automatic capture cycles. Every
photo references its full countdown range in that one local video. Explicit
pauses and manual waiting use recorder pause/resume; resumed countdowns restart. All camera/microphone tracks stop on leaving Setup/
Capture; media remains local and is released when removed or the session resets.

Capture Sound defaults on and is independent of microphone recording. It uses
original synthesized beeps and a short shutter effect, with no voice or audio asset.
Stickers and text remain editable, and Download Photo exports a free PNG.
Generate GIF creates a looping photo sequence with each photo’s selected filter.
Generate Live Moment offers Live Strip and Full Live Moment.
GIF, Live Strip, Full Live Moment and QR share one reward unlock. Download Photo
is always free. The local development adapter is clearly labelled and must be
explicitly enabled; production fails gracefully without a real provider.
Live Strip preserves the customized design with synchronized muted motion.
Full Live Moment exports one continuous source with recorded audio, without
the strip design, using original camera color. Live Strip applies each saved
photo filter. If camera switching/navigation breaks a recording, separate runs
are never silently joined: Full Live Moment reports that continuity is unavailable.
QR uses private Supabase storage and enforces exactly ten minutes on the server.
It requires the setup above; no account is needed. Print never invokes browser/system printing. Reduced
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
  source-resolution Canvas still/upload processing and a continuous MediaRecorder lifecycle.
- `components/media/`: route/session cleanup provider, video preview and capture hook.
- `components/photobooth/photo-strip.tsx`: the single SVG strip renderer used by
  the picker, Capture, Customize, Print and Results.
- `lib/frame-templates.ts`: canonical logical-pixel geometry, nine generated
  templates and five explicitly registered original PNG frames for four-photo sessions.
- `lib/composition.ts`: shared presentation model and crop
  math for SVG and high-resolution Canvas export. No DOM screenshot export.
- `lib/editor/` and `components/editor/`: normalized decoration geometry, shared
  text metrics, pointer manipulation and compact editing controls.
- `lib/render/strip-renderer.ts`: bounded, cancellable high-resolution PNG rendering.
- `lib/gif/`: bounded worker GIF rendering/encoding, with shared crop and filter logic.
- `lib/video/`: shared-geometry Live Strip segments and uninterrupted Full Live Moment rendering.
- `lib/rewards/`: provider contract, with an explicit local development adapter.
- `lib/sharing/`, `app/api/shares/`: server-only PNG validation, private Supabase storage, expiry and cleanup.
- `lib/design-data.ts`: frame colors/styles and ten photographic looks.
  Presets use the shared Canvas engine in `lib/filters/`. Original is the
  default and bypasses grading. Each capture retains its own filter ID.
- `components/artwork/` and `lib/artwork.ts`: supplied decorative assets and
  actual stickers with responsive Next.js image handling.
- `public/images/README.md`: sample photograph sources and licensing reference.

The `(booth)` layout applies the session guard. `app/share/[id]` is a minimal
public route outside that guard. Custom PNG files remain unmodified; their
individual window geometry and transparency are shared by preview and export. All customization and output processing happens locally; QR sharing
uploads only the requested final PNG through server-only routes.

## Validation

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
node --test tests/*.test.mjs
npm run build
```

When Turbopack's port binding is unavailable: `npm run build -- --webpack`.
Google Fonts are downloaded at build time and then self-hosted by Next.js;
building requires access to Google Fonts. Milestone 6 adds `modern-gif@2.1.0`
for local palette-based GIF encoding with dithering inside a worker.

Tests use native TypeScript stripping and a local import-resolution hook,
validated on Node 24. No test runner package was added. The earlier milestone
reports remain historical references; `docs/milestone-8.md` records current
behavior and validation.

Optional camera integration checks use an existing Chromium executable with
synthetic devices: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-media.mjs`.
Start the production server on port 3003 first. See the milestone report for
coverage and physical-device limitations.

Flash is an opaque white overlay over the entire viewport for about 400 ms per shutter,
with the source frame read roughly 120 ms after the white overlay appears.
It remains enabled with reduced motion when the user selects Flash. The source
still always comes from the camera video, independent of the overlay.

Editor/export integration: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-editor.mjs`.

GIF/Live Moment integration: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-motion.mjs`.
GIF generation requires Worker and OffscreenCanvas support; unsupported browsers
retain PNG download and receive a useful error. Live Moment playback/container
support depends on the browser. Download always preserves the recorded Blob.

Milestone 7 integration: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-milestone7.mjs`.
Run with the local development reward adapter and Supabase HTTP fixture as described
in the report. `node tests/share-http.mjs` separately verifies the share API boundary.
The fixture never contacts Supabase. A real deployment must apply the migration,
provide server-only credentials, and schedule cleanup before QR sharing goes live.

Milestone 8 integration: `CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-milestone8.mjs`.
This suite defaults to port 3004; `PHOTOBOOTH_URL` overrides the origin.
`M8_LONG_ONLY=1` runs the 10s × 12-photo capture and full-length video export stress case.
Use isolated fixture environment values from the M8 report, never real sharing credentials.

## Milestone 9 — content and production hardening

Publisher pages now explain the real photobooth: `/`, `/how-it-works`, `/features`,
`/faq`, `/privacy` and `/terms`. The operator/contact are The Vintage Photobooth
and the.vintage.pb@gmail.com. Existing booth routes and capture behavior are preserved.

AdSense verification remains global metadata. The unchanged Google loader only
appears on `/`, `/how-it-works`, `/features` and `/faq`; legal, booth, share and error
screens are ad-free. Content links use full document navigation intentionally,
so a loaded advertising script cannot persist into the camera through SPA history.
Google CMP is retained through the existing Google integration; regional consent
and account settings still require manual verification. No live rewarded provider
has been added. Never treat ordinary ad clicks/impressions as rewards.

See [M9 audit and launch report](docs/milestone-9.md) and the updated
[sharing setup](docs/sharing-setup.md), including the additive 4 MB storage migration.
The free local PNG export retains its full resolution. Local production-build
fixture tests now require `REWARD_LOCAL_TEST=true` as well as
`REWARD_DEVELOPMENT=true`; both must be false in deployment. Existing `.env.local`
is not rewritten by this milestone.

```bash
npm run lint
npm test
npm run build -- --webpack
npm run typecheck
npm audit --omit=dev
# With the isolated server/fixture running on ports 3004/9006:
node tests/milestone9-http.mjs
PHOTOBOOTH_URL=http://127.0.0.1:3004 node tests/share-http.mjs
CHROMIUM_PATH=/path/to/chromium node tests/browser-milestone9.mjs
```

The M9 browser test intercepts the Google loader with a local test response and
checks fresh-document isolation, history navigation, no permission requests on
content pages, and layouts from 320 to 1440 pixels. It does not click or serve real
ads. CI uses Node 24 and the Webpack production build, with no production secrets.
