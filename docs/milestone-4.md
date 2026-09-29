# Milestone 4 — capture sequences, expanded strips and photographic filters

This report records the original milestone. See [subsequent refinements](capture-refinements.md)
for updated live-preview processing, flash timing and layout behavior.

Completed in the existing project without new packages. Media remains local.
No custom frame PNGs, final exports, editor expansion, ads, QR/backend, or
Milestone 5 work was added.

1. **Files created:** `lib/filters/presets.ts`, `lib/filters/engine.ts`,
   `components/filters/filtered-image.tsx`, `components/filters/live-filter.tsx`,
   `lib/media/paint.ts`, `tests/filters.test.mjs`, and this report.

2. **Files modified:** `app/globals.css`; `components/media/camera-preview.tsx`,
   `media-provider.tsx`, `use-capture.ts`; `components/photobooth/filter-picker.tsx`,
   `photo-strip.tsx`; `components/screens/camera-setup.tsx`, `capture-screen.tsx`;
   `components/ui/icon.tsx`, `controls.tsx`; `lib/composition.ts`, `design-data.ts`,
   `frame-templates.ts`; `lib/session/defaults.ts`, `selectors.ts`;
   `tests/browser-media.mjs`, `frame-templates.test.mjs`, `session.test.mjs`;
   `README.md`. Package manifests and supplied production artwork are unchanged.

3. **Setup:** Camera → Live Moment Audio → Mirror Camera → Photo Count → Timer.
   Audio uses the identical switch component as Mirror. Counts use a compact
   four-by-two button arrangement. Very narrow mobile screens stack field labels
   above their controls to retain usable button widths.

4. **PhotoCount:** the typed choices are `1 | 2 | 4 | 5 | 6 | 8 | 10 | 12`.
   Camera Setup remains the sole count control. No Customize count control exists.

5. **Layouts:** 1/2/4/5 use one column with respectively 1/2/4/5 rows.
   6/8/10/12 use two columns with respectively 3/4/5/6 rows. Photos fill in row
   order, left to right, then down.

6. **Two-column implementation:** the shared geometry retains each style's
   photo-window width and adds a second column plus an internal gutter. It does
   not squeeze two columns inside the old logical width. Classic grows from
   224 to 438 logical pixels. Every screen consumes the same slots/viewBox;
   presentation sizing derives the column count from that geometry.

7. **Frames:** all nine existing styles support all eight counts. Classic's
   four-photo dimensions remain unchanged. Side/top/bottom padding, slot radius,
   spacing and Wide/Narrow proportions remain style-specific. Bottom-padding
   variants retain their meaningful footer differences in both column modes.
   Custom `public/frames/` files remain untouched and unused.

8. **Manual mode:** 1s shows Smile!, takes one photo and returns to idle. Another
   photo requires another Capture click. Already filled slots and their filter
   assignments remain intact.

9. **Continuous mode:** 3/5/10s run one controlled async loop from the current
   capture count to the target. Explicit idle/counting/capturing/paused/complete
   phases and an AbortController replace chained timeouts. Duplicate starts,
   camera switching, uploads, flash-setting changes and filter changes are locked
   while active. Pause makes the settings available again.

10. **Pause/Resume:** Pause aborts an unfinished countdown and its recorder. If
    the shutter has already fired, the in-flight photograph finishes, then the
    loop pauses before another countdown. Resume starts a fresh countdown from
    the next empty slot. Paused preview stays live and filter selection unlocks.
    Restart/navigation/unmount invalidate pending work and release resources.

11. **Countdown and full-screen flash:** the final second is Smile!, never 1.
    The explicit Flash preference controls a body-level portal overlay:
    fixed/inset 0, `#FFFFFF`, opacity 1, z-index 2147483647, pointer-events none.
    Each shutter shows it for 150 ms, without a fade-in. Flash OFF creates no
    overlay. Reduced motion does not disable this user-enabled photography
    control. A synchronous React commit followed by two animation-frame
    boundaries allows the white overlay to paint before the still reads the raw
    video. The flash is independent of source pixels; no DOM screenshot is used.
    Browser scheduling and camera exposure latency can vary; system brightness
    is neither changed nor controllable by this implementation. See
    [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

12. **Original:** every new session selects Original. Video is displayed directly;
    Original stills resolve directly to their source Blob URLs. There is no
    grading, Canvas preview, CSS filter, grain texture or colored rectangle over
    Original. The previous preview grain and strip tint overlay were removed.
    Mirror/crop handling and JPEG encoding remain part of capture.

13. **Processing architecture:** a typed parameter model drives a shared Canvas
    pixel engine: exposure, contrast, saturation, channel temperature/tint,
    shadows/highlights, black lift, piecewise tone curves, deterministic grain,
    radial vignette, restrained highlight-only bloom and subtle edge chromatic
    displacement. Tone look-up tables are cached. Live preview uses at most
    384-pixel width at about 8 fps; thumbnails use 160-pixel derivatives and
    captured-strip previews use up to 800 pixels on their longest side. The same
    engine accepts any Canvas resolution for later export; no final strip export
    is implemented. No photographic look is implemented as a CSS filter string.

14. **Nine presets:** Original is untouched. Golden hour is warm with soft
    highlights and fine grain. Old soul is muted with lifted blacks. Faded diary
    has archival color and compressed whites. Sunday has cool/green balance and
    open shadows. Silver screen uses a deliberate monochrome response. After
    hours combines cool compact-camera contrast, vignette and subtle chromatic
    edges. Soft focus adds restrained highlight bloom and pastel tones. Warm
    memory adds amber midtones and mild edge falloff. These are original names
    and looks, without brand affiliation or claims of exact film emulation.

15. **Non-destructive media:** originals and raw motion stay in the existing
    local resource store. Every capture records its filter ID. Derived previews
    always start from the original source; changing future selections does not
    regrade old photographs. There is no global strip filter in the composition
    model. Derivatives share a reference-counted cache and revoke their object
    URLs when their last view releases them. Thumbnails use the same engine.

16. **Centering:** Capture uses a stable flex-centered stage; Customize retains
    its centered preview. All counts and nine frame geometries were checked.
    Frame name, Add Text and Print retain the aligned desktop footer row.

17. **Viewport fit:** responsive grid rows, restrained padding/gaps, flexible
    camera height, scaled controls and wider two-column stages keep the primary
    desktop screens within 1440 × 1024 and 1366 × 768. This does not hide overflow
    to conceal controls. Mobile pages and very short desktop windows can scroll.
    The Print output's clipping remains intentional for its strip-feed animation.

18. **Camera-switch icon:** replaced overlapping paths with a simple camera and
    paired rotation arrows. It uses the existing SVG icon component, accessible
    Switch camera label, focus/hover treatment and disabled state. No icon
    dependency was added. Real enumeration/switching behavior is preserved.

19. **Audio:** OFF requires no microphone and uses silent motion. ON requests
    audio after the camera becomes ready, including when switched on before
    camera initialization. Denied/unavailable microphone falls back to silent
    motion with a small status message. Denial is remembered by the controller;
    toggling again does not repeatedly prompt. OFF stops audio tracks. Still
    capture remains independent of microphone permission.

20. **Print:** updated geometry is shared with Capture, Customize and Results;
    two-column output is wider. The animation finishes and the page waits for
    See Your Photos →. It never navigates on a timer or opens system printing.

21. **Validation:** 47 native unit tests pass. Browser integration covered all
    eight counts through Capture/Customize/Print/Results, 1s manual capture,
    3/5/10s continuous capture, pause during countdown, pause after three photos,
    resume with a new filter, per-photo filter retention, Original, all nine
    rendered preset thumbnails, audio fallback, URL/track cleanup, explicit Print
    continuation and 200 responsive page/viewport checks. Desktop checks asserted
    both horizontal and vertical fit. Nine frame geometries were centered for
    each count. Thirty-six enabled shutters produced exactly 36 viewport flashes;
    measured duration was approximately 150.5–154.8 ms, including reduced-motion
    mode. The suite includes 1-photo manual and 4/8/12-photo continuous flashes.
    A captured 1440 × 1024 screenshot was verified pixel-for-pixel `255,255,255`;
    its accompanying still contained camera imagery rather than white overlay
    pixels. Flash OFF produced no overlay. Additional checks covered audio
    opt-in before camera initialization and stopping audio with its toggle.
    Console/runtime errors: zero. Network audit: no media uploads or external
    resources. All 44 supplied asset hashes, including five custom frames, match.

22. **Limits:** browser integration uses Chromium synthetic camera/microphone
    devices through the real browser APIs. Physical camera switching and OS
    permission dialogs still need hands-on verification, as do Safari/iOS,
    Firefox and Edge. The live Canvas preview deliberately trades resolution
    and frame rate for responsiveness; slower phones may need further tuning.
    Filter gallery review used the supplied sample portrait; broader lighting
    and skin-tone QA remains useful. Browser codec and HEIC limitations from
    Milestone 3 still apply. A white display cannot exceed the user's configured
    hardware brightness or guarantee how much light reaches the camera exposure.

23. **ESLint:** `npm run lint` passes.

24. **TypeScript:** `./node_modules/.bin/tsc --noEmit` passes.

25. **Build:** `npm run build -- --webpack` passes. Webpack remains the established
    fallback for this environment's Turbopack port-binding restriction.

## Repeatable checks

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
node --test tests/*.test.mjs
npm run build -- --webpack
npm run start -- --port 3003
```

With an existing Chromium executable, in another terminal:

```bash
CHROMIUM_PATH=/path/to/chrome-headless-shell node tests/browser-media.mjs
```

The browser runner uses synthetic devices and writes only disposable profiles,
screenshots and `m4-report.json` under ignored `.review/`. `PHOTOBOOTH_URL` can
change the local server origin. Node 24's native TypeScript test setup may emit
its existing module-type informational warning; assertions pass.
