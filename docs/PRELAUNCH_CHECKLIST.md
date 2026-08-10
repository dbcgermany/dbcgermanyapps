# Event readiness — Richesses d'Afrique MasterClass Germany 2026

**Saturday 5 September 2026 · 10:00–16:00 · Messe Essen · Messeplatz 1, 45131 Essen**

Tickets have been on sale since spring, so this is no longer a "before we open
sales" checklist — it is a "can we take money, keep the data, and run the day"
checklist. Everything below was verified against the live systems on
**2026-08-11**; each item carries the evidence that produced its state.

Re-verify at any time with:

```bash
node scripts/verify-readiness.mjs          # human table
node scripts/verify-readiness.mjs --json   # machine-readable
```

That script is strictly read-only (GET only). Run it at T-7 and T-2 rather
than re-auditing by hand. Anything it reports as `ERROR` means *unknown* —
never record an unknown as green.

**Verifier at last run: 33 checks · 21 pass · 9 fail · 3 warn · 0 error.**

---

## 🔴 Blocking — the event cannot run commercially until these clear

### 1. Stripe live account is DISABLED — no one can pay

Nothing else on this list matters more. The account is switched off, so every
checkout attempt fails.

- [ ] Complete the past-due verification at
      https://dashboard.stripe.com/settings/update — required fields:
      `company.name`, `company.tax_id`, `company.verification.document`,
      `owners.first_name`, `owners.last_name`.
- [ ] Re-run the verifier and confirm `charges_enabled=true`,
      `payouts_enabled=true`, `card_payments=active`.
- [ ] Re-check Klarna, and activate SEPA Debit + PayPal if wanted (the code
      auto-detects active capabilities — no deploy needed).

> **Evidence 2026-08-11** · `GET /v1/account` on `acct_1TM1lKCskIJw43NF`:
> `charges_enabled=false`, `payouts_enabled=false`,
> `disabled_reason=requirements.past_due`, deadline **2026-06-01** (missed).
> Every capability reads `inactive`, including `card_payments`.
> Last successful charge: **2026-06-07** (€49.00). Nothing has been sold
> online in the 9 weeks since.

### 2. Supabase is on the free plan with ZERO backups

Live orders, tickets, contacts and consent records currently have no
restorable snapshot. A bad migration, a bad delete, or a corrupted table is
unrecoverable today.

- [ ] Upgrade the `dbcgermany` organisation to Pro (~$25/mo) at
      https://supabase.com/dashboard/org/znirzzrccupnxfzqhvnc/billing
- [ ] Confirm daily snapshots start appearing; the verifier reports snapshot
      count and age.
- [ ] Restore one snapshot into a temporary project as a smoke test, then
      delete the temp project.

> **Evidence 2026-08-11** · `GET /v1/organizations/znirzzrccupnxfzqhvnc` →
> `plan: "free"`. `GET /v1/projects/rcqgsexfuaoiiuqcqeka/database/backups` →
> `backups: []`, `pitr_enabled=false`. The project itself is
> `ACTIVE_HEALTHY` — but free-tier projects are also auto-paused when idle,
> which is the known "can't log in" failure mode.

### 3. Vercel is on Hobby — none of the 13 cron jobs are running

`vercel.json` declares them and the builds go green, so nothing surfaces the
gap. Vercel simply never registered the schedules.

What is silently not happening:

| Cron | Declared | Consequence of it not running |
|---|---|---|
| `release-reservations` | `*/5` | Abandoned checkouts hold seats indefinitely |
| `finish-stuck-orders` | `*/5` | Paid-but-unfinished orders never self-heal |
| `email-sequences` | daily | Aftercare + nurture emails never send |
| `pre-event-reminders` / `admin-event-reminders` | daily | **No attendee reminder before 5 Sep** |
| `payment-reminders` | daily | Unpaid invoices never chased |
| `waitlist` | daily | Waitlist never converts on release |
| `kpi-snapshots` | daily | Dashboard trends stay flat |
| `low-inventory` | `*/30` | No sell-out warning |
| `certificates`, `ask-speakers-prompts`, `daily-admin-digest`, `affiliate-cooldown` | daily | Post-event + ops automation dead |

- [ ] Upgrade the team to Pro ($20/mo/member) at
      https://vercel.com/account/teams/dbcgermany-7280s-projects/settings/billing
- [ ] Redeploy all three projects so the schedules register.
- [ ] Confirm with the verifier: `registered` must equal `declared` per app.

> **Evidence 2026-08-11** · `GET /v2/teams/team_EEPrSTrl7mHIWDZmZhIbtlUb` →
> `billing.plan: "hobby"`. `GET /v9/projects/{id}` → `crons.definitions: []`
> on tickets, admin **and** site. Declared: tickets 7, admin 6.
> This supersedes the note in `FOLLOWUPS.md` §2 — the `*/5` schedules in
> `vercel.json` prove only that someone wrote them, not that they run.

### 4. Impressum is incomplete — §5 DDG exposure while selling

- [ ] Fill in admin → Settings → Company info: `hrb_number`, `hrb_court`,
      `vat_id`, `tax_id`, `chamber_of_commerce`.
- [ ] Confirm https://dbc-germany.com/de/imprint and
      https://tickets.dbc-germany.com/de/imprint render every line.

> **Evidence 2026-08-11** · all five columns NULL in `company_info`.
> `legal_name="DBC Germany"`, `legal_form="UG (haftungsbeschränkt)"` are set,
> so the entity shows but the registration details do not. The HRB number was
> still pending as of the 2026-05-18 registration.

### 5. Legal texts have never been reviewed by a lawyer

Tickets are already selling against AI-drafted terms.

- [ ] Retain a German-admitted Rechtsanwalt for ToS, Privacy, Cookie,
      Impressum + the US notice. See `FOLLOWUPS.md` §7 for suggested firms
      and the €1,500–3,500 range.

---

## ✅ Confirmed green — verified, no action

| Item | Evidence (2026-08-11) |
|---|---|
| Resend sending domain | `dbc-germany.com` `status=verified`, region `eu-west-1` |
| Bounce/complaint webhook | enabled, `email.bounced` + `email.complained` |
| Stripe webhook endpoint | `we_1TMbbhCskIJw43NF…` enabled, all 5 required events subscribed |
| Stripe Tax settings | `status=active` |
| Supabase project | `ACTIVE_HEALTHY`, `eu-central-1`, Postgres 17.6 |
| Event record | published, 2026-09-05 10:00–16:00, Messe Essen |
| Inventory | 3 public tiers of 8, from €49.00, 400 seats, 25 sold |
| Order integrity | 0 expired-but-still-pending orders |
| Production deploys | all three apps `READY` |
| Health endpoints | site / tickets / admin all `ok` on `?deep=1` |
| Env vars | admin 22/22, site 21/21 required present in Production |
| DNS — receiving | Google MX on apex, apex SPF `include:_spf.google.com` |
| DNS — sending | Resend DKIM + `send` SPF + `send` MX all present |
| Search Console | verification TXT live at apex |
| Event date consistency | 0 stale "13 June" strings in DB + code (fixed 2026-08-11) |
| Load test | 1737 requests, 0 failures, 56 RPS — see `LOAD_TEST_RESULTS.md` |

---

## T-21 · Fri 15 August

- [ ] **Everything in the blocking section above.** All four paid/legal items
      have lead time: Stripe verification can take days, and a lawyer will
      take a week or more.
- [ ] `TURNSTILE_SECRET_KEY` is missing from the tickets project in
      Production — add it, or confirm the app is meant to run without bot
      protection on the public forms.
      *(Evidence: `GET /v10/projects/{tickets}/env` — name absent from the
      production target. admin and site are complete.)*
- [ ] Decide whether the four news articles from 2026-06-05 that still say
      "13 June" get amended or a dated correction note. They were left alone
      on purpose — they are editorial, not sales copy.
- [ ] Reconcile the speaker lineup: the event description names Jean-Claude
      Tshipama, but the live speakers block shows Diambilay, Alina
      Adomaitytė, Pauline Mona Tshiebe Kayoko and Mark Rau.

## T-14 · Sat 22 August

- [ ] Confirm the Stripe payout bank account is active and can receive
      payouts. Payout schedule is currently `manual` (delay 3 days) — switch
      to `daily` around T-3 if you want automatic transfers.
- [ ] Add the German VAT registration in Stripe Tax once the USt-IdNr exists.
      *(Evidence: `GET /v1/tax/registrations` → 0 active, no DE.)*
- [ ] Point DMARC aggregate reports at a real mailbox — the record currently
      reads `rua=mailto:deine@email.de`, a leftover from Strato's template,
      so every report is discarded.
- [ ] Fill in the on-call table in `RUNBOOK.md` (escalation contact and owner
      of last resort are still `_TBD_`).

## T-7 · Sat 29 August

- [ ] **Live acceptance test** — only meaningful once Stripe is re-enabled:
      `./scripts/acceptance-test.sh open richesses-dafrique-germany-2026`,
      buy the 1-cent tier with a real card, confirm the ticket PDF arrives
      within 2 minutes and is not in spam, `orders.status='paid'`, and Sentry
      is clean. Then `./scripts/acceptance-test.sh close <tier_id>` and unset
      `ALLOW_QA_TIER`.
- [ ] Exercise the **transfer** flow end to end (`/transfer`) — that is the
      customer-facing remedy, since the policy is no refunds. The Stripe
      refund path is a technical smoke test only; do not offer it.
- [ ] Fire each cron once manually with `Authorization: Bearer $CRON_SECRET`
      and confirm a 200 and a sane payload. Only useful after the Vercel Pro
      upgrade — before that there is nothing scheduled to test.
- [ ] Confirm Sentry and Better Stack alerts route somewhere a human reads.

## T-2 · Thu 3 September

- [ ] Feature freeze — hotfixes only.
- [ ] Re-run `node scripts/verify-readiness.mjs`. Target: zero FAIL rows.
- [ ] Re-confirm Resend domain still `verified` (renewals occasionally fail).
- [ ] Print / load the runsheet: 21 items, 07:00–19:00 on 5 September.

## Event day · Sat 5 September

- [ ] `RUNBOOK.md` open in a tab.
- [ ] Sentry, Better Stack, and the live Stripe dashboard open in tabs.
- [ ] Watch the first 30 minutes of door sales closely — door-sale ticket
      inserts and inventory release are the paths with the least live mileage.

## Post-event · T+24h and T+7d

- [ ] Bounce rate in the Resend log — above 5% means a DNS or list-quality
      problem.
- [ ] Confirm `processed_webhooks` shows Stripe retries being deduped.
- [ ] Sentry quota check; tune `tracesSampleRate` down from 0.1 if near the
      limit.
- [ ] Aftercare sequence actually sent (depends on the cron fix landing).

---

## Note on cost

Three of the five blockers are plan downgrades that happened around the start
of June and quietly took production capability with them: Stripe verification
lapsed 1 June, and the Supabase and Vercel plans are both back on free tiers.
Restoring them is roughly **$45/month** (Supabase Pro ~$25 + Vercel Pro $20)
plus completing the Stripe forms, which costs nothing but time. Worth checking
whether one expired payment card explains all three.
