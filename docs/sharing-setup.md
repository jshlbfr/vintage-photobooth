# Temporary QR sharing setup

No Supabase project has been configured or modified by this milestone. The
application fails safely when configuration or the reward provider is missing.
All local outputs remain local; only the explicit Create QR action sends a PNG.

1. Create/select your Supabase project. Apply
   `supabase/migrations/202610010001_temporary_shares.sql` once using its SQL
   editor or your migration runner. Use a fresh dedicated `photobooth-shares`
   bucket; the migration makes it private and denies browser roles access. Then apply
   `supabase/migrations/202610080001_share_upload_limit.sql` to align its size cap
   with the Vercel function boundary. Do not rerun or rewrite the initial migration.
2. Copy `.env.example` to `.env.local`. Add `SUPABASE_URL` and your server-only
   service-role key. Set `SHARE_SIGNING_SECRET` and `CRON_SECRET` to independent
   cryptographically random secrets, each at least 32 characters. Set
   `SHARE_ORIGIN` to the exact application origin (no trailing slash). Never put
   these keys in a `NEXT_PUBLIC_` variable, source control or a client module.
3. For local reward testing only, set `REWARD_DEVELOPMENT=true` and open the app
   through `localhost` or `127.0.0.1`. For an isolated local production-build test,
   also set `REWARD_LOCAL_TEST=true`. Never set either flag in deployment. Vercel
   environment markers independently disable this adapter. Restart the Next server. The dialog labels
   the adapter as development and requires an explicit Complete action. A public
   production hostname refuses this adapter even if the variable is accidentally
   set. No real ad provider is included. A real provider must verify completion
   server-side and add its own verified receipt type to the access validator; merely opening an ad must never
   grant a receipt. Development receipts are explicitly rejected on public hosts,
   even if signing secrets were reused. Without a provider, production enhanced
   actions fail gracefully.
4. Configure a trusted scheduler to call `POST /api/shares/cleanup` every minute
   with `Authorization: Bearer <CRON_SECRET>`. GET is also supported for schedulers
   that require it. Do not put the secret in a query string. Monitor non-2xx
   responses and retry; the endpoint deletes at most 200 expired objects per run.
   The endpoint permits six calls per minute per instance; monitor batch backlog
   before changing scheduling. Preserve an existing Supabase Cron job and its
   Authorization header. Cron deployment
   is intentionally left to your hosting setup.
5. After deployment, verify normal browsing makes no Supabase/storage requests
   in the browser; one QR action uploads only a final PNG to `/api/shares`.
   Check a public link on another device and after ten minutes. A localhost URL
   is not reachable by another phone; deployment needs a reachable HTTPS origin.

## Expiry and security

The database creates the authoritative timestamps only after the object upload
succeeds: `expires_at = created_at + interval '10 minutes'`. Pending upload rows
are not readable and expire for cleanup. The checked constraint, server-only RPCs
and private bucket prevent a client from choosing TTL or storage paths.

Every image request goes through `/api/shares/[id]/image`. It checks the active
row before and after downloading bytes from private storage. Both this route and
the database deny at `now >= expires_at`; no signed storage URL, redirect, image
optimizer URL or cacheable public object URL is exposed. Responses use no-store,
nosniff and noindex headers. The share page also removes its image at expiry.
Previously downloaded/copied bytes cannot be recalled; expiry prevents new reads.

Both uploaded and re-encoded PNGs are limited to 4,000,000 bytes, below Vercel’s
4.5 MB function request/response ceiling. The UI rejects oversized QR files before
upload; the free local PNG remains full resolution. Existing oversized stored
objects cannot be served by the new route and expire normally. No direct-to-storage
upload bypass is introduced.

The service role bypasses RLS, so it is isolated in server-only modules. Anonymous
and authenticated browser roles receive no table/function privileges; a restrictive
storage policy protects this bucket even if unrelated permissive policies exist.
IDs contain 192 random bits. A signed 12-hour session receipt authorizes QR creation,
and a database advisory lock limits each receipt's session to three creations per
ten-minute window. No accounts, personal identity or IP addresses are stored.
Only an HMAC of the session ID is kept for that limit and is deleted with the row.

Uploads accept PNG only, stream-limit input to 4 MB, decode at no more than
8.1 MP, reject excessive dimensions/animated inputs and re-encode to discard
metadata. No arbitrary storage API is exposed. Failed upload/creation attempts
try immediate cleanup; remaining pending rows are recovered by scheduled cleanup.
Deletion removes the object first and metadata second so failed deletes retry.
Expiry does not depend on whether cleanup has run.

## Local automated verification

`tests/share-fixture.mjs` emulates the small Supabase HTTP contract on loopback
port 9006. It is test-only and is never used by application production code. Run
it alongside the production build using the fixture variables documented in
`docs/milestone-7.md`. The browser suite advances the fixture's backend clock,
verifies expired image/page denial while objects still exist, creates a new ID,
and exercises physical cleanup. No production TTL override exists.

These tests do not execute PostgreSQL or prove your deployed RLS/cron configuration.
After setup, verify the real SQL migration, bucket policies and scheduler in your
Supabase project. See [Supabase private storage access](https://supabase.com/docs/guides/storage/security/access-control)
for the service-role/RLS model. The application uses the isolated REST adapter in
`lib/sharing/supabase.ts`; no Supabase client SDK runs in the browser.

## M9 operational protection

The database quota remains three published/pending creations per session per ten
minutes, serialized by an advisory lock. In-process minute buckets additionally
limit creation attempts before PNG decoding (12 per owner, 60 total), image reads
(60 per ID, 240 total), share-page reads (60 per ID, 240 total), and authorized
cleanup calls (6 total). Buckets are bounded to 1,024 keys, store no IP addresses,
and expire after one minute. They reset on cold starts and are **not a distributed
abuse guarantee**. A quota failure returns 429 and Retry-After where applicable.
The public share page shows its normal unavailable state when its budget is spent.

Vercel provides platform DDoS mitigation. Review Firewall logs and, where the
project plan permits, configure endpoint-specific WAF limits before opening real
reward-backed sharing broadly. Do not cache successful private media responses to
reduce costs. A public bearer link intentionally permits anyone holding it to
retrieve the strip while active; it is not a recipient identity check.

PNG validation can verify a raster file, not prove that its pixels were created by
our editor. Authorization, byte/pixel limits, server-controlled paths and quotas
bound this capability. Only the final PNG is sent by the UI; all other media stays
local. Logs contain operation codes and aggregate failure counts, never payloads,
receipts, share IDs or credentials. Vercel access logs have platform retention
settings; review them separately.

Recreate SQL/storage from migrations, keep service credentials in server-only
production environment variables, and configure/verify the existing trusted cron.
No backup of expired photos is needed. If deletion is delayed, fix the scheduler
and retry: expiry enforcement already denies new reads. Check a real share before
and after ten minutes and inspect storage deletion before claiming live RLS/cron
verification. The local HTTP fixture does not execute PostgreSQL policies.
