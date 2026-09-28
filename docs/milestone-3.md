# Milestone 3 — camera, permissions and capture foundation

Implemented in the existing project. No dependencies were installed. No user
media upload, backend, advertising, QR, final filter engine, final export, or
custom PNG frame integration was added. Development stops at this milestone.

1. **Pre-milestone corrections.** All three instruction badges use grid centering,
   unit line-height and consistent Poppins lining numerals within the original
   25 px squares. A subtle reusable CSS shadow separates light strip previews;
   it is absent from frame geometry and capture canvases. Customize's frame
   footer, Add Text and Print share the desktop bottom row; the main preview
   stays centered for all nine geometries. Print feeds for 1.6 seconds, reveals
   **See Your Photos →** after completion and waits for a click. Reduced motion
   skips the feed but still waits. There is no automatic Results navigation or
   system printing.

2. **Files created.** `components/media/camera-preview.tsx`,
   `components/media/media-provider.tsx`, `components/media/use-capture.ts`;
   `lib/media/camera-controller.ts`, `lib/media/countdown.ts`,
   `lib/media/motion-recorder.ts`, `lib/media/resource-store.ts`,
   `lib/media/still-image.ts`; `tests/media.test.mjs`, `tests/browser-media.mjs`;
   this report.

3. **Files modified.** `README.md`, `app/layout.tsx`, `app/globals.css`;
   `components/photobooth/filter-picker.tsx`, `photo-strip.tsx`;
   `components/screens/camera-setup.tsx`, `capture-screen.tsx`,
   `customize-screen.tsx`, `printing-screen.tsx`, `results-screen.tsx`;
   `components/session/session-gate.tsx`; `lib/session/actions.ts`,
   `defaults.ts`, `reducer.ts`, `selectors.ts`, `types.ts`;
   `tests/session.test.mjs`. Removed the obsolete
   `components/photobooth/sample-preview.tsx` and
   `lib/session/sample-captures.ts`. Package manifests, lockfile and supplied
   artwork are unchanged; SHA-256 checks matched all 44 supplied assets,
   including all five files in `public/frames/`.

4. **Architecture.** `CameraController` owns hardware and publishes small status
   snapshots. `MediaProvider` owns that controller and the Blob/URL store,
   synchronizes device preferences and applies route/session cleanup.
   `CameraPreview` attaches the stream to an inline muted video;
   `useCapture` coordinates countdown, stills, motion and uploads. Reducer state
   holds typed media IDs and metadata, never streams or duplicated image data.
   One selector resolves the same images for Capture, Customize, Print and Results.

5. **Camera permissions.** Camera starts on an explicit Enable Camera/retry or
   camera-selection action. Landing and direct-route recovery do not request
   access. Requests are video-only. Recovery text covers denial, missing/busy/
   disconnected devices, unsupported APIs, insecure contexts and generic failure.
   Pending permission can be cancelled; late grants have their tracks stopped.
   Production needs HTTPS; localhost is supported. See
   [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

6. **Microphone fallback.** Enable audio requests a separate audio-only stream.
   Denial or missing hardware leaves camera and stills working, with silent
   motion when available. Denial does not trigger automatic repeated prompts;
   Retry audio is explicit. Granted audio can be turned off. Playback stays muted.

7. **Enumeration.** Real `videoinput` devices populate the selector. Missing
   labels use Camera 1, Camera 2, etc. Enumeration refreshes after permission and
   on `devicechange`. Track-ending/device-loss states provide recovery.

8. **Switching.** Setup selects an exact device ID; Capture cycles available
   inputs without assuming two devices. Initial acquisition prefers user-facing
   video. Old video tracks stop before replacement, and late requests cannot
   replace a newer selection. A single-camera switch is disabled. Real phone
   front/rear hardware switching still needs physical-device verification.

9. **Mirroring.** The session preference applies CSS `scaleX(-1)` to the preview
   and exactly one horizontal Canvas transform to the still. Strip rendering
   does not mirror again. Raw motion carries mirror/crop metadata for future
   composition. Pixel comparisons against the source frame passed both modes.

10. **Countdown.** The configured 3/5/10-second countdown uses a monotonic
    deadline, displays changing numbers and locks duplicate capture/upload/
    switching actions. Abort signals cancel it on restart, stream change,
    navigation, unmount or page hiding. Capture takes one photo per click.

11. **Flash.** A 100 ms white screen overlay fires at the shutter when enabled.
    Disabled flash and reduced-motion preferences suppress it. No torch API is used.

12. **Stills.** Canvas captures from intrinsic video dimensions, crops to match
    the visible preview and encodes a quality-0.94 JPEG Blob. Browser testing
    produced 1755 × 1080 stills from a 1920 × 1080 stream behind a 650 px preview.
    IDs, dimensions, capture time, source, selected filter and mirror metadata
    accompany each capture. CSS looks remain the existing temporary previews;
    the original still is preserved for later processing.

13. **Uploads.** Local multi-file selection decodes and normalizes images into
    the same capture model with `source: upload` and no motion. Only remaining
    slots are filled. Cancel, unsupported MIME, corrupt image and oversized input
    are handled without crashing. Safeguards are 50 MB and 40 megapixels per
    image to limit browser memory pressure. Accepted formats are JPEG, PNG,
    WebP, GIF, AVIF and browser-decodable HEIC/HEIF; animated input becomes a still.
    Temporary decode URLs and canvases are released.

14. **Live Moment foundation.** Recording starts in the final countdown second
    and continues about 700 ms after the still. The session references a short
    Blob containing video plus optional audio, duration and future composition
    metadata. Tested clips were about 1.65–1.68 seconds. No continuous-session
    recording, separate permanent audio file, playback UI or export was added.

15. **Recorder compatibility.** Feature detection selects a supported WebM
    variant, MP4, or the browser default. Construction/recording failures and
    absent MediaRecorder fall back to still-only capture. Unsupported explicit
    codecs are never forced. The test browser used WebM VP9/Opus. This is runtime
    negotiation, not a guarantee of a universal output format. See
    [MDN isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).

16. **Cleanup and privacy.** Leaving Setup/Capture stops video and audio; pending
    requests are invalidated and late streams stopped. Countdown/flash timers,
    recorder handlers and device/track/page listeners are removed as appropriate.
    Restart clears captures/motion and revokes their URLs while retaining setup
    preferences. Take Another releases all resources and starts a fresh session.
    Edit Again retains existing media with hardware off. Refresh loses the
    memory-only session and safely returns to Setup. Network auditing observed
    only local app/static/blob GETs: no media uploads, external resources, POSTs
    or system print calls. QR sharing remains future work with the approved
    **10-minute** expiry; no sharing backend exists.

17. **Count and flow validation.** Independent real-browser 1/2/4/6-photo runs
    passed: empty initial strip, real progress, no extra captures, explicit
    Choose Frame, identical Blob URLs through Customize/Print/Results, Edit Again
    and fresh-session cleanup. All timers, flash on/off, pixel mirroring,
    microphone allowed/denied, still-only recorder fallback, upload recovery,
    restart URL cleanup, navigation cancellation and direct routes passed.
    There were 84 responsive route/viewport checks at 320/390/768/1440 px without
    horizontal overflow and 36 desktop frame/count centering and footer-alignment
    checks. Print remained on `/print` after completion until clicked, including
    reduced motion. Screenshots were visually inspected. Browser console/runtime
    errors: zero. Unit tests: **38 passed**.

18. **Browser limitations.** Browser integration used Chromium's synthetic
    camera/microphone devices through real getUserMedia, Canvas and MediaRecorder.
    Permission denial was deliberately injected; unavailable hardware, camera
    switching, disconnection and late grants were verified with controller mocks.
    Physical hardware, OS permission UI, iOS Safari, Firefox and Edge were not
    available for hands-on testing. Safari inline playback, permission persistence,
    front/rear switching and supported codecs require a physical-device pass.
    HEIC/HEIF decoding depends on the browser. Mobile memory limits vary. Chrome's
    saved-photo availability was roughly 3.75 s / 5.82 s with a 3 s / 5 s timer,
    including the post-shutter motion window; a 10 s timer without recording took
    about 10.07 s. This milestone does not claim final export or filter parity.

19. **ESLint.** `npm run lint` passes without warnings or errors.

20. **TypeScript.** `./node_modules/.bin/tsc --noEmit` passes.

21. **Production build.** `npm run build -- --webpack` passes and prerenders all
    existing routes. Webpack uses the previously established environment fallback
    for Turbopack port-binding restrictions. No package/config changes were needed.

## Reproducing validation

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
node --test tests/*.test.mjs
npm run build -- --webpack
npm run start -- --port 3003
```

In another terminal, with an existing Chromium executable (no browser/package
installation is performed by this runner):

```bash
CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-media.mjs
```

The runner always uses synthetic media devices and writes its disposable browser
profile, screenshots and `m3-report.json` under ignored `.review/`. Override
`PHOTOBOOTH_URL` if the local production server uses a different origin.
Native unit tests require Node 24's TypeScript stripping/import hook; Node emits
an informational module-type warning for the project's existing module setup.
The assertions still pass; the Next.js package configuration was not changed to
silence that test-only warning.
