# Follow-ups — open work after account-area overhaul

Living doc. Close items by editing this file; don't track them elsewhere.

---

## 1. Resend: verify `dbc-germany.com` in Resend dashboard

**Status**: BLOCKER for production email.

The Resend API key is live on all three Vercel projects and the integration
works (verified by a test send to `dbcgermany@gmail.com` on 2026-04-18).
**However**, the `onboarding@resend.dev` shared sender rejects any recipient
other than the Resend account owner (Resend anti-abuse policy). That means:

- Newsletter broadcasts → cannot reach subscribers
- Ticket delivery → cannot reach buyers
- Staff-to-contact messages → cannot reach contacts

**Fix**: verify `dbc-germany.com` (or another owned domain) in Resend so we
can send from dedicated addresses to arbitrary recipients.

### Domain registered in Resend (2026-04-15)

Domain ID: `8263c261-d29e-4120-89af-2a7934b0bf3f` · Region: `eu-west-1`

Add these **four records** to `dbc-germany.com` in your DNS manager exactly
as shown:

| # | Type | Name / host | Value / content | Notes |
|---|------|-------------|-----------------|-------|
| 1 | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdl/Qv7BCbC3/BLyaTX/1zzwASK++NVP5NpaLQCx7RHh6CiCxST6e5jdCzU1rDpdsVWmIWG+Nctvx8bkVs+e/tjVpesSY5waQ5j9zgtH0Ff7bxgXMorSl0XvyR0DO6kkDWbg+GsSPKV4hws9XYwYvMMMUd9LH+IEzlHQtyUE3zLQIDAQAB` | DKIM — **no quotes needed** in most DNS editors; paste the whole `p=…` string verbatim |
| 2 | MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` priority **10** | Bounce/complaint feedback (EU region) |
| 3 | TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for the `send` subdomain |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@dbc-germany.com` | **Recommended**. Start with `p=none`; raise to `p=quarantine` later once you've monitored aggregate reports for a week |

Propagation is usually 5–30 minutes. Once the records resolve, Resend will
auto-verify. If it doesn't, tell me and I'll hit `POST /domains/:id/verify`
from my side.

> **Cloudflare note**: make sure the TXT records are NOT proxied (grey cloud
> only applies to CNAME/A, but verify the "DNS only" badge anyway).

### Once verified — update Vercel env vars

Set these on all three Vercel projects (admin, tickets, site):

- `RESEND_FROM_ADDRESS` = `DBC Germany <tickets@dbc-germany.com>` (transactional + receipts)
- `RESEND_NEWSLETTER_FROM` = `DBC Germany <newsletter@dbc-germany.com>`
- `RESEND_STAFF_FROM_ADDRESS` = `DBC Germany <hello@dbc-germany.com>`

Redeploy the three apps after the env vars are set. No code changes required — the
fallback in `packages/email/src/client.ts` (`fromAddressFor`) will pick the env
values automatically.

### Mailbox reality check
The reply-to addresses (`hello@`, `tickets@`, `newsletter@`) should actually
receive mail — otherwise replies bounce. Point them to existing Google Workspace /
Apple Mail / whatever aliases the team already uses.

### List-Unsubscribe mailto fallback
After the domain is verified, also set up `unsubscribe@dbc-germany.com` as
an alias, and add it as a fallback to the existing HTTP unsubscribe URL in
`packages/email/src/send-newsletter.ts`. Gmail's spam score improves when
both headers are present.

---

## 2. Vercel: upgrade team to Pro + restore production cron cadences

**Status**: Tickets app has crippled cron schedules (all daily) because the
Vercel team `dbcgermany-7280s-projects` is on Hobby since 2026-04-15.

**Fix**: upgrade to Pro ($20/mo/member). Then edit `apps/tickets/vercel.json`
and restore the production schedules:

```json
{
  "crons": [
    { "path": "/api/cron/email-sequences",      "schedule": "0 * * * *" },
    { "path": "/api/cron/waitlist",             "schedule": "0 * * * *" },
    { "path": "/api/cron/kpi-snapshots",        "schedule": "0 2 * * *" },
    { "path": "/api/cron/release-reservations", "schedule": "*/5 * * * *" }
  ]
}
```

Why this matters:
- **release-reservations every 5 minutes**: Stripe's 30-min session expiry
  already releases seats via webhook, but when Stripe fails to fire (outage,
  network), this sweeper is the backup. Daily means abandoned seats hang for
  up to 24h during active launches. Revenue risk.
- **email-sequences hourly**: post-event aftercare emails (delay_days based)
  fire on the hour. Daily means they can be up to 23h late.

---

## 3. Security tab: per-session revoke

Supabase Auth does not expose `auth.sessions` through the public SDK. The
admin API has `signOut(userId, 'global')` but no single-session revoke.

Current UI: "Sign out everywhere". No list of active browsers/devices.

**Fix options**:
- Write a `list_my_sessions()` RPC that reads `auth.sessions` with
  `SECURITY DEFINER`, plus a `revoke_session(session_id)` RPC that deletes
  the row.
- Surface the list + per-row revoke button in the Security tab.

Lower priority than 2FA (already shipped) — sign-out-everywhere covers the
compromised-account scenario.

---

## 4. Middleware AAL gate

2FA is implemented (TOTP + backup codes), but there is no middleware check
that forces the MFA challenge on sign-in for users who have a verified
factor. Users with 2FA enabled currently sign in with just password; the
challenge is only needed on explicit elevation.

**Fix**: extend `apps/admin/src/middleware.ts` to check
`supabase.auth.getAuthenticatorAssuranceLevel()` and redirect to a
`/mfa-challenge` page when the session is `aal1` and the user has a factor.

---

## 5. SMS / WhatsApp notifications (nice-to-have)

Event reminders, ticket delivery fallback, VIP outreach. Requires a separate
provider (Twilio, Messagebird) + new plan file.

---

## 6. Audit-log viewer filters

The audit_log table accumulates rows fast. Basic list view exists; filtering
by actor, entity_type, action, date range would make incident response
faster.
