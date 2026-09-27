# Milestone 1.5 — artwork, fidelity and generated frames

## Scope

Continues the existing Next.js project. No packages or font files were added.
Interactions remain page-local previews. Selection does not persist between
routes; Print and Results still use the same fixed sample composition. No
Milestone 2 session work, media APIs, uploads, backend, ads, sharing or exports.

## Files created

- `lib/frame-templates.ts`: typed templates and canonical frame geometry.
- `lib/artwork.ts`: supplied doodle/sticker asset mapping and intrinsic sizes.
- `components/artwork/ambient-background.tsx`: optimized ambient image layer.
- `tests/frame-templates.test.mjs`: geometry and future custom-variant checks.
- `docs/milestone-1.5.md`: this report.

## Files modified

- `app/layout.tsx`: ambient artwork; existing font configuration preserved.
- `app/globals.css`: artwork placement, carousel, proportions and responsive styling.
- `app/(booth)/results/page.tsx`: actual alternate ray doodle.
- `components/artwork/doodle.tsx`: real supplied images replace SVG stand-ins.
- `components/artwork/landing-artwork.tsx`: booth, camera and seven collage assets.
- `components/artwork/sticker.tsx`: actual picker artwork and SVG-compatible images.
- `components/photobooth/frame-picker.tsx`: real previews, count selector, selected name/index.
- `components/photobooth/photo-strip.tsx`: canonical geometry, independent slot radii,
  supplied stickers and future asset layers.
- `components/screens/customize-screen.tsx`: local count/style/color preview state.
- `lib/composition.ts`: shared geometry adapter, image fit and decorated sample.
- `lib/design-data.ts`: actual sticker identities and new frame exports.
- `README.md`: current architecture, scope and validation instructions.

Browser scripts, screenshots and reports are local review artifacts under the
already ignored `.review/` directory. User-supplied, initially untracked files
under `public/` are not newly authored implementation files.

## Assets

Integrated all eight supplied doodles, all sixteen sticker PNGs, both ombre
images, all seven Landing photo-strip/collage images, the photobooth line art,
and the vintage camera. `next/image` serves responsive decorative images and
picker stickers; `getImageProps` supplies optimized sticker URLs inside SVG.
Decorative images have empty alternatives, preserve aspect ratio, and cannot
intercept pointer input. The existing male sample portrait and grain texture
remain in use.

Intentionally unused: the five `public/frames/` custom designs, as requested;
the second stock portrait, superseded in Landing by supplied photos; and the
five reference screenshots, which remain references only. No standalone film
ribbon asset was supplied, so the code-native film decoration remains a known
approximation. No usable licensed Forward Serif web font was present; the
existing temporary Landing fonts remain. Results retains approved Playfair
Display and Allura; normal UI remains Poppins.

SHA-256 comparison confirmed all 44 inspected production files unchanged,
including the five custom frames. The browser also checked that no custom
frame asset is requested by the UI.

## Generated frames

| Style | Distinction |
| --- | --- |
| Classic | Balanced 14-unit borders, 18-unit gutters, soft corners |
| Tight | 9-unit borders, 6-unit gutters, larger windows |
| Airy | 22-unit side borders, 26-unit gutters, softer corners |
| Flush | 3-unit edges/dividers and square corners; also covers the Edge concept |
| Small bottom | 30-unit footer, crisp corners |
| Medium bottom | 52-unit traditional footer |
| Large bottom | Restrained 78-unit instant-photo footer |
| Wide | 260-unit width, wider landscape windows |
| Narrow | 190-unit width, slim proportions and square windows |

Every style supports every count. One photo gets a prominent 3:4 portrait
window. Two use two stacked, slightly portrait windows. Four retain classic
vertical-strip proportions (Classic is 224 × 746 with four 196 × 166 slots).
Six use shorter windows capped at 124 units, 65% gutters, 75% top/bottom padding
and slightly narrower side borders. Six-photo height remains less than 1.25
times the corresponding four-photo height. Nonexistent slots are never drawn.
Blank footer variants retain their relative hierarchy. Captions reserve enough
footer space when present. All nine layouts are distinct at each count.

Frame color is a separate composition field and never influences geometry.
All sixteen palette colors work with every generated style. Customize preserves
the compact previous/next carousel, with real sample windows, an announced
selected name/index and a local count selector. The right preview uses the
same composition. Tall sample portraits use contain fitting so shorter windows
do not crop off faces; future camera photos default to cover.

## One geometry source and future custom frames

`resolveFrameLayout()` returns logical-pixel bounds and slots, independent of
DOM measurements. The picker, Capture, Customize, Print and Results all consume
this through `PhotoStrip`. A future Canvas renderer can scale coordinates by
`outputWidth / layout.width`, honoring slot radii, photo fit and composition
layers. No export renderer is implemented here.

The discriminated `FrameTemplate` union supports generated and asset templates.
An asset template has a partial count-to-variant map: each supported count
supplies its own asset, exact layout and background/overlay layer. Unsupported
counts are rejected. Later integration requires registering approved templates
in `FRAME_TEMPLATES` and filtering available picker options with
`supportsPhotoCount`; the geometry/composition contract and renderer remain
usable. No current custom PNG is registered, imported, optimized or rendered.

## Fidelity and responsive review

- Landing: actual booth, camera, strips and doodles replace approximations;
  ombre texture and title/underline/START spacing follow the reference. Mobile
  repositions and simplifies peripheral artwork to preserve the central controls.
- Camera: corrected settings-row height restores the approximately 730 × 898
  panel and reference vertical position; 650 × 400 desktop preview and 60-unit
  Continue control retained.
- Capture: reviewed the 994 × 898 panel, 650 × 400 preview, toolbar, 134 × 44
  buttons, 80-unit filters and small instruction cards against Figma. Original
  matching dimensions retained; adaptive strip geometry and shared background
  improved. Eight filters remain horizontally scrollable. Mobile retains camera,
  controls, filters, strip, small instructions and Choose Frame order.
- Customize: actual sticker artwork in the original four-column desktop picker;
  preserved three-column balance and independent colors. Selected frame geometry
  is visible and identified. Mobile keeps the preview accessible beside stacked
  controls. The action remains `Print →`.
- Print: same canonical decorated composition, original short emergence animation
  and slot metaphor, 1.8-second transition, reduced-motion path and no system print.
- Results: approved fonts preserved; actual stickers and correctly shaped doodles,
  adjusted decoration scale/position, original action hierarchy and secondary
  navigation. Mobile prioritizes the finished strip, heading and actions.

Remaining differences: temporary Landing typography; approximate film ribbon;
stock sample portraits and black backdrop instead of the Figma curtain portraits;
intentional count/frame labels and sample notices. Generated picker thumbnails
now include photos by request, unlike the blank reference. Desktop Figma does
not define mobile layouts; responsive arrangements are inferred. No new ad area
or ad integration was added. The large Results space between primary and
secondary actions is also present in the reference and was preserved.

## Validation

- ESLint: passes with no warnings/errors after cleaning local review scripts.
- TypeScript: `tsc --noEmit` passes.
- Geometry tests: 12 pass, covering 36 layouts, bounds, count adaptation,
  unique geometry, caption placement and unsupported future custom variants.
- Production: `npm run build -- --webpack` passes and prerenders all routes.
- Default `npm run build`: Turbopack fails on the environment's worker port
  binding restriction (`EPERM`), including the approved external retry. Package
  scripts remain unchanged; Webpack is the validated build path here.
- Browser: six routes × four viewport widths (1440, 768, 390, 320), with no
  horizontal overflow, broken HTML images, runtime errors or action-text overflow.
- Frame browser checks: nine styles × four counts × four widths (144 combinations),
  matching picker/preview geometry, independent color updates, sixteen real
  sticker sources and zero custom-frame asset requests.
- Print reaches Results, reduced motion disables animation, the skip link takes
  keyboard focus, and no camera or browser-print calls occur.
- All six route screenshots and four frame comparison sheets were visually
  reviewed; the five design-based pages were compared with their reference PNGs.

Milestone 1.5 stops here, pending review before Milestone 2.
