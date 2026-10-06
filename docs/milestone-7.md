# Milestone 7 — Live Strip, Full Live Moment, sound, rewards and temporary QR

Implementation and local validation completed October 7, 2026. Supabase setup is
intentionally deferred to the owner, as requested. No live project, storage bucket,
ad provider or cloud deployment was created. Milestone 8 has not started.

## 1. Files created

- `.env.example`
- `app/api/reward/development/route.ts`
- `app/api/shares/route.ts`, `app/api/shares/[id]/image/route.ts`, `app/api/shares/cleanup/route.ts`
- `app/share/[id]/page.tsx`
- `components/media/live-strip-preview.tsx`, `components/media/use-video-output.ts`, `components/media/video-results.tsx`
- `components/rewards/reward-dialog.tsx`
- `components/sharing/public-share.tsx`, `components/sharing/qr-share.tsx`
- `lib/media/capture-sound.ts`, `lib/rewards/provider.ts`
- `lib/video/geometry.ts`, `lib/video/playback.ts`, `lib/video/live-strip.ts`, `lib/video/record.ts`, `lib/video/export.ts`
- `lib/sharing/access.ts`, `lib/sharing/policy.ts`, `lib/sharing/supabase.ts`, `lib/sharing/upload.ts`
- `supabase/migrations/202610010001_temporary_shares.sql`
- `tests/milestone7.test.mjs`, `tests/browser-milestone7.mjs`, `tests/share-fixture.mjs`, `tests/share-http.mjs`
- `docs/sharing-setup.md`, `docs/milestone-7.md`

## 2. Files modified

`README.md`, `.gitignore`, `app/globals.css`, `components/media/use-capture.ts`,
`components/screens/camera-setup.tsx`, `components/screens/results-screen.tsx`,
`lib/render/strip-renderer.ts`, `lib/session/actions.ts`, `lib/session/defaults.ts`,
`lib/session/reducer.ts`, `lib/session/types.ts`, `package.json`, `package-lock.json`,
`tests/session.test.mjs`, `tests/browser-editor.mjs`, `tests/browser-motion.mjs`.

Next 16.3.6 and React/React DOM 19.2.8 remain unchanged. Added
`qrcode-generator@2.0.4` and `server-only@0.0.1`; explicitly declared
`sharp@0.35.4`, already present through Next, for validated PNG uploads.
No custom frame assets were changed or integrated.

## 3. Capture Sound architecture

An independent session preference defaults ON and appears between Live Moment
Audio and Mirror Camera. `CaptureSound` owns synthesis and audio resources; the
capture state machine triggers it. It never requests microphone permission.

## 4. Countdown beep

A short 880 Hz sine with a soft 6 ms attack and approximately 95 ms total duration
plays at each numeric tick above one. The display updates before the sound call.
3s gives 3/2; 5s gives 5/4/3/2; 10s gives 10 through 2. No voice or normal “1” beep.
Manual mode has no countdown beep.

## 5. Shutter sound

An original 120 ms synthesized, band-limited noise effect uses two damped clicks,
47 ms apart, for a mechanical shutter character. No downloaded/copyrighted sound
asset or spoken recording was added. Volume is fixed and restrained.

## 6. AudioContext lifecycle

One context is lazily created/resumed from the Capture/Resume interaction and
reused for the sequence. Completed sources disconnect. Pause during countdown
stops active sources and aborts future ticks. Route/session disposal closes the
context. Unsupported or blocked audio never prevents visual photography.

## 7. Countdown, shutter and flash timing

The final numeric tick transitions directly to Smile!, shutter and opaque white
flash. Manual mode enters this event immediately. The source frame is read about
120 ms into the flash; white remains for about 400 ms total. The flash remains
independent of the video source. Pausing after shutter begins finishes that
capture before stopping. Continuous capture repeats this sequence per photo.

## 8. Microphone interaction

Capture Sound and Live Moment Audio are independent. Microphone permission,
recording and existing echo-cancellation constraints are unchanged. Physical
speakers may naturally be picked up by an enabled microphone. No destructive
filtering or automatic disabling was introduced. Synthetic input tests cannot
assess that real acoustic pickup or subjective sound quality.

## 9. Live Strip architecture

Results exposes Live Strip separately from Full Live Moment. A local Canvas
preview combines prepared still/frame and decoration layers with synchronized
native video frames. It loops without first encoding a downloadable video.
Pause/Play preview and explicit Generate/Regenerate controls remain compact.

## 10. Shared composition reuse

The existing `renderStrip` gains optional layer/dimension arguments. Its default
PNG behavior remains unchanged. Both video layers use the same generated frame
layout, colors, normalized decoration positions, sticker aspect ratios, rotations,
interleaved z-order and shared text metrics as Customize/Print/Results/PNG.
No second template or editor layout was introduced.

## 11. Slot clipping and cropping

Each motion frame composes the normalized camera crop stored at capture with the
final slot's center-cover crop, then applies recorded mirroring. Rounded slot
clips prevent spill into gaps or neighboring slots. Uploaded stills and missing
or unreadable motion slots retain their final filtered still. There is no fake
motion, CSS grading or page screenshot in either video output.

## 12. Synchronization

All prepared muted videos seek to zero and begin together. One shared performance
clock drives Canvas drawing at a target 24 fps and corrects drift over 180 ms.
After a cycle, all motion slots seek/restart as a group. The browser test checked
initial and subsequent-cycle synchronization for the mixed strip.

## 13. Different-duration policy

The cycle uses the longest stored clip duration (bounded to the short-clip window,
maximum five seconds). Shorter clips pause/hold their final frame until the group
restarts. They do not independently loop. An all-still strip remains visually
static. Decoder failure in an individual strip slot falls back to its still.

## 14. Live Strip audio

Preview videos are muted. Export contains no microphone audio track. Concurrent
microphone clips are never mixed together. Full Live Moment is the audio-preserving
output.

## 15. Live Strip rendering pipeline

The prepared background/fallback-photo layer is drawn first, motion is clipped
into its slots, then the transparent decoration layer is drawn with shared z-order.
`HTMLCanvasElement.captureStream(24)` feeds a feature-detected MediaRecorder for
one complete cycle. No selection handles, shadows, controls or page background
are included. Encoding progress, cancellation and cached output are supported.

## 16. Resolution

Live Strip fits the actual strip aspect within 720 × 1440, rounded to even pixels
for encoder compatibility. Tested Classic outputs: 432 × 1440 for four photos and
566 × 1440 for twelve. PNG retains its separate high-resolution limits. Export
requests a 4 Mbps video bitrate; actual size/quality remains browser-dependent.

## 17. MIME/container strategy

The shared recorder feature-detects supported WebM/VP9, WebM/VP8 and MP4 candidates
and records the MIME actually produced. Downloads derive their extension from
that MIME, including removal of codec parameters when choosing the suffix.
Chromium generated `video/webm;codecs=vp9` for silent Live Strip.

## 18. Full Live Moment compilation

Applicable motion captures are processed in session order into one Canvas/recorder
stream. One clip is loaded and decoded at a time. The recorder pauses while the
next source loads, so network/decode preparation is not part of the compilation.
No strip geometry, frame, sticker, text or page UI is drawn.

## 19. Normalization

The first recorded capture's presentation crop determines a consistent output
aspect, fitted within 1280 × 720 without upscaling. Each subsequent clip uses its
own saved camera crop and mirror metadata, then center-cover fits that aspect.
The tested camera produced 1280 × 708. Faces are not stretched.

## 20. Transitions

Direct cuts only. Loading occurs while the output recorder is paused. Native
browser recording is real-time rather than frame-exact offline editing, so small
codec/timing differences may occur at cuts. No novelty transitions are added.

## 21. Audio preservation

When any clip has microphone audio, a user-resumed AudioContext routes that clip's
media-element source into one recording destination stream. Only the current
clip is connected; missing audio yields silence for that section. The graph is
not connected to physical speakers during generation. Playback of the resulting
video is user-initiated. Chromium exports had one audio track when enabled and
zero when disabled/denied; no separate audio file is generated.

## 22. Mixed still/motion behavior

Live Strip retains still-only slots. Full Live Moment skips them in place while
preserving the relative order of camera recordings. Zero available clips disables
Full Live Moment with an explanatory empty state; the PNG, GIF and Live Strip
remain available. Unsupported compilation decoding reports an error without
altering originals.

## 23. Full Live Moment output

Preview uses native controls and `playsInline`; no audible autoplay. Downloads
use `vintage-photobooth-full-live-moment.<actual extension>`. Chromium generated
WebM/VP9 with Opus for the audio case and WebM/VP9 for silent cases. Motion color
remains unfiltered in both video outputs.

## 24. Reward state

The existing session reward flag now gates GIF, Live Strip, Full Live Moment and
QR. A successful unlock applies to all four. Download Photo remains completely
outside the gate. A server-signed sharing receipt is kept only in session memory.

## 25. Provider abstraction

`RewardProvider.request(sessionId, signal)` returns an explicit completed,
cancelled or failed result. UI, session updates and the provider implementation
are separate. A real provider must add server-side completion verification and
its own verified receipt validation before production enhanced outputs are enabled.

## 26. Development adapter

An explicitly labelled dialog supports Complete, Simulate failure and Cancel.
It requires `REWARD_DEVELOPMENT=true` and a loopback hostname. No fake ad is shown
as a real advertisement. Public hosts report rewards unavailable; development
receipts also cannot authorize public-host uploads, even if secrets are reused.
No real advertising SDK is installed.

## 27. Success/failure

Opening/loading the modal does not unlock. Only the provider's completed response
updates state. Cancellation/error leaves the flag locked and all local media intact.
The local development sharing receipt is signed, scoped to a session and bounded
to twelve hours; it is not a production ad-verification credential. For local
sessions kept longer than that, QR authorization must be renewed in a fresh test
session. A real provider's session-lifetime policy remains part of its integration.

## 28. Edit Again

Composition edits invalidate derived outputs but preserve the reward flag and
receipt. The browser suite exercised Edit Again → Print → explicit continuation
→ Results without a second reward.

## 29. Take Another

A fresh session resets reward and sound defaults and clears source/generated
media references. Old server shares retain their own original ten-minute expiry;
starting another session does not extend them.

## 30. QR backend

Only the explicit Create 10-minute QR share button renders/reuses the final PNG
and POSTs it to the same-origin share route. Supabase REST calls stay in an isolated
server-only adapter. The browser never receives storage credentials or paths.
Missing configuration and network failures preserve all local output options.

## 31. Supabase schema

The supplied migration creates `photobooth_shares` with a random ID, private object
path, HMAC session identifier for rate limits, PNG MIME, pending/ready state, and
creation/expiry timestamps. It also supplies server-role-only reserve, publish,
active-lookup and cleanup-query functions. No accounts or personal identity are stored.
The SQL was prepared and reviewed; it has not been applied to a live database.

## 32. Storage

The dedicated `photobooth-shares` bucket is private, PNG-only and bounded to
12 MiB. A pending row is reserved before upload so failed/orphaned attempts can
be cleaned. Publication timestamps are assigned only after successful upload.
No permanently public storage URL or signed download URL is sent to clients.

## 33. Security decisions

Privileged modules import `server-only`; credentials have no `NEXT_PUBLIC_`
variables. Table/function privileges are revoked from browser roles and RLS is
enabled. A restrictive bucket policy blocks accidental access through unrelated
permissive policies. Uploads require same origin and a validated receipt, stream
limit the body, verify/decode PNG at at most 8.1 MP and re-encode to strip metadata.
A database advisory lock limits one session to three creations per ten-minute
window. The service-role/RLS model follows
[Supabase's storage access documentation](https://supabase.com/docs/guides/storage/security/access-control).

## 34. Share IDs

Each creation uses `crypto.randomBytes(24)`: 192 random bits encoded as 48 hex
characters. IDs are validated before lookup. Invalid/unknown/expired image requests
receive the same generic unavailable response rather than storage details.

## 35. Server expiry

PostgreSQL sets `expires_at = created_at + interval '10 minutes'`; a CHECK constraint
enforces the relation. The active lookup compares database time, and the image
route rechecks after private-storage I/O before returning bytes. At or beyond
expiry it returns 410. No-store headers prevent application/CDN reuse; the Next
image optimizer is bypassed. There is no production TTL override. Previously
saved bytes cannot be recalled, but new reads are denied.

## 36. Physical cleanup

Schedule the authenticated cleanup endpoint every minute. It deletes expired
objects first, then their rows, up to 200 per invocation. Failures remain retryable.
Pending uploads also expire into this queue. Scheduler monitoring/retries are part
of owner deployment setup. Expiry enforcement does not depend on cleanup timing.

## 37. Public route

`/share/[id]` is outside the booth session guard and renders only the shared strip,
a download action and expiration copy. It revalidates on every request; the image
is served through the private proxy route. The page removes its image at expiry.
Expired/invalid links show a branded unavailable state without a storage URL.

## 38. QR generation

`qrcode-generator@2.0.4` creates the matrix locally; React renders a crisp SVG with
four-module quiet zone and medium error correction. No QR-image service receives
the URL. The library includes TypeScript types and is isolated to the share UI.
See the [upstream project](https://github.com/kazuhikoarase/qrcode-generator).

## 39. Regeneration

Expiry is informational in the client and authoritative on the server. No automatic
renewal occurs. A later explicit creation generates a new ID/path/timestamps and
reuses the session reward. The old ID stays unavailable. The test created a new
share after advancing backend time while retaining old stored bytes.

## 40. Privacy verification

Browser network assertions allowed local assets and the explicit development reward
request before QR, with no media uploads. The only media POST was the final PNG
share; raw captures, motion/audio, GIF and videos were never uploaded. Share HTTP
checks validated private responses and refused cross-origin/forged/invalid inputs.
All 44 supplied production asset hashes matched the baseline; `/frames/` was unused.

## 41. Performance

Frame/fallback-photo and decoration layers are prepared once per video job.
Live Strip decodes only its available clips while visible; Full Live Moment decodes
one at a time. Generation suspends its live preview, reuses bounded geometry and
avoids expensive photographic video grading. GIF retains its worker/cache pipeline.
Encoding runs in real time, and twelve native decoders can still be costly on
mobile hardware; the successful desktop synthetic test is not a mobile guarantee.

## 42. Cleanup

Closing a media dialog aborts unfinished work. Completion, failure and cancellation
stop encoder tracks; videos pause, lose their sources and load state is cleared;
AudioContexts close, bitmaps close and Canvas dimensions are released. Replacement
outputs go through the existing Blob store and revoke old URLs. Take Another
verified zero tracked object URLs and stopped camera/microphone tracks. Closing a
QR dialog aborts its client request; any late server object expires normally.

## 43. Browser limits

Canvas capture, native media decoding, MediaRecorder containers, Web Audio unlock
and mobile download behavior differ by browser. Detection/errors preserve still
photography. Generation needs a visible tab; interruptions cancel rather than
silently recording incomplete video. MP4 extension handling is supported but was
not exercised in Safari. Twelve-source decoding, speaker pickup and sound quality
still need real iOS/Android/device testing.

## 44. Test results

These are automated browser checks with synthetic devices, plus screenshot review;
no physical microphone/speaker listening session is claimed.

- **83 unit tests passed.** Independent sound preference, reward persistence/reset,
  even video geometry for all eight counts, crop composition and exact expiry boundary
  supplement the previous media/filter/editor tests.
- **Camera:** all eight counts, 200 layout checks, 36 flashes approximately 401–406 ms;
  manual, 3/5/10 continuous, Pause/Resume, reduced-motion flash and Flash off passed.
- **Editor/PNG:** all eight counts and 120 layout checks passed; mouse/touch transforms,
  z-order, undo/redo, deletion, generated frames/colors, persistence and high-resolution
  PNG behavior passed. The test harness now focuses its page before pointer dispatch.
- **GIF/filter:** all ten looks compared in PNG/GIF; 4/12 frames, 650 ms infinite loop,
  order, downloads, cancellation/cache/replacement and empty-motion fallback passed.
- **Milestone 7 browser:** sound sequences 1/3/5/10, sound off, pause cancellation,
  sound plus microphone, mixed Live Strip synchronization, twelve-camera Live Strip,
  playable/downloadable real videos, audible-track Full Live Moment and silent off/
  denied cases, reward failure/cancel/success, Edit Again, Take Another, QR failure,
  public link, backend expiry, new share ID and cleanup passed; 49 layout checks.
- **Share HTTP fixture:** origin/receipt checks, PNG type/decode/dimension checks,
  private delivery, exact 600,000 ms lifetime, expired denial before deletion, new IDs,
  rate limit, cleanup authorization/deletion, backend outage, public-host adapter denial
  and public-host development-receipt rejection passed.
- No unexpected browser errors; one deliberate QR-outage 503 was expected. Test videos
  used WebM/VP9, with Opus only in the enabled microphone compilation.

Ignored `.review/` holds reports, screenshots and generated test files. The Supabase
fixture verifies the HTTP contract and expiry behavior, not actual PostgreSQL/RLS
execution. Live Supabase, scheduler and real ad verification remain deployment work.

## 45. Known limitations

Motion uses original camera color. Browser-native recording is not frame-exact
editing; GIF and PNG retain their existing quality paths. Preview/export require
a visible tab. Supabase and a real production reward provider are unconfigured.
Local development receipts last twelve hours. Share requests require a host that
accepts 12 MiB bodies and adequate processing time. Current privacy protection
denies new reads at expiry; it cannot erase a recipient's downloaded copy. Original
rounded strip corners may be represented differently by video codecs without alpha.
Custom PNG frames, Event Mode, accounts, permanent galleries and video/GIF QR uploads
remain unimplemented by design.

## 46. Owner configuration

Follow [sharing setup](sharing-setup.md), apply the SQL migration, configure cleanup,
and fill `.env.local` from `.env.example` with:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SHARE_SIGNING_SECRET` (at least 32 random characters)
- `CRON_SECRET` (independent random secret)
- `SHARE_ORIGIN` (exact application origin)
- `REWARD_DEVELOPMENT=true` only for explicit loopback development testing

No secret needs to be pasted into chat. Production needs a real verified reward
adapter before enhanced actions can unlock. Default production behavior fails
closed, while Download Photo stays free.

For the committed local integration tests, start `node tests/share-fixture.mjs`,
then launch the built application on port 3003 with `REWARD_DEVELOPMENT=true`,
`SUPABASE_URL=http://127.0.0.1:9006`, `SUPABASE_SERVICE_ROLE_KEY=fixture-secret`,
`SHARE_SIGNING_SECRET=fixture-signing-secret-at-least-32-characters` and
`CRON_SECRET=fixture-cleanup-secret`. These are test-only values. Run
`node tests/share-http.mjs` and the browser suites with `CHROMIUM_PATH` set to an
installed Chromium executable. Do not deploy the fixture or these test credentials.

## 47. ESLint

`npm run lint`: passed, no errors or warnings.

## 48. TypeScript

`npx tsc --noEmit`: passed.

## 49. Production build

`npm run build -- --webpack`: passed. Booth routes remain prerendered; share and
API routes are dynamic. The existing environment's webpack build option is retained.

Milestone 7 stops here for review. No Milestone 8 work is included.
