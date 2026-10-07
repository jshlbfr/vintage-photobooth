# Milestone 8 — Custom frames and continuous memories

## Review baseline and preserved manual work

Implementation was explicitly approved after the read-only Phase 1 report.
Baseline HEAD: `9cf3086`. The tree was clean. Six commits after M7 `4a9e4a9`
changed only `app/layout.tsx`, adding AdSense verification metadata/script and
formatting. Those changes are preserved. `.env.local` contains populated sharing
settings and local development rewards; its values were neither disclosed nor
modified, and no test used those credentials to contact Supabase.

Current styling is preserved: no CSS redesign, spacing rollback, typeface change,
layout replacement, or asset modification. The default Original filter, setup
controls, editor gestures, sound/audio independence, strong full-screen flash,
free PNG, reward gating, explicit Print CTA, and QR security remain in place.

## Invariants and timing

1. **Smile! occupies the final second of the selected timer.**
2. **Per-photo Live Moment target duration ≈ selected timer duration.**
3. **Full Live Moment target duration ≈ timer × photo count.**
4. **Normal automatic capture cycles use one continuous chronological recording,
   with no cuts between photos.**
5. **Live Moment records getting ready → countdown → final pose**, not just the shutter.

The deadline-based countdown now receives the full selected timer. Stage 1 is
rendered as Smile; only numeric stages above 1 beep. Polls align to the next
second boundary, avoiding up to 100 ms of accumulated visible-stage lateness.
After the final second: shutter sound, pure-white viewport overlay, about 120 ms
of illumination, then source-resolution video-frame sampling. The overlay stays
visible for about 400 ms and clears independently of the next automatic cycle.
There is no synthetic numeric-1 beep or extra countdown second.

The former 700 ms post-shutter recording tail is removed. Illumination and JPEG
encoding introduce small unavoidable overhead; a normal 5s × 4 run measured
about 20.6 seconds. The still is never read from the HTML overlay. The existing
still canvas size, crop and JPEG quality are unchanged.

## Recording, segmentation, and audio

`beginMotion` creates one native MediaRecorder on the camera tracks and optional
microphone track. It starts with the first countdown, gathers chunks periodically,
and is retained across the capture hook's automatic loop and manual button clicks.
There is no per-photo stop/restart or simultaneous per-photo encoder.

On completion one Blob enters `MediaResourceStore`. Each `Capture.motion` holds
that same reference plus `startMs`, `durationMs`, `sourceDurationMs`, recorded crop,
mirror state and audio presence. Segment data is attached atomically through the
session reducer. No duplicate source Blob or object URL is created per photo.
The existing provider's reference-set cleanup therefore owns the shared source
without a second media store or duplicate session implementation.

Live Strip seeks each slot's video decoder to its segment offset and plays the
entire countdown under one group clock. Shorter segments hold until the next
loop. Uploaded/missing/undecodable motion slots retain their final still image.
The old five-second truncation is removed. The same filter engine now grades
motion using each capture's saved filter; Original bypasses it. Crop, mirror,
frame windows, frame overlay, stickers, text, rotation, scale and ordering are
shared with the final still composition.

Full Live Moment requires every camera capture to reference the same continuous
source. It plays that source once, from the beginning to its recorded end, into
one export recorder. There are no per-photo loads, joins, transitions or encoder
pause/resume calls during export. A single transformation pass preserves the
existing cropped/mirrored output presentation; it does not splice recordings.
Full output retains original camera color and omits strip artwork/decorations.

Microphone audio travels through one media-element audio source to the export
stream for the full duration. It is never routed to speakers for export and is
never mixed with the synthetic countdown/shutter graph. Audio-off/denied sources
produce silent videos. Live Strip remains muted with no audio track.

## Pause, manual mode, interruptions

- Timer 1: one full Smile second per click. Recorder pause/resume excludes waiting
  between clicks. Four manual photos target about four active seconds plus the
  illumination overhead, regardless of user waiting time.
- Explicit Pause during countdown: cancel the attempted shutter, pause the
  recorder, stop sounds. Resume restarts that photo's full countdown. The aborted
  attempt remains in Full Live Moment, but only the successful countdown becomes
  that photograph's Live Strip segment. This can exceed timer × count intentionally.
- Pause after shutter begins: finish that photograph, then pause.
- Normal automatic cycle boundaries: never pause/stop the recorder.
- Hidden tab: pause/cancel countdown to avoid ghost captures.
- Camera switch, route departure, or track loss: finalize available prior motion
  when possible; later runs remain separate. Full output is unavailable if all
  camera captures cannot be represented by one source. The UI explains this;
  stills and available Live Strip segments remain usable. It never silently joins
  discontinuous runs and calls them continuous.
- Restart/session reset: cancel pending capture/recording and discard segments.
  A generation guard and retained-still checks prevent stale finalization from
  reattaching media after reset.

## Custom frame integration

The original files `Vintage Frame 4-Image Strip 1.png` through `5.png` are unchanged.
All are 302 × 958 RGBA images, with different windows and semi-transparent worn
edges. Each is explicitly registered with its own slot coordinates:

| ID | Picker name | Compatible count |
| --- | --- | --- |
| vintage-1 | Vintage Burgundy | 4 |
| vintage-2 | Vintage Cream | 4 |
| vintage-3 | Vintage Tape | 4 |
| vintage-4 | Vintage Film | 4 |
| vintage-5 | Vintage Paper | 4 |

The existing nine generated frames remain available for all counts. The picker
filters by compatibility; reducer validation rejects incompatible selections,
including undo/replace actions. Changing count falls back to Classic as needed.

The shared layout includes an interior paper backing for frame color. It remains
inside the artwork's outer edge, preserving exterior transparency. Frame Color
colors that backing; it does not recolor or flatten the supplied artwork.
Photos are drawn below the original rim/texture overlay; user decorations remain
above it. The PNG renderer's decorations layer includes frame overlay artwork so
Live Strip cannot paint motion over the frame borders or tape.

Customize, Print, Results and PNG use the same asset and geometry. The existing
GIF remains an individual-photo sequence, with the shared slot aspect and saved
filters; it has no strip composition. No new strip-GIF format was introduced.

High-resolution PNGs retain native photo rendering (custom strips export at
1200 × 3807). Frame artwork is necessarily enlarged from the supplied 302-pixel
width: larger original exports would improve artwork detail. No destructive
optimization, replacement texture, artwork redesign or stretched count variant
was introduced.

## Performance, ownership and browser limits

- Source recording uses one encoder at a requested 2.5 Mbps and one-second chunks.
  A 100 MiB accumulated-data bound cancels failed/abandoned oversized motion safely.
- Only small references/timing metadata enter React state; Blob bytes stay local.
- Recording borrows camera/microphone tracks. Stopping the recorder never stops
  the preview; the existing camera controller releases hardware on route exit/reset.
- A paused recording excludes idle time from the active timeline.
- Live Strip reuses prepared base/artwork/decorations layers. Filter working
  canvases are reused and bounded to 320 pixels wide, or 192 for more than four
  moving slots. This affects moving-slot processing only, never still quality.
- Video export timeouts scale with duration rather than cutting off at 120 seconds.
- Decoders, audio nodes, generated tracks, bitmaps, filter canvases and render
  canvases are disposed on completion, cancellation or unmount. Existing resource
  tracking revokes shared URLs after the last session reference is removed.
- Unsupported recording, codec failures, missing microphones and seek errors
  leave still-photo functionality intact. MIME/extension remain browser-selected.
- Mobile memory/decoder limits can prevent many simultaneous motion slots. A
  browser that cannot decode a slot retains its still; an unusable seek/playback
  reports an error. Real-time export requires the tab to remain visible.
- Native browser scheduling/encoding is not frame-exact offline video editing.
  Browser/device QA is needed for codec, microphone/speaker and long-session limits.

No new package, media backend, automatic upload or advertising provider was added.
The manual AdSense verification script remains in the root layout. Ad-account
placement settings and Google approval are external deployment checks; the code
adds no ad placements or production reward success path.

## Validation

Recorded artifacts are under ignored `.review/`; no user photographs were used.
Synthetic Chromium camera/microphone data and a local Supabase contract fixture
were used. Tests block third-party ad requests without changing the production
layout or verification script.

- 95 unit tests pass, including all supported timer/count combinations for one
  recorder lifecycle, final-second timing, shared-source references and frame
  compatibility/reset validation.
- M8 browser suite: 5s × 4 with audio, manual 1s × 4, 3s × 8, 5s × 8, 5s × 10,
  5s × 12, 10s × 12, and audio-denied 1s × 1 with Flash off.
- Each automatic run asserts one recorder start/stop, no intermediate pauses,
  one stored source, one shutter per still and a full visible Smile interval.
- All five frames: Customize desktop/mobile/landscape, Print, Results, transparent
  high-resolution PNG, Live Strip preview and actual downloadable video. Moving
  Mono pixels verified; overlay alignment inspected visually.
- 84 viewport checks in the main M8 suite; no application errors.
- Full Live Moment audio-on and microphone-denied silent exports decode and play;
  downloads match their generated Blob bytes. Print waits; Edit Again keeps rewards;
  Take Another releases resources.
- QR HTTP contract checks pass: authorization, origin, PNG validation, exact TTL,
  private/no-store delivery, expiry before deletion, cleanup, rate limit, outage,
  and public-host development reward denial.

Final checks passed: ESLint (no warnings), separate TypeScript checking,
production Webpack build, 95 unit tests, all four existing browser suites, the
main M8 browser suite, the long-export stress suite, and sharing HTTP checks.

- Capture regression: all eight photo counts, 36 flash events, 200 viewport checks,
  manual/automatic modes, pause/resume, reduced motion, microphone denial, and cleanup.
  It found and verified the fix for pausing a new countdown while the previous
  flash was still completing; the flash now keeps its full 400 ms duration.
- Editor regression: all counts, 120 viewport checks, mouse/touch manipulation,
  transforms, layer ordering, undo/redo, deletion, PNG downloads and reset cleanup.
- GIF/filter regression: 4/12-photo GIFs, all ten saved looks, regeneration/cache/
  cancellation, 22 viewport checks. Camera filter preview delivered 22 frames per
  1.1 seconds for every graded look in synthetic Chromium testing.
- M7 regression: synchronized mixed still/motion slots, optional sound/audio,
  twelve-camera strips, 49 viewport checks, failed/cancelled/completed rewards,
  Edit Again/Take Another, explicit QR upload, server expiry, renewal and outage.
- Long stress case: 10s × 12 produced approximately 121.7 seconds from one source
  (12,150,230 bytes). Both the 12-slot Live Strip and full-length video exported,
  downloaded byte-for-byte, decoded and played. Full output was approximately
  7.74 MB at 1142 × 720 with no audio, correctly matching that test's setting.
- Main automatic runs measured approximately 20.57s (5×4), 25.24s (3×8), 41.20s
  (5×8), 51.49s (5×10), 61.84s (5×12) and 121.88s (10×12). All used one source Blob.
  The minimum observed Smile interval was about 991 ms, allowing browser scheduling.
- All 49 tracked public assets match the pre-M8 bytes. `app/layout.tsx`,
  `app/globals.css`, `package.json` and `package-lock.json` also match the baseline.
  No dependency was installed or upgraded.
Safari 26.5 WebDriver was attempted but refused session creation because Safari's
Allow Remote Automation setting is disabled. No browser settings were changed.
iOS Safari, Android Chrome and real camera/microphone hardware were not tested.
Emulated viewport checks do not substitute for those tests. Native decoder memory
on physical mobile devices remains a deployment QA item.
Live Supabase SQL/RLS/cron and real advertising delivery were not exercised.

## Reproduction

Use a separate local server with fixture-only values, keeping `.env.local` intact:

```bash
npm run build -- --webpack
node tests/share-fixture.mjs
# Separate terminal:
SUPABASE_URL=http://127.0.0.1:9006 \
SUPABASE_SERVICE_ROLE_KEY=fixture-secret \
SHARE_SIGNING_SECRET=fixture-signing-secret-at-least-32-characters \
CRON_SECRET=fixture-cleanup-secret \
SHARE_ORIGIN=http://127.0.0.1:3004 REWARD_DEVELOPMENT=true REWARD_LOCAL_TEST=true \
npm run start -- --port 3004
# Separate terminal; use an existing Chromium executable:
CHROMIUM_PATH=/path/to/chromium node tests/browser-milestone8.mjs
M8_LONG_ONLY=1 CHROMIUM_PATH=/path/to/chromium node tests/browser-milestone8.mjs
PHOTOBOOTH_URL=http://127.0.0.1:3004 node tests/share-http.mjs
```

Existing browser suites accept `PHOTOBOOTH_URL` and `CHROMIUM_PATH`. M7 sharing
checks also require the fixture above. Local development reward simulation remains
explicitly labelled and unavailable on public hosts. Do not enable it in deployment.


## Files changed

- Capture/session: `components/media/use-capture.ts`, `lib/media/countdown.ts`,
  `lib/media/motion-recorder.ts`, `lib/media/live-moment.ts`,
  `lib/session/types.ts`, `lib/session/actions.ts`, `lib/session/reducer.ts`.
- Video: `lib/video/export.ts`, `geometry.ts`, `live-strip.ts`, `playback.ts`,
  `record.ts`; `components/media/use-video-output.ts`, `video-results.tsx`,
  `live-strip-preview.tsx`.
- Frames/rendering: `lib/frame-templates.ts`, `lib/render/strip-renderer.ts`,
  `components/photobooth/frame-picker.tsx`, `photo-strip.tsx`,
  `components/screens/customize-screen.tsx`.
- Tests: new `tests/milestone8.test.mjs`, `tests/browser-milestone8.mjs`;
  updated `browser-media.mjs`, `browser-editor.mjs`, `browser-motion.mjs`,
  `browser-milestone7.mjs`, and `share-http.mjs` for current behavior and isolated QA.
- Documentation: `README.md` and this report.

## Remaining deployment checks

Enable Safari remote automation locally if Safari automation is desired; test
real Safari/iPhone/Android camera, microphone, video codecs, downloads and long
sessions before claiming cross-device production readiness. Confirm live Supabase
migration/RLS/private bucket/cron and deployment body limits independently. Keep
development rewards disabled in deployment. AdSense verification is preserved;
a real Google Ad Manager rewarded provider still requires explicit authorization
and valid approved configuration. Higher-resolution original frame exports are
optional artwork-quality improvements. No known failing critical implementation
test remains, and no subsequent milestone was started.

## Completion report

1. **Summary:** complete-countdown moments, uninterrupted automatic-session recording,
   filtered Live Strip and five custom frames integrated into existing systems.
2. **Files changed:** the grouped file inventory above lists implementation,
   regression tests and documentation; no dependency or asset files changed.
3. **Manual work preserved:** AdSense layout changes, current CSS/layouts, original
   PNG bytes and `.env.local` remain intact.
4. **Architecture:** one native recording resource with per-capture time ranges;
   existing session reducer, resource store and composition model extended.
5. **Countdown:** Smile replaces the final second; shutter occurs afterward,
   followed by the existing illumination delay and high-quality still sample.
6. **Live Moment:** starts at the first countdown; each photo references its entire
   successful countdown through shutter, with no five-second cap.
7. **Full continuity:** one source/encoder through automatic cycles, continuous
   microphone audio where enabled, one uninterrupted output transformation pass.
8. **Custom frames:** individually measured four-slot geometry, original overlays,
   interior frame-color backing, preserved outer alpha and compatibility filtering.
9. **Cleanup:** shared source URL, cancellation/reset guards, borrowed camera tracks,
   bounded recording bytes and disposal of decoder/canvas/audio resources.
10. **Responsive/production polish:** existing visual baseline retained; desktop,
    phone and landscape viewport checks pass. No CSS redesign was needed.
11. **Tests:** 95 unit tests; M8 main and long-session browser suites; all four
    existing browser suites; local QR HTTP contract/security checks.
12. **Lint/types/build:** ESLint without warnings, TypeScript and production
    Webpack build pass. Git whitespace checks pass.
13. **Browser limits:** Safari automation requires its currently disabled setting;
    physical mobile codec/memory/audio/download QA remains. Motion failures preserve
    stills. Full video never disguises interrupted source recordings as continuous.
14. **Remaining work:** physical-device QA, live Supabase deployment verification,
    Google approval and a separately authorized real reward provider. Original
    302-pixel-wide frame exports limit enlarged artwork detail. No known critical
    implementation failure remains in the tested environment.
