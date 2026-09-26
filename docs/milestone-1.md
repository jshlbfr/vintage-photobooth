# Milestone 1 review

## Implemented

- Six responsive visual routes, shared cream panels, warm colors, grain,
  typography, semantic controls, visible keyboard focus, and a skip link.
- Poppins UI typography with replaceable Playfair Display and Allura accents.
- One SVG photostrip presentation using shared geometry for 1/2/4/6 samples.
- Page-local mirror, count, timer, flash, filter, frame, and color previews.
- Sixteen configurable frame colors and sixteen temporary sticker illustrations.
- A 1.8-second strip-emerging animation; 300ms without animation when reduced
  motion is requested. The timeout is cleaned up when the component unmounts.
- Results' free-download emphasis, enhanced-action cards, and secondary links.
- Local sample photography and isolated temporary vector artwork.

This is a visual prototype. Links navigate, but there is no shared session yet.
Each screen initializes its own sample state. Print/Results show a fixed sample,
not the previous page's edits. No real media, editing, export, rewards, QR,
advertising, or backend feature is implemented.

## Visual differences from Figma

- Landing retains the composition but uses simple original line art in place of
  the detailed booth drawing, photographic camera, aged photo edges, film, and
  taped collage. It also uses two repeating stock portraits rather than the
  supplied sample subjects and poses.
- Camera and Capture use a stock portrait with a dark backdrop rather than the
  reference's curtain portrait. The sample preview fits the entire face, while
  strip slots use centered cover cropping. Camera composition is not implemented.
- Customize uses simplified vector stickers, including a flower placeholder
  for the dog. The blank frame uses the same slot proportions as the actual strip,
  so it is shorter than the distinct blank frame depicted in Figma.
- Results' typography, stickers, and decorative strokes are approximations.
- Display/script fonts are temporary. Only Poppins is confirmed.
- An eighth filter is available by scrolling the row; Figma shows seven.
- Sample badges and unavailable-action copy distinguish the prototype from a
  working media app. There is no passive ad placeholder.
- Mobile/tablet layouts are interpretations of the supplied desktop designs.
  Capture stacks camera, controls, filters, strip, instructions, then Choose Frame.
  Customize keeps a sticky preview beside stacked controls. Results starts with
  the strip, followed by heading, actions, and secondary actions.

## Individual assets that would improve fidelity

Export transparent SVG for vector artwork and transparent PNG/WebP for raster
artwork. Supply pieces separately, not as complete-page images.

1. Central photobooth line illustration.
2. Vintage photographic camera cutout.
3. Each diagonal film/negative element, including the exposed film imagery.
4. Each landing photo strip and single photo, or original photos plus separate
   distressed frame/border overlays; include each demonstrated pose.
5. Individual tape pieces and paper-edge/distress overlays.
6. Background grain/light texture, and separate photo dust/scratch textures.
7. Doodles: rays, sparkles, hearts, paper airplane/trail, arrows, and underline.
8. Sixteen separate stickers: camera, red heart, sunglasses, sparkles, record,
   “good photos only” bubble, cherries, mini strip, dog, star, “photo booth” heart,
   smiley, bow, outlined hearts, dice, and “make memories” bubble.
9. Every frame style available in the intended carousel, including alternate
   count layouts when specifically designed.
10. Exact display/script font names, weights, and properly licensed web fonts.

## Validation completed

- ESLint, TypeScript checking, and `git diff --check` passed.
- `npm run build -- --webpack` passed with all six routes prerendered.
  The default Turbopack build hit an environment restriction on internal port
  binding; the project build script remains unchanged.
- Headless Chromium checked every route at 1440, 768, 390, and 320px widths
  (24 route/viewport combinations), without horizontal overflow or browser errors.
- Verified 1/2/4/6 sample counts, frame color preview, timed printing navigation,
  reduced motion, keyboard access to the skip link, and zero camera/print calls.
- Reviewed desktop and mobile screenshots against all five reference screens.
  Review captures and a machine-readable report are in the gitignored `.review/`.

## Later milestone constraints

- In-memory session only; a refresh may restart it. No media persistence yet.
- One composition will drive all previews and a real high-resolution PNG
  renderer. Never export a screenshot of the DOM.
- Camera required for camera captures; microphone optional. A denied microphone
  must still allow photographs and silent Live Moments.
- Record brief video/audio only around captures. Preserve audio in motion clips,
  support still-only uploads, and release all tracks, URLs, and media resources.
- Download Photo remains free. One completed rewarded ad unlocks GIF, Live
  Moment, and QR for the current session. Take Another clears the unlock;
  Edit Again preserves it alongside the composition and media.
- QR is an explicit temporary upload. Access expires exactly ten minutes after
  creation, enforced server-side; cleanup follows as soon as practical. A browser
  countdown alone is insufficient. No cloud storage or ad integration yet.

Stop here for review before implementing Milestone 2 or real media behavior.
