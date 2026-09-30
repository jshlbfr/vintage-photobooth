# Temporary QR sharing setup

No Supabase project has been configured or modified by this milestone. The
application fails safely when configuration or the reward provider is missing.
All local outputs remain local; only the explicit Create QR action sends a PNG.

1. Create/select your Supabase project. Apply
   `supabase/migrations/202610010001_temporary_shares.sql` once using its SQL
   editor or your migration runner. Use a fresh dedicated `photobooth-shares`
   bucket; the migration makes it private and denies browser roles access.
2. Copy `.env.example` to `.env.local`. Add `SUPABASE_URL` and your server-only
   service-role key. Set `SHARE_SIGNING_SECRET` and `CRON_SECRET` to independent
   cryptographically random secrets, each at least 32 characters. Set
   `SHARE_ORIGIN` to the exact application origin (no trailing slash). Never put
   these keys in a `NEXT_PUBLIC_` variable, source control or a client module.
3. For local reward testing only, set `REWARD_DEVELOPMENT=true` and open the app
   through `localhost` or `127.0.0.1`. Restart the Next server. The dialog labels
   the adapter as development and requires an explicit Complete action. A public
   production hostname refuses this adapter even if the variable is accidentally
   set. No real ad provider is included. A real provider must verify completion
   server-side before calling the receipt issuer; merely opening an ad must never
   grant a receipt. Without a provider, production enhanced actions fail gracefully.
4. Configure a trusted scheduler to call `POST /api/shares/cleanup` every minute
   with `Authorization: Bearer <CRON_SECRET>`. GET is also supported for schedulers
   that require it. Do not put the secret in a query string. Monitor non-2xx
   responses and retry; the endpoint deletes at most 200 expired objects per run.
   Use more frequent runs/batches if traffic exceeds that rate. Cron deployment
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

The service role bypasses RLS, so it is isolated in server-only modules. Anonymous
and authenticated browser roles receive no table/function privileges; a restrictive
storage policy protects this bucket even if unrelated permissive policies exist.
IDs contain 192 random bits. A signed 12-hour session receipt authorizes QR creation,
and a database advisory lock limits each receipt's session to three creations per
ten-minute window. No accounts, personal identity or IP addresses are stored.
Only an HMAC of the session ID is kept for that limit and is deleted with the row.

Uploads accept PNG only, stream-limit input to 12 MiB, decode at no more than
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
