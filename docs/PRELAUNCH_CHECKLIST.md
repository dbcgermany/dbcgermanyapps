# Pre-launch checklist — Richesses d'Afrique Germany 2026

Run from top to bottom. Each section has a "blocker" tag — only the BLOCKER items must be green before public ticket sales open. Polish items can ship after launch.

---

## T-21 days

### Stripe live account — BLOCKER
- [ ] **Tax ID (Steuernummer or USt-IdNr)** filled on `acct_1TM1lKCskIJw43NF` so receipts show legal VAT info.
- [ ] **Stripe Tax** enabled with German VAT rates configured.
- [ ] **Activate SEPA Debit** in Settings → Payment methods (capability `sepa_debit_payments` flips to `active` — code auto-detects).
- [ ] **Activate PayPal** in Settings → Payment methods (link a PayPal Business account).
- [ ] Confirm live webhook endpoint `we_1TMbbhCskIJw43NFk48jxT8w` shows the 5 subscribed events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.

### Impressum — BLOCKER (German TMG/§5 DDG)
- [ ] Fill the 4 NULL fields in `company_info` (admin → Settings → Company info OR direct UPDATE):
  - `hrb_number` + `hrb_court` once UG i.G. → UG registration is finalized at Amtsgericht Düsseldorf
  - `vat_id` from Finanzamt
  - `tax_id` (Steuernummer)
  - `chamber_of_commerce` (likely IHK Düsseldorf)
- [ ] Visit https://tickets.dbc-germany.com/de/imprint and https://dbc-germany.com/de/imprint, confirm everything renders without `—` placeholders.

### Legal review — BLOCKER
- [ ] Privacy policy reviewed by a German-admitted Rechtsanwalt (currently in `packages/legal/src/privacy.tsx` — flagged as DRAFT).
- [ ] Terms of Service reviewed (same package, same flag).
- [ ] Confirm Widerrufsrecht waiver text (in checkout form) matches counsel's preferred wording.

### Domains + DNS
- [ ] Confirm `dbc-germany.com`, `tickets.dbc-germany.com`, `admin.dbc-germany.com` SSL certs auto-renewing (Vercel manages).
- [ ] (Optional polish) CNAME `status.dbc-germany.com` → Better Stack to brand the status page.

---

## T-14 days

### Bank + payouts
- [ ] N26 account (`acct_1TM1lKCskIJw43NF`, last4 1701) is active and can receive Stripe payouts.
- [ ] Decide payout schedule (currently `manual`; flip to `daily` ~T-3 if you want automated transfers).
- [ ] Confirm `tos_acceptance` is current on the live account.

### Backups + disaster recovery — BLOCKER for live payments
- [ ] **Supabase project is currently on the free plan** — confirmed via management API
  on 2026-05-03: `organization.plan: "free"`, `pitr_enabled: false`, `backups: []`.
  Free tier has WAL archiving on (`walg_enabled: true`) but no user-restorable daily
  snapshots and no PITR. **Upgrade to Pro before live payments open** (~$25/mo)
  — that turns on daily backups + 7-day retention + PITR. URL:
  https://supabase.com/dashboard/project/rcqgsexfuaoiiuqcqeka/settings/billing
- [ ] After upgrade, re-query `GET /v1/projects/rcqgsexfuaoiiuqcqeka/database/backups`
  and confirm the `backups` array populates with at least one snapshot.
- [ ] Restore one nightly backup into a temporary project as a smoke test (delete the temp project after).
- [ ] Document operator email + phone numbers (see `RUNBOOK.md`) for the 3 key vendors: Vercel, Supabase, Stripe.

### Load test — recommended
- [ ] Run `k6` or similar against `tickets.dbc-germany.com`:
  - 100 concurrent buyers × 5 min on the home page → confirms ISR holds
  - 50 concurrent checkouts → confirms `reserve_tickets` RPC doesn't oversell
  - Watch Sentry + Better Stack live during the test
- [ ] Document p95 response time + Stripe-API latency in `docs/LOAD_TEST_RESULTS.md`.

---

## T-7 days

### Acceptance test (real €0.01 ticket on live event)
- [ ] Set `ALLOW_QA_TIER=1` and `QA_TIER_ADMIN_TOKEN=<openssl rand -hex 32>` on tickets Vercel project, redeploy.
- [ ] `curl -X POST https://tickets.dbc-germany.com/api/dev/qa-tier -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"event_slug":"<live-event>"}'` to mint a 1-cent hidden tier.
- [ ] Buy that tier through live checkout with a real card. Verify:
  - Ticket PDF lands in inbox (not spam) within 2 minutes
  - `orders.status='paid'`, `payment_method='card'`
  - Sentry shows zero errors on the buy flow
- [ ] Refund via admin Orders. Confirm Stripe shows refund + email arrives.
- [ ] Repeat with **Klarna** (already an active capability).
- [ ] DELETE the QA tier via the same endpoint, then unset `ALLOW_QA_TIER` + `QA_TIER_ADMIN_TOKEN`, redeploy.

### On-call setup
- [ ] On-call rotation defined in `RUNBOOK.md` with names + phone + Slack handle.
- [ ] Sentry alerts route to the right channel (currently email — add Slack/PagerDuty if available).
- [ ] Better Stack alerts route to the same channel.

### Cron sanity
- [ ] Hit each cron endpoint manually with the right `Authorization: Bearer $CRON_SECRET` and confirm a 200 + sane shape:
  - `release-reservations` (every 5 min)
  - `kpi-snapshots` (daily 02:00 UTC)
  - `email-sequences` (daily 10:00 UTC)
  - `waitlist` (daily 14:00 UTC)
  - `daily-admin-digest` (daily 06:00 UTC)
  - `payment-reminders` (daily 09:00 UTC)
  - `pre-event-reminders` (daily 08:00 UTC)
  - `low-inventory` (every 30 min)
  - `admin-event-reminders` (daily 07:00 UTC)

---

## T-2 days (production freeze)

- [ ] Feature freeze — no merges except hotfixes.
- [ ] Final stripe live key check: `curl -u "rk_live_…:" https://api.stripe.com/v1/account` shows `charges_enabled:true`, `payouts_enabled:true`.
- [ ] Verify Resend domain still `verified` (sometimes auto-renews fail): `curl -H "Authorization: Bearer re_…" https://api.resend.com/domains/8263c261-d29e-4120-89af-2a7934b0bf3f`.
- [ ] All env vars set on Vercel for Production scope across all 3 projects (admin/tickets/site). Spot-check the critical ones via REST: `STRIPE_SECRET_KEY`, `SENTRY_DSN`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, `REVALIDATE_SECRET`, `TURNSTILE_SECRET_KEY`.

---

## Launch day

- [ ] Open `RUNBOOK.md` in a tab.
- [ ] Open https://dbc-germany.sentry.io in a tab.
- [ ] Open https://dbc-germany.betteruptime.com in a tab.
- [ ] Open https://dashboard.stripe.com (live mode) in a tab.
- [ ] Make event `is_published=true` if not already.
- [ ] Send the launch email blast (newsletter + social).
- [ ] Watch Sentry / Better Stack for the first 30 min.
- [ ] Announce ticket sales open.

---

## Post-launch (T+24h, T+7d)

- [ ] Refund-rate audit: should be ≤ 2% of orders. Anything higher → debug.
- [ ] Bounce-rate audit: Resend dashboard → Logs. > 5% bounces → DNS issue or list quality.
- [ ] `processed_webhooks` table size: confirm dedupes are happening (sustained Stripe retry storms log structured `{ scope: stripe_webhook, decision: dedup }`).
- [ ] Sentry quota usage. If approaching limit, tune `tracesSampleRate` down from 0.1.
