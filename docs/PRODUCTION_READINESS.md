# Production readiness — what's done, what's left

Tracks the audit remediation across two passes. Code-level fixes have been
shipped; the items below require dashboard / DNS / legal action that only the
owners of those systems can take.

## Done in code (already deployed)

### Payment + inventory integrity
- Webhook coupon redemption + payment_intent cross-check now run before the
  200 response (prevents partial-state on crash and rejects metadata mismatches).
- All refund paths (admin + Stripe-Dashboard webhook) call `release_tickets`
  RPC instead of raw `quantity_sold` writes.
- `charge.refunded` webhook supports partial refunds: `amount_refunded_cents`
  is the source of truth; status flips to `refunded` only when the cumulative
  amount reaches `total_cents`.
- Door-sale ticket-insert failure rolls back order + releases inventory.
- Tier deletion uses atomic `DELETE … WHERE quantity_sold = 0` to close the
  read-then-delete race window.
- Order status transition trigger blocks illegal moves (cancelled→paid,
  comped→paid, refunded→paid).

### Cron + observability
- Single `isAuthorisedCronRequest` helper in `@dbc/supabase`. Fail-secure:
  every cron rejects when `CRON_SECRET` is unset (was: silent any-anon
  allowed on 5 of 9 endpoints).
- `release-reservations` cron now `*/5 * * * *` (was once daily).
- Email-sequences cron HTML-escapes all interpolations (XSS hardening) and
  only stamps `sent_at` when ALL recipients succeeded.
- New `/api/health` endpoint on tickets, admin, site (for external uptime
  monitor). `?deep=1` checks Supabase reachability.
- New `/api/webhooks/resend` (Svix-signed) marks contacts as `bounced` /
  `complained` so we stop emailing dead addresses.

### Compliance + GDPR
- Newsletter signup (full + footer forms) now requires explicit GDPR consent
  checkbox before submit; localised in en/de/fr; server action rejects when
  unchecked.
- `marketing_consent_token` has a 48-hour TTL; expired tokens reject confirm.
- DB-backed rate limits on newsletter and contact form (`abuse_events`
  table) survive Vercel cold starts.
- Checkout form requires explicit German Widerrufsrecht waiver
  (BGB §312g/§355) checkbox before payment. Persisted on
  `orders.revocation_waived` + `orders.revocation_waived_at` for refund-
  dispute audit.
- Admin login fully localised (was hardcoded English on /de + /fr).
- Robots disallow on tickets sensitive routes (confirmation/orders/transfer/
  checkout); preview deployments fully no-indexed via `X-Robots-Tag` middleware.
- Turnstile fail-secure in production (was: silent bypass when secret unset).

### Operator UX (Tier 3)
- All native `window.confirm()` destructive-action prompts on admin
  migrated to `<ConfirmDialog>` from `@dbc/ui`: ads, app-secrets,
  GDPR-delete (settings), schedule rows, runsheet rows, media rows,
  checklist (delete + populate-defaults), budget expenses, ticket tiers,
  orders refund + resend. Branded, keyboard-accessible, locale-aware
  labels.
- Orders list now paginated (50/page) with stable URL `?page=N`.
- Loading skeletons on dashboard + order list (no flash of empty state).
- Newsletter composer shows inline subject + body preview pane while
  drafting (visual sanity check; pixel-rendering still verified via
  the existing "Send test" path).
- Server logs in Stripe webhook + send-tickets path no longer print
  buyer email; only stable IDs (`order_id`, `ticket_id`). Sentry still
  receives the structured event with PII-scrubbed context.

### Schema + types
- Migration `20260503000002_production_hardening.sql` applied to live
  Supabase: `amount_refunded_cents`, `revocation_waived`, `email_status`
  enum, `abuse_events` table, order-status transition trigger.
- `packages/types/src/database.ts` regenerated.

---

## What you still need to do (out of code's reach)

### 1. ✅ DONE — Resend domain verification

Status: **✅ verified as of 2026-05-02**. Confirmed via Resend API
(`status: verified, sending: enabled`) and direct DNS query — DKIM TXT,
SPF MX, and SPF TXT records are all live in Strato's DNS for
`dbc-germany.com`. Smoke-test email queued successfully (id
`67b8a618-429b-428a-a7c3-8955105b23f1`).

The "unverified" note in the 2026-04-16 credentials snapshot was stale;
the records were already in place. Nothing to do here.

### 2. ✅ DONE — Sentry error tracking

Three Sentry projects live under org `dbc-germany` (EU region
`de.sentry.io`): `dbc-admin`, `dbc-tickets`, `dbc-site`. Wired via
`@sentry/nextjs` + the shared `@dbc/observability` package — server,
edge, and client runtimes all initialised, PII scrubbing on
`beforeSend`, releases auto-tagged with `VERCEL_GIT_COMMIT_SHA`. Wired
in commit `bf020f9`.

### 3. ✅ DONE — Stripe Tax + Tax ID (live)

`tax_id_provided: true` confirmed via `GET /v1/account` on 2026-05-03.
Stripe Tax enabled for DE with `head_office` set, `tax_behavior:
inclusive`. SEPA Debit and PayPal capabilities both `active` on the
live account — the capability detector at
`apps/tickets/src/lib/stripe-capabilities.ts` lights them up in
checkout automatically.

### 4. ✅ DONE — Resend webhook → app

Endpoint `https://tickets.dbc-germany.com/api/webhooks/resend` is
registered with Resend (webhook id `2145f0f8-de92-48c1-b32a-eb3e1700ce5e`)
subscribed to `email.bounced` + `email.complained`.
`RESEND_WEBHOOK_SECRET` set on the tickets Vercel project (Production
+ Preview). Bounces flip `contacts.email_status='bounced'` so we stop
emailing dead addresses. Wired in commit `6c05e5b`.

### 5. HIGH — German Impressum + Privacy Policy review (legal, not code)

Code-side: Impressum data fields are wired and rendered (commit
`6c05e5b`), Widerrufsrecht waiver is enforced on checkout, privacy
policy + ToS scaffolds live in `packages/legal/src/`. **Still
pending**: a German-admitted Rechtsanwalt review of the privacy/ToS
text. Tracked on the pre-launch checklist as a BLOCKER. Out of code's
reach — needs counsel sign-off.

### 6. ✅ DONE — Uptime monitor (Better Stack)

Three monitors provisioned under Better Stack: tickets `4356310`,
admin `4356311`, site `4356312` — all hitting `/api/health` at the
documented frequencies. Public status page `245884` published at
https://dbc-germany.betteruptime.com. Custom CNAME
`status.dbc-germany.com` configured (TLS provisioning was last
checked completing).

### 7. ✅ DONE — Load test runner + baseline

k6 runner at `scripts/load-test/` checked into the repo (commit
`fbd09a0`); baseline numbers recorded in `docs/LOAD_TEST_RESULTS.md`.
Re-run before launch is on the pre-launch checklist (T-14 days), but
the tooling and baseline exist.

### 8. ✅ DONE (mostly) — On-call + runbook

`docs/RUNBOOK.md` covers all 8 incident playbooks (Stripe webhook
failure, /api/health failing, inventory drift, bounces/complaint
storm, customer-charged-no-ticket, coupon over-redemption, Vercel
deploy failed, Supabase outage). Communication templates included.
**Open item**: the on-call rotation table at the top of `RUNBOOK.md`
still has `_TBD_` placeholders for primary/escalation/owner-of-last-
resort phone + Slack — that needs a human decision, not a code change.

---

## Code-only items still in the backlog (not blocking launch)

- Per-section error boundaries on admin (the locale-level boundary catches
  everything; section-level is polish).
- Bulk CSV import per-row error reporting (currently the importer
  rolls back the whole batch on any single bad row).
- `/api/dev/qa-tier`: hardened with dual-gate; production env-var
  pruning (delete `ALLOW_QA_TIER` + `QA_TIER_ADMIN_TOKEN` post-
  acceptance test) is on the T-7-day checklist.

Already done in earlier passes (kept here for the audit trail):
- ✅ Sponsors edit UI (commit `b59d5fa`)
- ✅ Per-tier revenue breakdown on admin dashboard (commit `ec51414`)
- ✅ Sentry instrumentation (commit `bf020f9`)

---

## Final manual items (post-Tier 3) — small, owner-only

These are the remaining manual steps that need a human owner — they don't
block launch, but skipping them adds avoidable risk.

### A. Encrypt `cred/credentials.md` at rest

The file lives outside the repo (sibling to `dbcgermanyapps/`) and is
ignored from git multiple ways. It is still plain-text on the operator
laptop. If the laptop is lost / stolen, the live Stripe restricted key,
Supabase service role key, Resend API key, Sentry auth token, and Better
Stack token all leak.

**Action:** `gpg --symmetric --cipher-algo AES256 cred/credentials.md`
and delete the plaintext. To read: `gpg -d cred/credentials.md.gpg`.
Memorize the passphrase or store it in a separate password manager.

### B. Scope-down the GitHub PAT

The PAT in `cred/credentials.md` is a classic-style token with
`repo` + `workflow` scopes. After launch, rotate it to a fine-grained
PAT scoped to **only** the `dbc-germany` repo with `Contents: read+write`
and `Workflows: read+write` permissions. Reduces blast radius if leaked.

### C. ✅ DONE — Supabase Pro upgrade

Upgraded 2026-05-04. API confirms `organization.plan: "pro"` and 7 daily
snapshots present (oldest 2026-04-27, newest 2026-05-03). RPO = 24h.
PITR add-on intentionally skipped — daily snapshots accepted as the
recovery target.

### D. Vercel deployment annotations (post-deploy hook)

Each deploy creates a Vercel deployment record. Sentry releases
auto-link to the deploy via `VERCEL_GIT_COMMIT_SHA`, but the Vercel UI
itself doesn't show release notes. If you want a human-readable
"what changed" on each deploy, add a post-deploy webhook that hits
`POST /v13/deployments/<id>/checks` with the commit subject. Optional
polish — current Sentry release info already covers the common case.

---

## How we got here — commit log

- `2124f9f` — feat(stripe): wire live ticketing (tier+coupon sync,
  capability filter, refund/dispute webhooks)
- `b2ca26e` — feat(prod): batch 1 — payment integrity, cron auth,
  observability, GDPR
- `808774c` — feat(prod): batch 2 — Widerrufsrecht waiver, admin login
  i18n
- `7815f67` — feat(tier3): destructive-action confirm() →
  ConfirmDialog, orders pagination, loading skeletons, PII-safer logs
- `97f1a48` — feat(tier3): event-page ISR 30s→300s, "unlimited" label
  for null tier max_quantity
