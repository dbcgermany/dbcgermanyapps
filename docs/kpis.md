# DBC Germany — Event KPI Catalog & Implementation Roadmap

Scope: every metric an event company needs to run a flagship conference (like **Richesses d'Afrique Germany 2026**) and everything in between — pre-sale, day-of, and post-event. Organized by category; each KPI has a definition, source, and implementation notes for the DBC admin dashboard.

Status legend: ✅ tracked today · 🟡 partially tracked · ❌ missing · 🔮 future

---

## 1) Financial / Revenue

| KPI | Definition | Source | Status |
|---|---|---|---|
| Gross ticket revenue | Sum of `orders.total_cents` where status ∈ (paid, comped) | `orders` | ✅ |
| Net revenue | Gross − (refunds + chargebacks + Stripe fees) | `orders` + Stripe | ❌ |
| AOV (Average Order Value) | Gross / paid order count | `orders` | ❌ |
| ARPA (Avg Revenue Per Attendee) | Gross / ticket count | `orders` + `tickets` | ❌ |
| Refund count + € | Orders with status=refunded | `orders` | 🟡 |
| Chargeback rate | Chargeback count / paid orders | Stripe API | ❌ |
| Sponsor revenue (count + €) | Sum of sponsor deals (by tier) | (new table) | ❌ |
| Sponsor share of revenue | Sponsor rev / (ticket rev + sponsor rev) | Derived | ❌ |
| Merch / ancillary | Non-ticket line items | (new table) | ❌ |
| Break-even ticket count | Total budget / AOV | Config + derived | ❌ |
| Break-even date | Projected date break-even hits | Derived from velocity | ❌ |
| Stripe fee load | Fees / gross | Stripe + `orders` | ❌ |
| Cash flow timing | When revenue lands vs. when costs hit | Manual + Stripe payouts | ❌ |
| Profit margin | (Revenue − Costs) / Revenue | Manual costs + revenue | ❌ |

## 2) Ticketing & Sales Velocity

| KPI | Definition | Source | Status |
|---|---|---|---|
| Tickets sold (total, per tier) | `tickets` count joined to `ticket_tiers` | `tickets` | ✅ |
| Sell-through % | Sold / capacity per tier | `ticket_tiers` | ❌ |
| Sales velocity (7d rolling) | Tickets sold per day, 7-day average | `orders` (time-bucketed) | ❌ |
| Early-bird take-up % | Early-bird tier sold / total | `tickets` + tier tag | ❌ |
| Comp tickets issued % | Comped orders / total orders | `orders` | 🟡 |
| Waitlist conversion rate | Waitlist entries → purchase | `waitlist_entries` | ❌ |
| Door-sale vs. pre-sale split | Door sales / (door + online) | `orders.acquisition_type` | 🟡 |
| Coupon redemption rate | Redeemed / issued per coupon | `coupons` + `orders` | 🟡 |
| Coupon attributed revenue | Rev from coupon-applied orders | `orders` joined | ❌ |
| Abandoned checkout rate | Started checkouts / completed | Stripe sessions + orders | ❌ |
| Cart-to-purchase conversion | Add-to-cart / purchase | Client + orders | ❌ |
| Time-from-visit-to-purchase | Median time first visit → paid | GA/Plausible + orders | ❌ |
| Sellout date prediction | ETA based on current velocity | Derived | 🔮 |

## 3) Attendance & Engagement (day-of)

| KPI | Definition | Source | Status |
|---|---|---|---|
| Check-ins | Count of `tickets.checked_in_at` not null | `tickets` | ✅ |
| Show-up rate | Check-ins / issued tickets | Derived | ❌ |
| No-show rate | 1 − show-up | Derived | ❌ |
| Peak arrival time | Time bucket with most check-ins | `tickets` | ❌ |
| Queue length proxy | Check-in backlog per 5-min window | `tickets` | ❌ |
| Session attendance | Check-ins per session | (new table) | 🔮 |
| Session dwell time | In/out timestamps per session | (new table) | 🔮 |
| NPS (post-event) | Promoters − Detractors / respondents | Survey | ❌ |
| Survey completion rate | Responses / invited | Survey | ❌ |
| Engagement actions (app-based) | Likes, bookmarks, chat messages | (not planned) | 🔮 |

## 4) Marketing & Acquisition

| KPI | Definition | Source | Status |
|---|---|---|---|
| Sessions (total, unique) | Web sessions from analytics | GA4 / Plausible | ❌ |
| Sessions per channel | Organic / paid / social / email / referral / direct | Analytics | ❌ |
| Landing-page conversion | Visit → ticket purchase | Analytics + orders | ❌ |
| UTM-attributed revenue | Rev tagged by utm_source / medium / campaign | orders + UTM capture | ❌ |
| Email list growth | Net new subscribers over period | `newsletter_subscribers` | 🟡 |
| Newsletter open rate | Opens / delivered | Email provider | ❌ |
| Newsletter CTR | Clicks / delivered | Email provider | ❌ |
| Unsubscribe rate | Unsubs / delivered | Email provider | ❌ |
| Social engagement | Likes / comments / shares per post | Social APIs (manual now) | ❌ |
| Press mentions count | Unique outlets over period | Manual entry | ❌ |
| Branded search volume | "dbc germany" monthly searches | Google Search Console | ❌ |
| CPC / CPL | If running paid ads | Ad platforms | ❌ |
| Partner/influencer referrals | Rev from partner-UTM links | UTM + orders | ❌ |

## 5) Operations

| KPI | Definition | Source | Status |
|---|---|---|---|
| Time to check-in (median) | Scan → confirmed ms | (instrument scan) | ❌ |
| Staff per attendee ratio | Team count / expected attendees | Manual | ❌ |
| Support tickets per 100 attendees | Inbox volume normalized | Email / help tool | ❌ |
| Avg support resolution time | First response → closed | Support tool | ❌ |
| Scan success rate | Successful / total scans | `audit_log` (scan actions) | ❌ |
| Duplicate-scan attempts | Attempts on already-checked-in tickets | `audit_log` | ❌ |
| Day-of incident count | Reported issues (manual log) | Ops log (new) | 🔮 |

## 6) Speaker / Content

| KPI | Definition | Source | Status |
|---|---|---|---|
| Applications received | Count of speaker applications | `applications` | ✅ |
| Acceptance rate | Accepted / submitted | `applications.status` | 🟡 |
| Speaker diversity | Breakdown: gender, country, industry | `applications` + enrichment | ❌ |
| Session rating | Avg post-session rating | Survey | 🔮 |
| Repeat-speaker rate | Returning / total speakers | `team_members` historical | 🔮 |

## 7) Sponsor

| KPI | Definition | Source | Status |
|---|---|---|---|
| Sponsors secured (count, €) | Closed sponsor deals | (new table) | ❌ |
| Sponsor retention YoY | Returning / prior-year sponsors | Multi-edition data | ❌ |
| Sponsor satisfaction (NPS) | Post-event sponsor survey | Survey | ❌ |
| Leads delivered | Leads routed per sponsor contract | `sponsor_leads` (new) | ❌ |
| Booth traffic | Scans at booth (if wired) | Scan events | 🔮 |
| Deliverable completion | Contracted items checked off | Sponsor dashboard (new) | ❌ |

## 8) Post-event

| KPI | Definition | Source | Status |
|---|---|---|---|
| Content views | Recap / recording views | Video platform | ❌ |
| Press coverage reach | Estimated impressions | Manual + Google News | ❌ |
| Attendee LTV | Lifetime rev per attendee across editions | Multi-edition join | ❌ |
| Repeat attendance % | Attended >1 edition / total | Multi-edition | ❌ |
| Referral rate | Attendees who brought ≥1 friend | Referral codes | ❌ |
| Community growth post-event | Newsletter + social delta in 30 days | Analytics | ❌ |

## 9) Brand & Community

| KPI | Definition | Source | Status |
|---|---|---|---|
| Brand search trend | Google Trends for "DBC Germany" / event name | Trends API | ❌ |
| Share of voice | Mentions vs peer event brands | Social listening | 🔮 |
| Community size | Newsletter + social followers combined | Aggregate | ❌ |
| Repeat-attendee % (cross-edition) | Returning across editions | Multi-edition | ❌ |

---

## Gap analysis (summary)

| Category | Tracked | Missing priority |
|---|---|---|
| Financial | Gross revenue, refund count | Net revenue, AOV, ARPA, chargebacks, break-even, sponsor split |
| Ticketing | Tickets sold, check-in count | Sell-through %, velocity, early-bird %, cart abandonment, coupon ROI |
| Attendance | Check-ins | Show-up %, peak arrivals, NPS, survey completion |
| Marketing | (nothing integrated) | Traffic, channel mix, email KPIs, UTM attribution |
| Operations | (nothing) | Scan success, duplicate-scan fraud, support volume |
| Speaker | Applications count | Acceptance %, diversity, rating |
| Sponsor | (minimal) | Retention, satisfaction, lead delivery |
| Post-event | (nothing) | LTV, repeat %, content views |
| Brand | (nothing) | Search trend, community size |

---

## Implementation roadmap

### Phase A — "Financial + Ticketing that we can compute today"
All data already in Supabase; the work is query + UI.

1. **Extend `apps/admin/src/actions/dashboard.ts`** with:
   - `getAOV(eventId?)` — sum(total_cents) / count(paid orders)
   - `getARPA(eventId?)` — sum(total_cents) / count(tickets)
   - `getNetRevenue(eventId?)` — gross − refunded total_cents
   - `getSellThrough(eventId)` — per-tier sold/max
   - `getVelocity7d(eventId)` — tickets per day, 7-day rolling
   - `getEarlyBirdTakeUp(eventId)` — requires a `tier.is_early_bird` or naming convention
   - `getCouponROI()` — rev from coupon-applied orders grouped by coupon

2. **Add dashboard cards** with period-vs-prior comparison and sparkline trends (Recharts is already installed).

3. **Break-even tracker** per event — takes budget (new field on `events`) + current revenue → % to break-even, ETA based on velocity.

**Deliverable:** `apps/admin/src/app/[locale]/(authenticated)/dashboard/` refreshed.

### Phase B — "Marketing + Ops (new instrumentation)"

1. **Analytics provider** — add GA4 or Plausible; expose server-side fetch behind new `@dbc/analytics` package.
2. **UTM capture** — ensure every Buy-ticket CTA carries `utm_source`, `utm_medium`, `utm_campaign`. Persist UTMs on orders (new columns).
3. **Scan telemetry** — extend the scan flow to log attempt / result / duplicate into `audit_log` with action `scan_attempt`. Surface duplicate-scan clustering in admin.
4. **Newsletter provider** — confirm (likely Resend); pull opens/clicks via their API on a cron.

### Phase C — "Attendance + Post-event"

1. **Post-event survey** — new `surveys` + `survey_responses` tables; trigger survey email via `post-event-survey` cron (T+24h). Compute NPS from responses.
2. **LTV + repeat attendance** — add `edition` or `season` tagging on events; query attendance across editions for a contact.

### Phase D — "Sponsor + Speaker + Brand"

1. **Sponsors** — new `sponsors` + `sponsor_deals` + `sponsor_leads` tables; admin CRUD.
2. **Speaker diversity** — extend `applications` with optional diversity fields; compute breakdown.
3. **Brand search** — monthly manual entry or Google Search Console API pull.

---

## Data model additions (all phases)

- `events.budget_cents`, `events.target_attendance` (Phase A break-even)
- `events.edition` / `events.season_tag` (Phase C LTV)
- `ticket_tiers.is_early_bird` (Phase A)
- `orders.utm_source`, `orders.utm_medium`, `orders.utm_campaign` (Phase B)
- `surveys`, `survey_responses` (Phase C)
- `sponsors`, `sponsor_deals`, `sponsor_leads` (Phase D)
- `scan_attempts` (or use `audit_log` with action `scan_attempt`) (Phase B)

## Where the dashboard lives
- Dashboard page: `apps/admin/src/app/[locale]/(authenticated)/dashboard/page.tsx`
- Dashboard queries: `apps/admin/src/actions/dashboard.ts`
- Reports (event-level): `apps/admin/src/actions/reports.ts`, `apps/admin/src/actions/event-report.ts`
- Existing cron: `apps/tickets/src/app/api/cron/kpi-snapshots/route.ts` (daily snapshot → extend to include Phase A metrics)
