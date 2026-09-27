# Vintage Photobooth

Milestone 2: one in-memory client session connects the photobooth flow, with
supplied Figma artwork and nine generated frame styles. All current captures
are explicitly sample images. See [the milestone report](docs/milestone-2.md).
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
| `/camera` | Setup controls and sample portrait |
| `/capture` | Filter thumbnails, sample countdown, adaptive strip |
| `/customize` | Frame/color previews and sticker/text controls |
| `/print` | 1.8-second printing transition to Results |
| `/results` | Finished sample strip and action hierarchy |

START creates a fresh session. Choose **1 / 2 / 4 / 6 photos only in Camera
Setup**, then Continue to prepare that many sample captures. Device, mirror,
timer, flash, filter, frame and color selections persist through client-side
navigation. Capture, Customize, Print and Results render the same composition.
Edit Again preserves everything; Take Another resets to defaults at Camera.

State lives in memory. Refreshing a later step or opening it directly without
an active capture set redirects to Camera Setup. Opening Camera directly
initializes defaults. Back links preserve the active session. Separate tabs
have separate sessions.

Capture, upload, sticker/text editing, download, GIF, Live Moment, and QR controls
are intentionally unavailable. There is no camera/microphone access, capture,
media export, persistent storage, backend, or advertising provider.
Print never invokes browser or physical printing. Reduced motion skips the
animation and shortens the transition.

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
- `lib/session/`: types, defaults, action union, pure reducer, one sample-capture
  factory and selectors. Future media is represented by lightweight references.
- `components/photobooth/photo-strip.tsx`: the single SVG strip renderer used by
  the picker, Capture, Customize, Print and Results.
- `lib/frame-templates.ts`: canonical logical-pixel geometry, nine generated
  templates, and the future asset-template contract with per-count variants.
- `lib/composition.ts`: shared presentation model and crop
  math for a later rendering pipeline. No DOM screenshot export.
- `lib/design-data.ts`: frame colors/styles and eight original preview looks.
  CSS treatments are placeholders for later production filter processing.
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
node --test tests/frame-templates.test.mjs tests/session.test.mjs
npm run build
```

When Turbopack's port binding is unavailable: `npm run build -- --webpack`.
Google Fonts are downloaded at build time and then self-hosted by Next.js;
building requires access to Google Fonts. No application dependencies were added.

Tests use native TypeScript stripping and a local import-resolution hook,
validated on Node 24. No test runner package was added. The earlier milestone
reports remain historical references; `docs/milestone-2.md` records current
behavior and validation.
