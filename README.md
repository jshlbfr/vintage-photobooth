# The Vintage Photobooth 📸

**A little nostalgia. A memory to keep.**

The Vintage Booth is a browser-based photobooth that brings the nostalgic experience of classic photo booths into a modern, interactive web application. Users can capture moments, customize photo strips, apply vintage-inspired filters, and create digital keepsakes directly from their browser.

Built as a personal full-stack development project, The Vintage Booth explores the intersection of creative web experiences, browser media technologies, user-centered design, and sustainable web monetization.

**Live Website:** https://thevintagebooth.vercel.app

---

## Overview

The Vintage Booth aims to recreate the charm of traditional photobooths while making the experience accessible through modern web browsers.

Instead of requiring a physical booth, dedicated software, or an account, users can capture and personalize their memories through an intuitive, vintage-inspired interface.

The project also serves as an exploration of building and operating an independent web product, including frontend development, media processing, backend services, privacy, deployment, performance, and potential advertising-based monetization.

## Features

### Photo Capture
- Browser-based camera integration
- Configurable countdown timers
- Multiple photo-strip layouts and photo counts
- Mirror and camera controls
- Optional capture sounds and flash effects
- Continuous and manual capture options

### Photo Customization
- Vintage-inspired photo filters
- Multiple frame styles and colors
- Decorative stickers and text
- Individual photo positioning and cropping
- High-resolution photo-strip generation
- Undo and redo editing controls

### Live Moments
- **Live Moment:** Records motion during the photo countdown.
- **Live Strip:** Combines moving moments into an animated photo-strip composition.
- **Full Live Moment:** Preserves the capture session as a continuous video.
- Optional microphone audio for supported recordings.

### Digital Keepsakes
- Downloadable photo strips
- Animated GIF generation
- Live Moment video exports
- Print-inspired photo reveal
- Temporary QR-code sharing

Some enhanced output features are designed around a future rewarded-ad experience and may be unavailable until the advertising integration is enabled.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and routing |
| React | Interactive user interfaces |
| TypeScript | Type-safe application development |
| Tailwind CSS | Styling and responsive layouts |
| HTML Canvas | Image composition, filters, and export |
| MediaDevices API | Browser camera and microphone access |
| MediaRecorder API | Live Moment recording |
| Web Audio API | Countdown and capture sounds |
| Supabase | Temporary sharing and backend storage |
| Vercel | Hosting and deployment |
| Git & GitHub | Version control and development workflow |

## How It Works

1. **Set Up** — Choose your camera preferences, timer, and photo-strip layout.
2. **Capture** — Take photos using the interactive countdown experience.
3. **Customize** — Apply filters, choose frames, reposition photos, and add stickers or text.
4. **Print** — Enjoy a digital photo-strip reveal inspired by traditional photobooths.
5. **Keep Your Memories** — Download your strip or explore additional digital formats.

## Privacy-First Approach

The Vintage Booth is designed around local-first media processing.

Photos, videos, and audio are primarily processed within the user's browser rather than being automatically uploaded to a server.

Temporary QR sharing is an explicit exception: when initiated, the final photo-strip image is uploaded for short-term access, with sharing links designed to expire after **10 minutes**.

Camera and microphone access are controlled through browser permissions, and microphone access is optional.

The project aims to minimize unnecessary collection and retention of personal media.

## Monetization Exploration — Google AdSense

Beyond its creative functionality, The Vintage Booth is also an exploration of how an independently developed web application could become a sustainable, advertising-supported product.

The long-term goal is to keep the core photobooth experience free while exploring monetization approaches that do not unnecessarily interrupt the user experience.

### Google AdSense

The project is exploring **Google AdSense** for potential advertising revenue, including the technical and policy considerations involved in monetizing an interactive web application.

This exploration includes:

- AdSense website verification and approval requirements
- Google Publisher Policies and content quality
- Separation of informational content from interactive application screens
- Appropriate display-ad placement
- Ads.txt configuration
- Privacy disclosures and consent management
- Performance and user-experience considerations

### Rewarded Advertising

The project also explores a future rewarded-ad model for optional enhanced features, such as GIF creation, Live Strip exports, Full Live Moment exports, and temporary QR sharing.

The intended model allows users to access the basic photo-strip download for free while optionally unlocking additional experiences through a supported rewarded-ad integration.

Google Ad Manager is being considered for this functionality.

**Advertising integration is experimental and subject to platform eligibility, policy compliance, technical feasibility, and approval.** The project does not claim an active advertising partnership, approved monetization status, or guaranteed advertising revenue.

## Design Philosophy

The interface takes inspiration from classic analog photography, film aesthetics, and traditional photobooths, interpreted through modern web design.

The design emphasizes:

- Vintage character with a premium, minimalist presentation
- Simple and approachable interactions
- Playful details without unnecessary visual clutter
- Responsive layouts across devices
- A seamless experience from capture to final keepsake

## Development & Deployment

The project is developed using Git and GitHub, with Vercel providing web hosting and deployment infrastructure.

Development focuses on maintaining a stable production experience while improving the application through iterative feature development, testing, performance optimization, and security reviews.

## Project Goals

The Vintage Booth was created to explore several areas of software development:

- Building a complete interactive web product
- Working with browser camera, microphone, and media APIs
- Implementing custom image-processing and composition systems
- Designing intuitive editing interactions
- Handling temporary media securely
- Developing privacy-conscious application architecture
- Learning production deployment and maintenance workflows
- Exploring Google AdSense and rewarded advertising as potential monetization strategies

## Project Status

**Active Development — Public Web Application**

The core photobooth experience has been developed, with continued work focused on user-experience improvements, browser compatibility, security, performance, and monetization readiness.

Features and availability may change as the project evolves.

---

## Author

**Joshua Albufera**

Personal project exploring creative web development, interactive media, UI/UX design, and independent digital products.

---

*Made for moments worth keeping.*

---

Note: Google AdSense approval has not yet been obtained, and the website is not currently generating revenue through AdSense. Monetization remains an ongoing exploration rather than an established feature.

## Milestone 9.5 — photo adjustments and controlled releases

Each photo can be selected, dragged and zoomed independently in Customize. Reset
Photo affects only that slot; Undo/Redo includes completed photo gestures. The
shared crop geometry follows the composition into PNG, GIF and Live Strip, while
Full Live Moment keeps its continuous chronological recording. Camera originals
retain the complete video frame; edits never replace them with preview crops.

Work on `milestone-9-5` or a feature branch. See
[the controlled release workflow](docs/release-workflow.md) for Preview isolation,
manual production promotion, environment separation and rollback. Production
account settings must be reviewed and configured by the operator before a merge
can be treated as a staged release.

The focused browser suite uses synthetic devices and local fixture configuration:

```bash
CHROMIUM_PATH=/path/to/chromium node tests/browser-milestone95.mjs
```

See [the M9.5 report](docs/milestone-9.5.md) for verification and remaining manual steps.
