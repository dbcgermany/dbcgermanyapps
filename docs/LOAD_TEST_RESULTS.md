# Load test results

Live tests against `tickets.dbc-germany.com`. Runner at
`scripts/load-test-readpath.mjs` — read-only paths only (no Stripe Checkout
sessions, no DB writes). Production-safe.

## 2026-05-03 — 50 VUs × 30s baseline

Sustained 50 concurrent virtual users hitting `/api/health` + `/de` + `/en`
for 30 seconds. Goal: confirm the read paths don't fall over at modest
sustained load before launch.

| Endpoint | Requests | Success | Failures | Avg | p95 | Max | RPS |
|---|---|---|---|---|---|---|---|
| `/api/health` | 517 | 517 | 0 | 433ms | 1198ms | 1659ms | 16.8 |
| `/en` (homepage) | 355 | 355 | 0 | 1018ms | 2761ms | 4674ms | 11.5 |
| `/de` (homepage) | 865 | 865 | 0 | 1069ms | 2445ms | 5955ms | 28.1 |

**Total: 1737 requests · 0 failures · 56 RPS aggregate.**

### Reading the numbers

- **Zero failures** at 50 concurrent users for 30 seconds — Vercel's edge
  + Supabase pool absorbed the test cleanly. No 5xx, no timeouts.
- `/api/health` averaging ~430ms reflects Vercel cold-starts on a portion of
  requests; warm hits land in 50–80ms locally. The p95 is dominated by the
  cold tail, which is expected on Vercel's serverless model.
- Homepage p95 in the 2.4–2.8s range is the full HTML render with above-the-
  fold images. ISR caches the HTML so most requests don't hit Supabase, but
  asset hydration accounts for the rest.

### What we did NOT test

- **Stripe Checkout creation** — would put real Sessions on the live
  account. Run this against a test-mode preview deployment if needed.
- **Sustained high concurrency** (200+ VUs, 5+ minutes) — would be the next
  step before a major spike. Simulate ticket-drop morning if revenue at
  risk justifies it.
- **Concurrent writes** (door-sale + checkout simultaneously) — covered
  by the atomic `reserve_tickets` RPC in code; not yet stress-tested.

### How to re-run

```bash
node scripts/load-test-readpath.mjs            # default 50 × 30s
VUS=100 DURATION_S=60 node scripts/load-test-readpath.mjs
VUS=200 DURATION_S=300 node scripts/load-test-readpath.mjs   # 5-min stress
```

While running, watch:
- Sentry → dbc-tickets project for any new errors
- Better Stack → all 3 monitors stay green
- Vercel deployment logs (functions tab)

If you see failures, open Playbook B in the runbook.
