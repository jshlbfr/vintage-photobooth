# Vintage Photobooth

Milestone 1: a responsive visual foundation based on the five reference exports
in `references/figma/`. All photographs are local sample assets. The Figma page
screenshots are never loaded by the application.

## Local development

```bash
npm run dev
```

Open http://localhost:3000. If the environment blocks Turbopack's internal port
binding, use `npm run dev -- --webpack`.

## Review routes

| Route | Visual preview |
| --- | --- |
| `/` | Landing and replaceable vintage collage |
| `/camera` | Setup controls and sample portrait |
| `/capture` | Filter thumbnails, sample countdown, adaptive strip |
| `/customize` | Frame/color previews and sticker/text controls |
| `/print` | 1.8-second printing transition to Results |
| `/results` | Finished sample strip and action hierarchy |

Controls use **page-local demo state**. Setup values and customization do not
carry between routes yet. The photo-count selector on Capture demonstrates
1/2/4/6 layouts. Frame colors and frame styles can be previewed on Customize.
Links allow reviewing the screens; full session/navigation behavior belongs to
Milestone 2. Print and Results display a fixed decorated sample composition.

Capture, upload, sticker/text editing, download, GIF, Live Moment, and QR controls
are intentionally unavailable. There is no camera/microphone access, capture,
media export, storage, backend, session persistence, or advertising provider.
Print never invokes browser or physical printing. Reduced motion skips the
animation and shortens the transition.

## Architecture

- `app/globals.css`: design tokens, shared styles, and responsive reflow.
- `app/layout.tsx`: metadata and replaceable font variables. Poppins is the UI
  font; Playfair Display and Allura are temporary display/script fonts.
- `components/ui/`: shared controls, panels, and icons.
- `components/screens/`: presentation and page-local preview interactions.
- `components/photobooth/photo-strip.tsx`: the single SVG strip renderer used by
  Capture, Customize, Print, Results, and the sample collage.
- `lib/composition.ts`: count-aware strip geometry and centered cover-crop math,
  ready for a later rendering pipeline. No DOM screenshot export.
- `lib/design-data.ts`: frame colors/styles and eight original preview looks.
  CSS treatments are placeholders for later production filter processing.
- `components/artwork/`: replaceable original placeholder illustrations.
- `public/images/README.md`: sample photograph sources and licensing reference.

The `(booth)` layout leaves room for the later client session provider. A future
`app/share/[id]` route can be introduced separately from the private booth flow.

## Validation

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm run build
```

When Turbopack's port binding is unavailable: `npm run build -- --webpack`.
Google Fonts are downloaded at build time and then self-hosted by Next.js;
building requires access to Google Fonts. No application dependencies were added.

See `docs/milestone-1.md` for visual differences, asset needs, and later scope.
