# Controlled Preview and production releases

M9.5 work uses `milestone-9-5`. The implementation audit baseline was `2fd720c`
on `main`; subsequent manual README changes through `091531f` are preserved.
This baseline is historical, not a claim about the currently served production
deployment. Routine progress must never be pushed directly to `main`.

## Progress and Preview

1. Work on `milestone-9-5` (later work may use `feature/<name>`). Push that branch.
2. GitHub validation runs lint, tests, production dependency audit, build and
   type checking on branch pushes and pull requests. Vercel's Git integration
   should classify this non-production branch as Preview. Verify its Environment
   label and the currently served production deployment before relying on this.
3. Review the exact Preview commit and its test results. Keep Preview deployment
   protection enabled where available. Preview responses carry noindex headers
   and metadata; robots disallows crawling. Publisher advertising is suppressed.
4. Do not use `vercel --prod`, merge to `main`, alter production branch tracking,
   or promote a deployment as part of a progress push.

## Environment separation

- Keep Supabase service keys, signing secrets and cron secrets server-only.
- Scope production values to Production in Vercel. Do not copy production secrets
  into Preview or GitHub validation. Use a separate test Supabase project if
  remote sharing tests become necessary, with separate signing/cron secrets and
  an exact Preview `SHARE_ORIGIN`. Otherwise leave Preview sharing unconfigured.
- Keep `REWARD_DEVELOPMENT=false` and `REWARD_LOCAL_TEST=false` in both deployed
  environments. Existing server checks deny the local reward adapter on Vercel
  regardless. Enhanced features can be tested locally with the documented fixture;
  this milestone does not add a remotely accessible reward bypass.
- Preserve the Production canonical origin and Google account verification. Do not
  serve real advertisements in Preview or use Preview to submit an AdSense review.
- Do not run production cleanup jobs from Preview. QR expiry remains server-owned
  and exactly ten minutes; deployment does not change the database contract.

## One-time operator review and configuration

These are manual account settings, not changes made by this repository:

1. Confirm Vercel's Production Branch is `main` and feature branches use Preview.
2. Review and then disable **Auto-assign Custom Production Domains** under
   Settings → Environments → Production → Branch Tracking. Verify that the
   currently served deployment remains unchanged. Test the setting before merging
   feature work. Without this setting, a main push can publish automatically.
3. In GitHub, protect `main`: require a pull request and the Validate `checks` job,
   prevent force pushes/deletion, and require review where the account permits it.
   Restrict bypass and Vercel promotion permissions to the operator.
4. Review environment scopes and Preview access protection. A repository workflow
   alone cannot enforce settings or permissions owned by Vercel/GitHub.

## Release an approved commit

1. The operator approves a specific feature commit after Preview acceptance.
2. Merge the reviewed pull request to protected `main`. With auto-assignment
   disabled, Vercel builds a **staged Production** deployment using Production
   variables without assigning the public domain.
3. Confirm its SHA, successful checks/build, environment and smoke tests. Secrets
   remain server-only, local rewards stay disabled, ads stay outside booth pages,
   and the free photo flow must work.
4. The operator explicitly selects **Promote** for that staged deployment. Record
   the deployment ID, SHA, previous known-good deployment and release date.
5. Check the public domain and free flow after promotion.

Promoting a Preview directly rebuilds with Production environment variables; it
is not a byte-identical promotion of the tested Preview. Prefer the staged
Production flow above, and test its build before assigning the public domain.

## Rollback

Use Vercel Instant Rollback to reassign production to the recorded previous
production deployment. This does not rebuild or roll back database changes or
environment configuration. Follow with a normal reviewed Git revert if needed;
never reset or force-push shared history. M9.5 introduces no database migration.

References: [Vercel promotion and staging](https://vercel.com/docs/deployments/promoting-a-deployment),
[environments](https://vercel.com/docs/deployments/environments).

The earlier standalone M9.5 workflow specification was not supplied. This file
implements the audit's approved proposal; account configuration and production
promotion remain explicit operator steps.
