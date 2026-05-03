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

### 2. CRITICAL — Sentry (or equivalent error tracking)

Code is ready to wire — every error path already calls `console.error`.
Without an error tracker, those logs vanish from Vercel after ~1 hour.

**Action:**
1. Create a Sentry account → 3 projects (admin, tickets, site).
2. Copy the DSN for each → add as `NEXT_PUBLIC_SENTRY_DSN` (or
   `SENTRY_DSN`) on each Vercel project (Production + Preview).
3. Tell me when done; I'll wire `@sentry/nextjs` into all three apps
   (10-minute change once DSNs exist).

### 3. CRITICAL — Stripe live account: Tax + Tax ID

Per the earlier `acct_1TM1lKCskIJw43NF` retrieve, `tax_id_provided: false`.
German VAT (19%) **must** show on receipts.

**Action:** in https://dashboard.stripe.com (live mode):
- Settings → Tax → enable Stripe Tax for DE.
- Settings → Account details → add Steuernummer or USt-IdNr.
- Optional: Settings → Payment methods → activate SEPA Direct Debit and
  PayPal so they auto-light in checkout (the capability detector in
  `apps/tickets/src/lib/stripe-capabilities.ts` picks them up within 5
  minutes).

### 4. CRITICAL — Resend webhook → app

Now that `/api/webhooks/resend` exists, finish the loop:

**Action:** in https://resend.com/webhooks add an endpoint:
- URL: `https://tickets.dbc-germany.com/api/webhooks/resend`
- Events: `email.bounced`, `email.complained`
- Copy the signing secret → set `RESEND_WEBHOOK_SECRET` on the tickets
  Vercel project (Production env). The endpoint currently 503s with
  "webhook not configured" until that env var is set.

### 5. HIGH — German Impressum + Privacy Policy review

The site likely has these but I haven't audited the content for
TMG §5 / §7 compliance (legal entity, address, VAT ID, contact person,
sole responsible) or whether the privacy policy mentions:
- SEPA payment handling
- Stripe + Resend as data processors
- Refund / revocation policy
- Audit-log + ticketing data retention

**Action:** legal review of `/en/imprint`, `/de/impressum`,
`/fr/mentions-legales`, and the equivalent privacy pages. If you have a
DPO, run them past it. I can wire copy changes once you have approved text.

### 6. HIGH — Uptime monitor

`/api/health` is live at all 3 apps, but nothing is hitting it externally.

**Action:** sign up for Better Stack (free tier), Pingdom, or
UptimeRobot. Configure 3 monitors:
- `https://tickets.dbc-germany.com/api/health`
- `https://admin.dbc-germany.com/api/health`
- `https://dbc-germany.com/api/health`
Alert channel: a Slack webhook or email distribution list. Frequency: 1
min for tickets (the buy flow), 5 min for the others.

### 7. MEDIUM — Load test before go-live

Buying flow has not been pressure-tested. The reservation TTL + atomic
RPCs handle race-correctness in theory, but a real load test would
expose Supabase connection-pool limits, Stripe rate-limit hits, and
Vercel function-concurrency caps.

**Action:** 30 minutes with k6 or Artillery against a preview deploy
(use the Stripe test key for the preview env to avoid live charges):
```
k6 run --vus 100 --duration 5m checkout-flow.js
```
Target: 99% success rate, p95 < 2s. If anything fails, increase Supabase
connection pool size in the Supabase dashboard.

### 8. MEDIUM — On-call + runbook

Currently undocumented. If something breaks at 23:00 UTC two days before
the conference, who fixes it?

**Action:** decide who is primary / backup on-call for go-live week.
Document in a quick `docs/RUNBOOK.md` covering: webhook failures,
Resend outage, Stripe outage, Supabase outage, "buyer charged but no
ticket." I can draft this if you give me the names + escalation paths.

---

## Code-only items still in the backlog (not blocking launch)

- Per-section error boundaries on admin (the locale-level boundary catches
  everything; section-level is polish).
- Sponsors edit UI (currently list + delete only).
- Bulk CSV import per-row error reporting.
- Per-tier revenue breakdown on admin dashboard.
- Sentry instrumentation (see item 2 above; code-side wiring is fast once
  DSN exists).
- `/api/dev/qa-tier`: hardened with dual-gate; production env-var pruning
  doc still pending.

---

## How we got here — commit log

- `2124f9f` — feat(stripe): wire live ticketing (tier+coupon sync,
  capability filter, refund/dispute webhooks)
- `b2ca26e` — feat(prod): batch 1 — payment integrity, cron auth,
  observability, GDPR
- `808774c` — feat(prod): batch 2 — Widerrufsrecht waiver, admin login
  i18n
