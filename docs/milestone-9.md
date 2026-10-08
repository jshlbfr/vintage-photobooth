# Milestone 9 — content, security and launch readiness

Operator: **The Vintage Photobooth** · **the.vintage.pb@gmail.com**  
Canonical site: https://thevintagebooth.vercel.app  
Implementation baseline: `bf8231e` (M8). Phase 1 was read-only and implementation
began after explicit approval. No Google account actions or review submissions.

## Architecture decisions

The existing root verification metadata remains `ca-pub-1193568598392219`.
`ContentAds` uses the existing unmodified Google loader only on `/`,
`/how-it-works`, `/features` and `/faq`. The account decides actual ad delivery;
source eligibility is not a claim of Google approval. Legal pages, utility routes,
share pages, errors and default 404 have no advertising loader.

All content navigation uses native links. Starting the booth, leaving setup for
home, and leaving a public share for home create new documents. Navigation inside
the booth remains client-side, retaining the current local session. This deliberate
boundary prevents already-executed ad code persisting into camera screens; simply
unmounting a Script component would not do that. Browser back/forward transitions
are tested with a locally intercepted loader, never real ad impressions or clicks.

Google CMP remains attached to the existing Google integration on eligible pages.
No substitute banner, invented CMP API, ad unit or production reward provider was
introduced. Account-side Auto Ads page exclusions are recommended as additional
protection, including exact booth paths and the entire `/share/` section. Verify
Google's consent message and privacy links in applicable regions before re-review.
Legal pages are intentionally ad-free. No filler `/about` page was added because
the landing, feature and how-it-works pages already explain the product.

## Completion report

1. **Summary:** Original publisher content, scoped advertising, SEO files, legal
   pages, targeted dependency patches and API hardening, preserving M8 media flow.
2. **Added files:** `app/{how-it-works,features,faq,privacy,terms}/page.tsx`,
   `app/robots.ts`, `app/sitemap.ts`, `public/ads.txt`,
   `components/content/{site-chrome,content-ads}.tsx`, `lib/site.ts`,
   `lib/site-faq.ts`, `lib/sharing/{http,burst-limit}.ts`,
   `supabase/migrations/202610080001_share_upload_limit.sql`,
   `.github/workflows/validate.yml`, `tests/milestone9.test.mjs`,
   `tests/milestone9-http.mjs`, `tests/browser-milestone9.mjs`, this report.
3. **Modified files:** root layout/landing/CSS, booth layout, share page, four API
   route modules, sharing access/policy/upload/Supabase adapter, QR dialog,
   StartSessionLink/BackLink, Next configuration, package manifest/lock,
   `.env.example`, README, sharing setup, M7/M8 browser test readiness waits, M8 reproduction notes and share HTTP test.
4. **Rejection remediation:** useful visible content replaces the hero-only public
   experience; global ad-serving is removed from application/error screens.
   Google approval cannot be guaranteed.
5. **Content:** six public pages including the expanded landing; 27 useful FAQs,
   actual photo counts/timers/filters, editor limits and enhanced-provider availability.
6. **Ad-free routes:** `/camera`, `/capture`, `/customize`, `/print`, `/results`,
   `/share/*`, `/privacy`, `/terms`, API responses, invalid-session screens and 404.
7. **Verification/serving:** global verification metadata is separate from the
   page-scoped serving component and new-document application entry.
8. **ads.txt:** exact seller line for `pub-1193568598392219`, plain text at root.
9. **robots:** public content allowed; `/api/` excluded. Share pages remain crawlable
   so their noindex directives can be read; robots exclusions are not authorization.
10. **Sitemap:** only the six canonical publisher/legal pages. No ephemeral IDs,
    utility routes or fabricated last-modified dates.
11. **SEO:** unique titles/descriptions/canonicals/Open Graph metadata, one logical
    H1 per page, semantic sections. Booth and share pages carry noindex metadata.
12. **Privacy:** accurate local-memory behavior, optional permissions, explicit
    PNG sharing, expiry vs physical deletion, platform logs, Google/CMP and contact.
13. **Terms:** authorized use, content responsibility, prohibited abuse, IP,
    availability, temporary sharing and limitations without fabricated company facts.
14. **Navigation:** responsive content header/footer, working native CTAs; capture,
    editor and print remain free of content navigation clutter.
15. **Security:** deployment-aware development reward denial; bounded request
    parsing; safe cleanup comparison; explicit origin; typed errors; burst controls.
16. **RLS:** source SQL enables RLS, revokes browser/public table and RPC privileges,
    grants service-role operations and pins function search paths. Live policies
    remain unverified; no service-role credentials were used against real Supabase.
17. **Storage:** private PNG-only bucket, server-controlled random paths, restrictive
    browser-role policy, before/after-download expiry checks, additive 4 MB migration.
18. **Rate limits:** distributed database quota remains 3 creations/session/10min.
    Bounded per-instance minute buckets protect validation, reads and cleanup;
    they reset on cold starts. Platform/WAF settings require operational review.
19. **Input:** streamed 512-byte JSON cap, exact object/session validation, malformed
    request rejection, 4 MB PNG input/output caps, pixel/dimension limits and re-encoding.
    A valid raster's editorial provenance cannot be proven server-side.
20. **Headers:** nosniff, no-referrer, same-origin camera/microphone, frame denial,
    enforced object/base/form restrictions and staged resource CSP in report-only.
    Vercel supplies HTTPS/HSTS. Static content remains cacheable.
21. **Secrets:** server-only imports and no NEXT_PUBLIC secrets. Existing environment
    files were untouched; only `.env.example` is tracked. Built client chunks were
    scanned for the configured service/signing/cron values without printing them.
22. **Dependencies:** sharp 0.35.4 → 0.35.5; source-map-js 1.2.1 → 1.2.2;
    Next.js and eslint-config-next 16.3.6 → 16.3.8 (security patch).
    Production audit: zero advisories. Full audit: five high package entries from
    one unpatched dev-only braces issue in the Next ESLint chain. The suggested
    downgrade to eslint-config-next 14 is incompatible with the current stack and
    was not applied. No runtime feature accepts untrusted glob patterns.
23. **Errors/logging:** allowlisted messages and generic unexpected failures;
    server logs only operation codes/aggregate failure counts. No media, receipts,
    share IDs, arbitrary exception text or credentials are logged by these handlers.
24. **Caching:** content/static assets retain normal Next/Vercel caching; temporary
    pages/images are private/no-store, no image optimizer or signed-storage redirects.
25. **Scaling:** normal media stays browser-local; 4 MB payload and 8.1 MP decode
    limits bound server image work. No new accounts, Redis, load balancer or vendor.
26. **Availability/recovery:** free PNG is independent of reward/Supabase availability;
    denied microphone permits silent motion. Expiry works before cleanup runs.
    Preserve the existing protected Supabase Cron POST/GET contract and retry deletion.
27. **Tests:** see validation results below. Fixtures do not prove deployed PostgreSQL
    policies, hardware-browser support, or Google consent/ad delivery.
28. **Lint:** clean after implementation.
29. **TypeScript:** separate no-emit check and build type checking passed.
30. **Build:** optimized Webpack production build passed; default Turbopack hit this
    environment's worker-port restriction, including on retry. CI uses the verified
    Webpack path; no Next major version change.
31. **Production verification:** see deployment results below. Local verification
    must not be represented as a deployed or account-level verification.
32. **Remaining risks:** regional CMP/Auto Ads settings, live RLS/storage/cron,
    platform abuse configuration, physical mobile/media QA, and the dev-only advisory.
33. **Manual steps:** verify deployment, Google account settings/consent and ads.txt
    detection, apply the additive storage migration and verify existing cron, review
    platform logs/WAF, test physical devices, then manually request AdSense review.

## Security headers and CSP rollout

Enforced today: `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`,
`form-action 'self'`. These reduce embedding/object risks without breaking media
or Google's integrations. The resource allowlist is **report-only**, not an XSS
prevention guarantee. It permits self-hosted code/fonts, blob media/workers,
data/blob images and Google ad/CMP resource families. Inline scripts/styles are
observed as allowed because static Next hydration and current UI styles use them;
no production unsafe-eval is added. Supabase is server-only and needs no browser
connect exception. Browser console reports, not a new telemetry collector, are
used for the initial review. Validate regional CMP and ad requests, narrow origins
where possible, then assess hashes/nonces and enforced script policy. Nonces would
require dynamic rendering; do not discard static caching without that tradeoff.

Google resource families currently observed in policy: googlesyndication.com
(ad loader/content), doubleclick.net (ad frames/requests), google.com (including
fundingchoicesmessages CMP), gstatic.com (Google assets), googleadservices.com
(ad requests). These allowances do not bypass consent and are not proof of all
regional resource requirements. Report-only policy cannot block those features.

## Reproduction

Use Node 24. `npm ci`, `npm run lint`, `npm test`,
`npm run build -- --webpack`, `npm run typecheck`, `npm audit --omit=dev`.
Start `node tests/share-fixture.mjs` on port 9006, then the local build with isolated
fixture variables from the M8 reproduction and **REWARD_LOCAL_TEST=true** on port
3004. Never use production service credentials for these tests.
Run `node tests/milestone9-http.mjs`,
`PHOTOBOOTH_URL=http://127.0.0.1:3004 node tests/share-http.mjs`, and
`CHROMIUM_PATH=/path/to/chromium node tests/browser-milestone9.mjs`.
Existing M8 camera/video checks use `tests/browser-milestone8.mjs`.

## Validation results

- 103 unit tests passed, including eight new security tests.
- HTTP checks passed for six content routes, utility/error ad exclusions, metadata,
  security headers, ads.txt, robots, sitemap and private share caching.
- QR HTTP fixture checks passed for origin/receipt authorization, PNG validation,
  10-minute expiry, old-link denial, fresh IDs, quota 429, cleanup and backend outage.
- M9 synthetic Chromium: 24 layout checks at 320/390/768/1440 px, no horizontal
  overflow or runtime exceptions; no permissions on content; ad marker absent
  after entering the booth and through back/forward navigation. Google requests
  were locally intercepted, not sent to the advertising network.
- 45 built browser JavaScript chunks contained no configured secret values.
- All previously tracked public assets remain byte-for-byte unchanged.
- M8 browser regression passed: 84 viewport checks, all five illustrated frames,
  PNG and nine video exports, audio preservation, full-screen flashes, manual mode,
  continuous 4/8/10/12-photo runs and the 10-second × 12 recording. The latter used
  one approximately 11.98 MB source. Capture/media/render/editor implementation
  files were unchanged. The separate long-full-video stress variant was not rerun.
- M7 browser regression passed: 49 viewport checks, reward cancellation/failure/
  completion, synchronized mixed slots, full video audio, twelve-slot export,
  explicit QR creation, expiry/renewal and simulated backend outage. Its expected
  503 network entry is the deliberate outage test, not an unexpected runtime error.
- Initial M7/M8 runs exposed an asynchronous microphone-readiness assumption in
  the browser harness. Both now wait for a live audio track before testing an
  audio-enabled recording. Reruns passed without changing application media code.
- iOS Safari, Android Chrome, physical camera/microphone hardware and regional
  Google CMP behavior were not exercised. Emulated widths do not establish them.

## Final audits

**AdSense:** Publisher pages are substantial, original and product-specific.
Verification is preserved, ad code is scoped, native navigation isolates utility
screens, ads.txt is exact, legal pages/contact/navigation are present, and all six
canonical pages render successfully in the local production build. Account settings,
actual serving and regional CMP remain manual checks; no approval is promised.

**Security:** New negative-input tests and local HTTP tests cover authorization,
expiry and upload boundaries. Source RLS/storage guarantees remain unchanged,
secrets are server-only and absent from browser bundles, cleanup fails safely,
production dependency advisories are patched, and error logging is redacted.
Per-instance limits and report-only resource CSP are explicitly limited controls.
Live database/storage/cron verification is still required for production sharing.

**Production:** Build, typing, lint, unit/API/browser regressions passed. Static
caching remains available, local media processing is preserved and optional
backend failures retain free output. A minimal CI workflow and reproducible
migration/setup instructions are supplied. Deployment verification follows below.

## Deployment results

Implementation commit: `a416870`. The earlier GitHub internal-server push failures
were transient. On 9 October 2026 (Asia/Manila), `5950098` pushed successfully and
Vercel reported its deployment successful. Public HTTP checks passed for all six
content pages, canonical metadata, advertising eligibility, security headers,
ads.txt, robots, sitemap and no-store share responses.

The expanded M9 Chromium suite also passed against the public site: 24 responsive
layout checks, ad-script isolation through history navigation, synthetic camera
capture, text editing, Print animation, Results and free PNG download. Microphone
remained optional, and the production reward dialog correctly reported unavailable.
Google advertising requests were intercepted locally, so this does not establish
real ad delivery or regional CMP behavior. No user media or QR files were uploaded.

The first remote GitHub Actions run passed installation, lint and all 103 tests,
then failed its production dependency audit. A refreshed registry audit identified
Next.js advisories not returned by the prior audit. The fix updates Next.js and its
ESLint configuration to the patched 16.3.8 release; it does not disable the audit or
upgrade to a different minor line. The production audit, lint, all 103 tests and
production build passed again locally. The remaining five full-audit entries are
the documented dev-only braces chain. Check the newest GitHub Actions run for the
remote result after this patch. No Google account settings or live Supabase
configuration were changed.

## Production readiness matrix

| Area | Status | Evidence / remaining step |
| --- | --- | --- |
| Authentication | N/A | No account feature |
| Authorization | Implemented | Signed receipt/origin; protected cron; dev denial |
| RLS | Needs Attention | Source reviewed; deployed policies unverified |
| Rate Limiting | Implemented | DB quota + bounded bursts; review platform WAF |
| Secret Management | Implemented | Server-only; bundle scan; production env still operator-owned |
| Upload Security | Implemented | PNG decode, byte/pixel limits, controlled storage paths |
| Security Headers | Implemented | Enforced baseline; resource CSP staged |
| Hosting | Platform | Vercel HTTPS/HSTS |
| Deployment | Platform | M9 deployed; public HTTP and synthetic free-flow checks passed |
| CI/CD | Implemented | Audit gate retained; Next security patch addresses initial failure |
| CDN | Platform | Static Vercel caching preserved |
| Caching | Implemented | Temporary media no-store |
| Scaling | Platform | Local processing plus bounded server work |
| Logging | Implemented | Sanitized operation codes; review platform retention |
| Error Handling | Implemented | Generic unexpected errors, explicit quotas |
| Recovery | Needs Attention | Verify deployed SQL/private storage/cron and monitor retries |
| AdSense Content Compliance | Needs Attention | Code/content complete; Google review is manual |
| Ads.txt | Implemented | Exact publisher entry; confirm deployed detection |
| Privacy | Implemented | Accurate page and supplied operator/contact |
| SEO/Crawlability | Implemented | Six canonical pages; utilities/share noindex |

**M9 SECURITY READINESS: NOT READY** for a verified production-sharing launch until
live RLS/private bucket/cron and deployment configuration are checked. The optional
reward-backed service remains unavailable in production, protecting the free flow.

**M9 ADSENSE SITE READINESS: NOT READY** until configured Google CMP behavior
and account-side advertising settings/exclusions are verified. Public routes,
ads.txt and document-level ad isolation have passed deployment checks.
No automated re-review will be submitted. These are verification blockers, not a
claim that Google will approve once they are completed.

## Sources checked during M9

- [Google publisher-content policy](https://support.google.com/publisherpolicies/answer/11112688)
- [Google verification methods](https://support.google.com/adsense/answer/7584263)
- [Google Auto Ads page exclusions](https://support.google.com/adsense/answer/9262311)
- [Google CMP](https://support.google.com/adsense/answer/16918505)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
- [sharp advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)
- [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
- [dev-only braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)

- [Next.js 16.3.8 security release](https://github.com/vercel/next.js/releases/tag/v16.3.8)
