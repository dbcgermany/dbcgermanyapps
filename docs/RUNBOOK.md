# Operational runbook — DBC Germany ticketing

Common incidents, what they look like, and exactly what to do. Open this in a tab on launch day.

## Where to look first

| Symptom | First place to check |
|---|---|
| Customers say "I paid but didn't get a ticket" | Sentry → dbc-tickets project → search `scope: stripe_webhook:send_tickets` |
| Site is down / slow | Better Stack https://dbc-germany.betteruptime.com → which monitor is red |
| Operator can't log in | Sentry → dbc-admin → search `scope: admin:auth` (if any) |
| Bulk emails not arriving | Resend dashboard → Logs → filter by domain |

---

## On-call rotation

Update this whenever rotation changes. Sentry alerts + Better Stack incidents
should email the primary; if no ack within 15 min, escalation.

| Tier | Name | Phone | Slack | Email |
|---|---|---|---|---|
| Primary | Jay N Kalala | _TBD_ | _TBD_ | realjaynka@gmail.com |
| Escalation | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Owner of last resort | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

**Vendor support:**
- Stripe: dashboard.stripe.com → bottom-right chat (24/7 for live accounts)
- Vercel: vercel.com/help (within plan SLA)
- Supabase: supabase.com/dashboard/support
- Resend: resend.com/support

---

## Severity levels

- **P0** — Buyers can't pay OR paid buyers can't get tickets. Page primary immediately.
- **P1** — Admin dashboard unreachable, but buyer flow works. Page within 15 min.
- **P2** — Slow / degraded but functional. Page within 1 hour.
- **P3** — Polish / non-critical. Ticket for normal hours.

---

## Playbook A — Stripe webhook is failing

**Symptom:** Sentry alerts on `scope: stripe_webhook:*`, OR Stripe Dashboard shows endpoint returning non-2xx.

1. Stripe Dashboard → Developers → Webhooks → `we_1TMbbhCskIJw43NFk48jxT8w` → check delivery log.
2. Identify the event type that's failing. The Sentry breadcrumb has the `event_id`.
3. **If it's a signature failure** (`scope: stripe_webhook:signature`): the secret rotated. Re-fetch the live signing secret from the Stripe Dashboard → Developers → Webhooks → reveal signing secret, set as `STRIPE_WEBHOOK_SECRET` on Vercel tickets project, redeploy.
4. **If it's `send_tickets` failing**: ticket delivery emails are bouncing. See Playbook D (Resend bounces).
5. **If it's `promote_order`**: the order can't be flipped to paid in Supabase. Likely the migration broke or the row was force-deleted. Inspect the order in admin → Orders → look for the order_id in the Sentry context.
6. While diagnosing: in Stripe Dashboard, "Resend" failed events to retry deliveries.

## Playbook B — `/api/health` is failing

**Symptom:** Better Stack monitor goes red, status page flips to "downtime".

1. https://dbc-germany.betteruptime.com → see which app.
2. Check `https://<app>.dbc-germany.com/api/health?deep=1` directly to see if Supabase is reachable.
3. If `supabase: "unreachable"`, Supabase is down or rate-limiting. Check https://status.supabase.com.
4. If 503 with `ok: false`, deeper issue — check Vercel deployment status, function logs.
5. If 200 but Better Stack still red, Better Stack probe issue — wait one cycle.

## Playbook C — Inventory looks wrong (over-sold or under-sold)

**Symptom:** `ticket_tiers.quantity_sold` doesn't match actual paid orders for that tier.

1. Run the audit query:
   ```sql
   SELECT
     t.id, t.name_en, t.quantity_sold AS counter,
     COUNT(tickets.id) FILTER (WHERE orders.status IN ('paid','comped')) AS actual
   FROM ticket_tiers t
   LEFT JOIN tickets ON tickets.tier_id = t.id
   LEFT JOIN orders ON orders.id = tickets.order_id
   WHERE t.event_id = '<event_id>'
   GROUP BY t.id, t.name_en, t.quantity_sold
   HAVING t.quantity_sold <> COUNT(tickets.id) FILTER (WHERE orders.status IN ('paid','comped'));
   ```
2. If counter > actual: a refund didn't release inventory. Reconcile by setting `quantity_sold = actual`.
3. If counter < actual: a sale wasn't reserved. Likely a manual DB insert. Reconcile same way.
4. The cron `release-reservations` runs every 5 min and sweeps stale `pending` orders — verify it's running by looking at recent rows in `processed_webhooks` (no — that's webhook only) or Sentry breadcrumbs.

## Playbook D — Bounces / complaint storm

**Symptom:** Resend dashboard shows bounce rate > 5%, OR Sentry shows `scope: send_tickets_for_order` failures.

1. Resend dashboard → Logs → filter `Bounced` or `Complained`.
2. Spot-check recent bounces: typo emails (e.g., `gmial.com`) or full mailbox. The bounce webhook should already have flipped `contacts.email_status='bounced'` for them.
3. If bounce rate is sustained > 5%, the domain reputation is at risk. Consider:
   - Pausing email-sequences cron temporarily
   - Re-checking SPF/DKIM via `dig +short TXT resend._domainkey.dbc-germany.com`
   - Contacting Resend support
4. To resend tickets to a buyer who reports they didn't receive theirs: admin → Orders → click the order → "Resend tickets" button. The send-tickets-for-order action skips already-sent rows (per-ticket `email_sent_at` stamps), so partial-failure batches retry only the un-sent rows.

## Playbook E — Customer charged but no ticket received

**Symptom:** customer support email saying "I paid €299 and never got my ticket".

1. Find the order: admin → Orders → search by recipient_email or recipient_name.
2. Check `orders.status` — should be `paid`. If `pending`, the webhook didn't fire — see Playbook A.
3. Check `orders.email_sent_at` — should be a timestamp. If NULL, the send-tickets path failed.
4. Check the per-ticket `tickets.email_sent_at` for each ticket on the order. Any `NULL` row never delivered. Check `email_message_id` to look up the Resend send.
5. Click "Resend tickets" — the action is idempotent, only re-sends rows where `email_sent_at IS NULL`.
6. If all per-ticket stamps are present but customer says they didn't get it: ask if it went to spam, then resend with `forceResend: true` via the admin button.

## Playbook F — Coupon used too many times (shouldn't have been redeemable)

1. Check `coupons.times_used` vs `coupons.max_uses`.
2. The `redeem_coupon` RPC is atomic — only fails if max_uses is exceeded. So this should be impossible. If it happened, look for direct `UPDATE coupons SET times_used` calls in `audit_log`.
3. To deactivate a coupon immediately: admin → Coupons → toggle `is_active` to false. The next checkout that tries it will get "Invalid or expired coupon code."
4. The Stripe-side Promotion Code is also marked `active: false` automatically by the sync.

## Playbook G — Vercel deployment failed

1. Vercel dashboard → the failing deployment → Logs.
2. If build error: check the commit diff for syntax / type errors.
3. If runtime error post-deploy: roll back via "Promote to production" on the previous green deployment.
4. Quick rollback via API:
   ```bash
   curl -X POST "https://api.vercel.com/v9/projects/<projectId>/promote/<previousDeploymentId>?teamId=team_EEPrSTrl7mHIWDZmZhIbtlUb" \
     -H "Authorization: Bearer $VERCEL_TOKEN"
   ```

## Playbook H — Supabase down or rate-limited

1. https://status.supabase.com.
2. If you're seeing Postgres connection errors but Supabase status is green, you may be hitting connection-pool limits. Restart the app: in Vercel, redeploy the affected project. New deployment uses fresh pooled connections.
3. If Supabase is genuinely down, the `/api/health?deep=1` check returns `supabase: "unreachable"` and Better Stack pages on-call.

---

## Quick reference — IDs and tokens

(Real values in `cred/credentials.md`. Treat this section as the index, not the keystore.)

- Supabase project: `rcqgsexfuaoiiuqcqeka` (EU Central)
- Stripe live: `acct_1TM1lKCskIJw43NF`, webhook `we_1TMbbhCskIJw43NFk48jxT8w`
- Vercel team: `team_EEPrSTrl7mHIWDZmZhIbtlUb`; projects: admin `prj_tR1Lt3cPHTRDH4PKRZR5bzR47Ysz`, tickets `prj_wrJNDjQVFDOmaEq95OHvEDz4dFgt`, site `prj_AkJ7RBy4LCBC5PutJYWLQMoGUAAC`
- Sentry org: `dbc-germany` (EU region `de.sentry.io`); projects: `dbc-admin`, `dbc-tickets`, `dbc-site`
- Resend: domain `8263c261-d29e-4120-89af-2a7934b0bf3f`, bounce webhook `2145f0f8-de92-48c1-b32a-eb3e1700ce5e`
- Better Stack: monitors `4356310/4356311/4356312`, status page `245884` at https://dbc-germany.betteruptime.com

---

## Communication templates

### Customer paid but didn't receive ticket

> Hi {name}, thanks for your patience. We've located your order #{order_short} and resent your ticket to {email}. If it still hasn't arrived in 5 minutes, please check your spam folder, then reply here and we'll send it from a different address.

### Customer wants a refund

> Hi {name}, we've issued the refund for €{amount}. It typically takes 5-10 business days to appear back on your card / SEPA account, depending on your bank. You'll receive a confirmation email shortly.

### Sustained outage notice (status page incident)

> We're investigating an issue affecting {ticket purchases / admin dashboard / our website}. Our team is on it and we'll update this page every 15 minutes until it's resolved. No customer data has been compromised.
