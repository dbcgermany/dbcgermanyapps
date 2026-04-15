# Follow-ups — open work after account-area overhaul

Living doc. Close items by editing this file; don't track them elsewhere.

---

## 0. Mail architecture decision (locked 2026-04-16)

**Two mail systems coexist on `dbc-germany.com`:**

1. **Google Workspace** handles RECEIVING for every `@dbc-germany.com`
   address + SENDING for human-staffed mailboxes (`info@`, `sales@`,
   `marketing@`, `community@`, `support@`, `press@`, `careers@`, etc.).
2. **Resend** handles SENDING only from six reserved addresses. Replies
   to these don't reach humans — they bounce or silently drop.

**Resend-only senders (no human reads these inboxes):**

| Address | Used for |
|---|---|
| `noreply@dbc-germany.com` | Transactional default — admin alerts, waitlist, aftercare, staff-to-contact |
| `tickets@dbc-germany.com` | Ticket delivery, order receipts, transfer confirmations |
| `newsletter@dbc-germany.com` | Newsletter broadcasts + double-opt-in confirm |
| `password@dbc-germany.com` | Supabase Auth (password reset, magic link, signup confirm, email change, reauth, invite) |
| `security@dbc-germany.com` | _Future_: new-device login alerts, 2FA enabled/disabled, password-changed confirmation |
| `unsubscribe@dbc-germany.com` | Sink only — referenced in `List-Unsubscribe: <mailto:unsubscribe@…>` header. Not monitored; Gmail + Apple Mail use it for one-click unsub. |

**Reply-To on Resend emails**: _none_. Users who want to reply are directed
to the website contact form or the appropriate Google mailbox.

**DNS implications (critical)**:
- Apex `dbc-germany.com` **MX + SPF + DKIM must stay** = Google Workspace.
- Resend records live on **subdomains only** (`send.`, `resend._domainkey.`)
  — zero overlap with Google.
- Both systems coexist because Resend uses `send.dbc-germany.com` as its
  Return-Path (hence its own SPF on that subdomain, not on apex).

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

### Strato-specific walkthrough (Google-Workspace-safe)

**Do not touch these records** (they are Google Workspace):
- Apex `dbc-germany.com` MX → `aspmx.l.google.com.` + `alt*.aspmx.l.google.com.`
- Apex TXT → `v=spf1 include:_spf.google.com ~all`
- Any TXT `google._domainkey` / `google2025._domainkey` etc. (Google DKIM selectors)

**Add only these four records** (all on subdomains — none touch the apex):

| Subdomain / Name | Typ | Prio | Wert |
|---|---|---|---|
| `resend._domainkey` | TXT | – | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDdl/Qv7BCbC3/BLyaTX/1zzwASK++NVP5NpaLQCx7RHh6CiCxST6e5jdCzU1rDpdsVWmIWG+Nctvx8bkVs+e/tjVpesSY5waQ5j9zgtH0Ff7bxgXMorSl0XvyR0DO6kkDWbg+GsSPKV4hws9XYwYvMMMUd9LH+IEzlHQtyUE3zLQIDAQAB` |
| `send` | MX | `10` | `feedback-smtp.eu-west-1.amazonses.com.` (trailing dot is fine) |
| `send` | TXT | – | `v=spf1 include:amazonses.com ~all` |
| `_dmarc` | TXT | – | `v=DMARC1; p=none; rua=mailto:info@dbc-germany.com` (**replace the current** `deine@email.de` **placeholder**) |

Notes for Strato's editor:
- Strato shows subdomain only; you type `resend._domainkey` (not the full
  `resend._domainkey.dbc-germany.com`).
- For MX, Strato wants the priority in its own field; use `10`.
- Don't wrap the TXT values in extra quotes — Strato adds them.
- The `send` MX here will have a note warning about "wildcard override" —
  that's expected. Strato's default wildcard MX points at `smtpin.rzone.de`
  (which is why `send.dbc-germany.com` currently resolves there). Adding
  this specific MX overrides the wildcard for `send` only; all other
  subdomains stay on Strato's default.
- After saving, click "Aktualisieren"; propagation is 5–30 minutes.

The DMARC record is the only one that touches reporting — it's compatible
with both Google and Resend. `rua=mailto:info@dbc-germany.com` sends the
daily aggregate reports to Google Workspace (info@ goes to your inbox).
Later, move to `p=quarantine` once you've verified nothing legitimate is
bouncing.

> **Not applicable** (we're on Strato, not Cloudflare): TXT records must be
> "DNS only", never proxied.

### Once verified — Vercel env vars

Env vars are already set on all three projects (admin, tickets, site) with
these values; no further action unless you want to change them:

```
RESEND_FROM_ADDRESS        = DBC Germany <noreply@dbc-germany.com>
RESEND_TICKETS_FROM        = DBC Germany <tickets@dbc-germany.com>
RESEND_NEWSLETTER_FROM     = DBC Germany <newsletter@dbc-germany.com>
RESEND_UNSUBSCRIBE_MAILTO  = unsubscribe@dbc-germany.com
```

The three apps will auto-use them once Resend verifies the domain. Until
then emails go through `onboarding@resend.dev` (Resend owner only).

### Supabase Auth SMTP (for `password@`)

Supabase Auth needs to be pointed at Resend's SMTP to send from
`password@dbc-germany.com`. **I can't configure this via API without a
Management PAT** — you (or I, if you share a PAT) set it in the dashboard:

1. Go to **Supabase dashboard → Project `rcqgsexfuaoiiuqcqeka` → Authentication → Emails → SMTP Settings**.
2. Enable **"Enable custom SMTP"** toggle.
3. Fill in:
   - **Sender email**: `password@dbc-germany.com`
   - **Sender name**: `DBC Germany`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) — or `587` (STARTTLS), either works
   - **Username**: `resend`
   - **Password**: the Resend API key (saved in `credentials.md`)
4. Save. Send a test email via the "Reset password" preview to confirm.

All six Supabase Auth email types — Confirm signup, Magic Link, Reset
Password, Change Email Address, Reauthentication, Invite — will now send
from `password@`.

### Reserved-but-not-yet-wired senders

- `security@dbc-germany.com` — will be used by a future flow that emails
  users on: new-device login, password changed, 2FA enabled/disabled,
  email address changed. No current code sends from it. When we build
  that flow, add `RESEND_SECURITY_FROM` env and a
  `fromAddressFor("security")` branch.
- `unsubscribe@dbc-germany.com` — sink only, not a real monitored mailbox.
  Referenced in the `List-Unsubscribe: <mailto:...>` header on newsletter
  sends so Gmail/Apple Mail one-click unsub lands somewhere acceptable.
  You can optionally create it as an alias to a deleted folder in Google
  Workspace.

### Mailbox ownership

Reply-To is **not set** on Resend emails — users are directed to the
website contact form. If you later want conversational replies from any
Resend sender, set a Reply-To pointing at the appropriate Google mailbox
(`info@`, `support@`, etc.). The code supports it per-call.

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
