// Read-only production-readiness verifier.
//
// Answers "is this item actually green?" for every gate in
// docs/PRELAUNCH_CHECKLIST.md by asking the live systems, so the checklist
// records evidence instead of assumptions.
//
// STRICTLY READ-ONLY. Every call is a GET (or a PostgREST select). Nothing
// here creates, mutates, or deletes — it is safe to run against production at
// any time, including on event day. Cron endpoints are deliberately NOT hit:
// firing them mutates state, so cron health is checked from Vercel's own
// records instead.
//
// Secrets are never stored in this repo. Tokens come from the environment
// when set, otherwise they are read out of ../cred/credentials.md (the
// sibling folder outside the repo).
//
// Usage:
//   node scripts/verify-readiness.mjs
//   node scripts/verify-readiness.mjs --json    # machine-readable
//
// Exit code: 0 when every check produced a verdict (PASS/FAIL/WARN).
//            1 when a check could not run at all (missing token, network,
//            unexpected shape) — an ERROR row means "unknown", which is the
//            one outcome the checklist must never record as green.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CRED_FILE = join(REPO_ROOT, "..", "cred", "credentials.md");
const JSON_OUT = process.argv.includes("--json");

// ---------------------------------------------------------------- constants

const SUPABASE_REF = "rcqgsexfuaoiiuqcqeka";
const SUPABASE_URL = `https://${SUPABASE_REF}.supabase.co`;
const RESEND_DOMAIN_ID = "8263c261-d29e-4120-89af-2a7934b0bf3f";
const STRIPE_LIVE_WEBHOOK_ID = "we_1TMbbhCskIJw43NFk48jxT8w";
const VERCEL_TEAM_ID = "team_EEPrSTrl7mHIWDZmZhIbtlUb";

const VERCEL_PROJECTS = {
  admin: "prj_tR1Lt3cPHTRDH4PKRZR5bzR47Ysz",
  tickets: "prj_wrJNDjQVFDOmaEq95OHvEDz4dFgt",
  site: "prj_AkJ7RBy4LCBC5PutJYWLQMoGUAAC",
};

const APP_ORIGINS = {
  site: "https://dbc-germany.com",
  tickets: "https://tickets.dbc-germany.com",
  admin: "https://admin.dbc-germany.com",
};

// The webhook events the Stripe integration relies on. Drift here means a
// buyer can pay and never receive a ticket.
const REQUIRED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
];

// Impressum fields required by §5 DDG for a registered UG.
const IMPRESSUM_FIELDS = [
  "hrb_number",
  "hrb_court",
  "vat_id",
  "tax_id",
  "chamber_of_commerce",
];

// Env vars that must exist in Production scope on every project. Only NAMES
// are ever read or printed — never values.
const REQUIRED_ENV_BY_PROJECT = {
  tickets: [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "RESEND_WEBHOOK_SECRET",
    "CRON_SECRET",
    "TURNSTILE_SECRET_KEY",
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  ],
  admin: [
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "CRON_SECRET",
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  ],
  site: [
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  ],
};

// ------------------------------------------------------------------ secrets

function loadSecrets() {
  const fromEnv = {
    stripe: process.env.STRIPE_LIVE_KEY,
    resend: process.env.RESEND_API_KEY,
    supabasePat: process.env.SUPABASE_ACCESS_TOKEN,
    supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY,
    vercel: process.env.VERCEL_TOKEN,
  };
  if (Object.values(fromEnv).every(Boolean)) return fromEnv;

  // Fall back to the out-of-repo credentials file. Tokens are matched by
  // their provider prefix rather than by surrounding prose, so reformatting
  // the document doesn't break this.
  let doc = "";
  try {
    doc = readFileSync(CRED_FILE, "utf8");
  } catch {
    return fromEnv; // caller reports the individual missing tokens
  }
  const first = (re) => doc.match(re)?.[0];
  return {
    stripe: fromEnv.stripe ?? first(/rk_live_[A-Za-z0-9]+/),
    resend: fromEnv.resend ?? first(/re_[A-Za-z0-9_]+/),
    supabasePat: fromEnv.supabasePat ?? first(/sbp_[a-f0-9]+/),
    supabaseService:
      fromEnv.supabaseService ??
      doc.match(/eyJ[A-Za-z0-9._-]+service_role[A-Za-z0-9._-]*/)?.[0] ??
      // the role name lives inside the base64 payload, so fall back to the
      // key that sits in the "Service Role" table row
      doc
        .split("\n")
        .find((l) => /Service Role/i.test(l))
        ?.match(/eyJ[A-Za-z0-9._-]+/)?.[0],
    vercel: fromEnv.vercel ?? first(/vcp_[A-Za-z0-9]+/),
  };
}

const SECRETS = loadSecrets();

// -------------------------------------------------------------------- rows

const rows = [];

function add(area, item, status, detail) {
  rows.push({ area, item, status, detail });
}

/** Wrap a check so an unexpected throw becomes an ERROR row, not a crash. */
async function check(area, item, fn) {
  try {
    await fn((status, detail) => add(area, item, status, detail));
  } catch (err) {
    add(area, item, "ERROR", err?.message ?? String(err));
  }
}

async function getJson(url, options = {}) {
  const res = await fetch(url, { ...options, method: "GET" });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" ? (body?.error?.message ?? body?.message) : body;
    throw new Error(`HTTP ${res.status} — ${String(msg).slice(0, 160)}`);
  }
  return body;
}

function requireToken(name, token) {
  if (!token) throw new Error(`no ${name} token in env or ../cred/credentials.md`);
  return token;
}

// ------------------------------------------------------------------ Stripe

async function stripeChecks() {
  const key = () => requireToken("Stripe live", SECRETS.stripe);
  const auth = () => ({
    headers: { Authorization: `Basic ${Buffer.from(`${key()}:`).toString("base64")}` },
  });

  let account = null;

  await check("Stripe", "Live account can charge + pay out", async (report) => {
    account = await getJson("https://api.stripe.com/v1/account", auth());
    const ok = account.charges_enabled && account.payouts_enabled;
    const req = account.requirements ?? {};
    // When Stripe disables an account the reason and the outstanding fields
    // are the whole story — surface them, because "charges_enabled=false"
    // alone doesn't tell anyone what to go and do.
    const why = ok
      ? ""
      : ` · disabled_reason=${req.disabled_reason}` +
        ` · past_due=[${(req.past_due ?? []).join(", ")}]` +
        (req.current_deadline
          ? ` · deadline was ${new Date(req.current_deadline * 1000).toISOString().slice(0, 10)}`
          : "");
    report(
      ok ? "PASS" : "FAIL",
      `charges_enabled=${account.charges_enabled} payouts_enabled=${account.payouts_enabled} (${account.id})${why}`,
    );
  });

  await check("Stripe", "Recent successful charge", async (report) => {
    const charges = await getJson("https://api.stripe.com/v1/charges?limit=1", auth());
    const last = charges.data?.[0];
    if (!last) {
      report("WARN", "no charges on the live account yet");
      return;
    }
    const days = Math.round((Date.now() - last.created * 1000) / 864e5);
    report(
      days <= 30 ? "PASS" : "WARN",
      `last charge ${new Date(last.created * 1000).toISOString().slice(0, 10)} (${days}d ago) · ${(last.amount / 100).toFixed(2)} ${last.currency} · ${last.status}`,
    );
  });

  await check("Stripe", "Tax ID on account (receipts show VAT info)", async (report) => {
    if (!account) throw new Error("account lookup failed above");
    const taxIds = account.company?.tax_id_provided ?? false;
    const vat = account.company?.vat_id_provided ?? false;
    report(
      taxIds || vat ? "PASS" : "FAIL",
      `tax_id_provided=${taxIds} vat_id_provided=${vat}`,
    );
  });

  await check("Stripe", "Payment method capabilities", async (report) => {
    if (!account) throw new Error("account lookup failed above");
    const caps = account.capabilities ?? {};
    const interesting = [
      "card_payments",
      "klarna_payments",
      "sepa_debit_payments",
      "paypal_payments",
      "link_payments",
    ];
    const summary = interesting
      .map((c) => `${c.replace("_payments", "")}=${caps[c] ?? "unset"}`)
      .join(" ");
    const inactive = interesting.filter((c) => caps[c] && caps[c] !== "active");
    report(caps.card_payments === "active" ? (inactive.length ? "WARN" : "PASS") : "FAIL", summary);
  });

  await check("Stripe", "Live webhook endpoint + subscribed events", async (report) => {
    const list = await getJson(
      "https://api.stripe.com/v1/webhook_endpoints?limit=100",
      auth(),
    );
    const ep = list.data?.find((e) => e.id === STRIPE_LIVE_WEBHOOK_ID);
    if (!ep) {
      report("FAIL", `${STRIPE_LIVE_WEBHOOK_ID} not found on the live account`);
      return;
    }
    const subscribed = new Set(ep.enabled_events ?? []);
    const missing = REQUIRED_STRIPE_EVENTS.filter(
      (e) => !subscribed.has(e) && !subscribed.has("*"),
    );
    report(
      ep.status === "enabled" && missing.length === 0 ? "PASS" : "FAIL",
      `status=${ep.status} events=${ep.enabled_events?.length ?? 0}` +
        (missing.length ? ` MISSING: ${missing.join(", ")}` : ""),
    );
  });

  await check("Stripe", "Stripe Tax active + DE registration", async (report) => {
    const settings = await getJson("https://api.stripe.com/v1/tax/settings", auth());
    const regs = await getJson(
      "https://api.stripe.com/v1/tax/registrations?status=active&limit=100",
      auth(),
    );
    const de = regs.data?.some((r) => r.country === "DE");
    report(
      settings.status === "active" && de ? "PASS" : settings.status === "active" ? "WARN" : "FAIL",
      `settings=${settings.status} active_registrations=${regs.data?.length ?? 0} DE=${de ? "yes" : "no"}`,
    );
  });

  await check("Stripe", "Payout schedule", async (report) => {
    if (!account) throw new Error("account lookup failed above");
    const s = account.settings?.payouts?.schedule ?? {};
    report("PASS", `interval=${s.interval ?? "unknown"} delay_days=${s.delay_days ?? "-"}`);
  });
}

// ------------------------------------------------------------------ Resend

async function resendChecks() {
  const auth = () => ({
    headers: { Authorization: `Bearer ${requireToken("Resend", SECRETS.resend)}` },
  });

  await check("Resend", "Sending domain verified", async (report) => {
    const d = await getJson(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}`, auth());
    const bad = (d.records ?? []).filter((r) => r.status && r.status !== "verified");
    report(
      d.status === "verified" ? "PASS" : "FAIL",
      `${d.name} status=${d.status} region=${d.region}` +
        (bad.length ? ` unverified_records=${bad.map((r) => r.record).join(",")}` : ""),
    );
  });

  await check("Resend", "Bounce/complaint webhook live", async (report) => {
    const list = await getJson("https://api.resend.com/webhooks", auth());
    const hooks = list.data ?? [];
    const ours = hooks.find((h) => String(h.endpoint ?? h.url ?? "").includes("dbc-germany.com"));
    if (!ours) {
      report("WARN", `no dbc-germany webhook among ${hooks.length} (endpoint may be listed differently)`);
      return;
    }
    report(
      ours.status === "enabled" || ours.status === "active" ? "PASS" : "WARN",
      `status=${ours.status ?? "unknown"} events=${(ours.events ?? []).join(",")}`,
    );
  });
}

// ---------------------------------------------------------------- Supabase

async function supabaseChecks() {
  const mgmt = () => ({
    headers: { Authorization: `Bearer ${requireToken("Supabase PAT", SECRETS.supabasePat)}` },
  });

  await check("Supabase", "Project healthy (not paused)", async (report) => {
    const projects = await getJson("https://api.supabase.com/v1/projects", mgmt());
    const p = Array.isArray(projects) ? projects.find((x) => x.id === SUPABASE_REF) : null;
    if (!p) {
      report("FAIL", `project ${SUPABASE_REF} not visible to this token`);
      return;
    }
    report(
      p.status === "ACTIVE_HEALTHY" ? "PASS" : "FAIL",
      `status=${p.status} region=${p.region} created=${String(p.created_at).slice(0, 10)}`,
    );
  });

  await check("Supabase", "Organisation plan", async (report) => {
    const orgs = await getJson("https://api.supabase.com/v1/organizations", mgmt());
    const stub = orgs?.[0];
    if (!stub?.id) throw new Error("no organisation visible to this token");
    // The list endpoint omits `plan`; only the single-org GET carries it.
    const org = await getJson(`https://api.supabase.com/v1/organizations/${stub.id}`, mgmt());
    if (!org?.plan) throw new Error("organisation response carried no plan field");
    // Free tier means no daily backups and idle-pause after inactivity — both
    // fatal for a live ticketing database.
    report(
      org.plan === "free" ? "FAIL" : "PASS",
      `${org.name} plan=${org.plan}` +
        (org.plan === "free" ? " — no daily backups, project can be auto-paused" : ""),
    );
  });

  await check("Supabase", "Backup recency (RPO)", async (report) => {
    const b = await getJson(
      `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/backups`,
      mgmt(),
    );
    const list = b.backups ?? [];
    if (!list.length) {
      report(
        "FAIL",
        `ZERO restorable snapshots (pitr=${b.pitr_enabled}, walg=${b.walg_enabled}) — unrecoverable data loss risk`,
      );
      return;
    }
    const newest = list
      .map((x) => new Date(x.inserted_at).getTime())
      .sort((a, z) => z - a)[0];
    const ageH = Math.round((Date.now() - newest) / 36e5);
    report(
      ageH <= 48 ? "PASS" : "WARN",
      `${list.length} snapshots · newest ${ageH}h old · pitr=${b.pitr_enabled}`,
    );
  });
}

// --------------------------------------------------------------- PostgREST

async function restSelect(path) {
  const key = requireToken("Supabase service-role", SECRETS.supabaseService);
  return getJson(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
}

async function contentChecks() {
  let event = null;

  await check("Content", "Impressum fields (§5 DDG)", async (report) => {
    const [info] = await restSelect(
      `company_info?select=${IMPRESSUM_FIELDS.join(",")},legal_name,legal_form&limit=1`,
    );
    if (!info) {
      report("FAIL", "no company_info row");
      return;
    }
    const missing = IMPRESSUM_FIELDS.filter((f) => !info[f]);
    report(
      missing.length ? "FAIL" : "PASS",
      missing.length
        ? `NULL: ${missing.join(", ")} · legal_name="${info.legal_name}" legal_form="${info.legal_form ?? "—"}"`
        : `all present · legal_name="${info.legal_name}"`,
    );
  });

  await check("Content", "Next event published + dated", async (report) => {
    const nowIso = new Date().toISOString();
    const list = await restSelect(
      `events?select=id,slug,title_en,starts_at,ends_at,timezone,is_published,venue_name,city,seo_description&starts_at=gte.${nowIso}&order=starts_at.asc&limit=1`,
    );
    event = list[0] ?? null;
    if (!event) {
      report("FAIL", "no upcoming event rows");
      return;
    }
    const days = Math.round((new Date(event.starts_at) - Date.now()) / 864e5);
    report(
      event.is_published ? "PASS" : "FAIL",
      `${event.slug} · ${String(event.starts_at).slice(0, 16)} · ${event.venue_name ?? "?"} · T-${days}d · published=${event.is_published}`,
    );
  });

  await check("Content", "Event copy free of stale dates", async (report) => {
    if (!event) throw new Error("event lookup failed above");
    // Any date string in the copy that disagrees with starts_at is a live
    // mis-sell: the countdown says one date, the persuasion copy another.
    const eventDay = new Date(event.starts_at);
    const monthNames = {
      en: eventDay.toLocaleString("en", { month: "long", timeZone: "UTC" }),
      de: eventDay.toLocaleString("de", { month: "long", timeZone: "UTC" }),
      fr: eventDay.toLocaleString("fr", { month: "long", timeZone: "UTC" }),
    };
    const cols = [
      "funnel_intro_en", "funnel_intro_de", "funnel_intro_fr",
      "funnel_tagline_en", "funnel_tagline_de", "funnel_tagline_fr",
      "funnel_closing_en", "funnel_closing_de", "funnel_closing_fr",
      "description_en", "description_de", "description_fr",
      "seo_title", "seo_description",
    ];
    const [row] = await restSelect(`events?select=${cols.join(",")}&id=eq.${event.id}`);
    const stale = /\b13\.?\s?(June|Juni|juin)\b|\bJune\s?13\b|\b13 juin\b|2026-06-13/i;
    const hits = Object.entries(row ?? {})
      .filter(([, v]) => typeof v === "string" && stale.test(v))
      .map(([k]) => k);
    report(
      hits.length ? "FAIL" : "PASS",
      hits.length
        ? `stale June-13 text in: ${hits.join(", ")} (event is ${monthNames.en} ${eventDay.getUTCDate()})`
        : `no stale dates in ${cols.length} copy columns`,
    );
  });

  await check("Content", "Ticket inventory on sale", async (report) => {
    if (!event) throw new Error("event lookup failed above");
    const tiers = await restSelect(
      `ticket_tiers?select=slug,name_en,price_cents,currency,max_quantity,quantity_sold,is_public,sales_start_at,sales_end_at&event_id=eq.${event.id}&order=sort_order.asc`,
    );
    const pub = tiers.filter((t) => t.is_public);
    const sold = tiers.reduce((s, t) => s + (t.quantity_sold ?? 0), 0);
    const cap = pub.reduce((s, t) => s + (t.max_quantity ?? 0), 0);
    report(
      pub.length ? "PASS" : "FAIL",
      `${pub.length} public tier(s) of ${tiers.length} · sold=${sold}` +
        (cap ? ` / cap=${cap}` : " / uncapped") +
        ` · from €${(Math.min(...pub.map((t) => t.price_cents)) / 100).toFixed(2)}`,
    );
  });

  await check("Content", "Paid orders on the next event", async (report) => {
    if (!event) throw new Error("event lookup failed above");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=id&event_id=eq.${event.id}&status=eq.paid`,
      {
        headers: {
          apikey: SECRETS.supabaseService,
          Authorization: `Bearer ${SECRETS.supabaseService}`,
          Prefer: "count=exact",
          Range: "0-0",
        },
      },
    );
    const total = res.headers.get("content-range")?.split("/")[1] ?? "?";
    // Pending orders older than the reservation window mean the release
    // sweeper or the webhook is not doing its job.
    const stuck = await restSelect(
      `orders?select=id&event_id=eq.${event.id}&status=eq.pending&reservation_expires_at=lt.${new Date().toISOString()}`,
    );
    report(
      stuck.length ? "WARN" : "PASS",
      `paid=${total} · expired-but-pending=${stuck.length}`,
    );
  });
}

// ------------------------------------------------------------------ Vercel

async function vercelChecks() {
  const auth = () => ({
    headers: { Authorization: `Bearer ${requireToken("Vercel", SECRETS.vercel)}` },
  });

  for (const [app, projectId] of Object.entries(VERCEL_PROJECTS)) {
    await check("Vercel", `${app}: latest production deploy`, async (report) => {
      const d = await getJson(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${VERCEL_TEAM_ID}&target=production&limit=1`,
        auth(),
      );
      const dep = d.deployments?.[0];
      if (!dep) {
        report("FAIL", "no production deployments");
        return;
      }
      const ageD = Math.round((Date.now() - dep.created) / 864e5);
      report(
        dep.state === "READY" ? "PASS" : "FAIL",
        `${dep.state} · ${ageD}d old · ${String(dep.meta?.githubCommitSha ?? "").slice(0, 7)}`,
      );
    });

    await check("Vercel", `${app}: production env vars present`, async (report) => {
      const e = await getJson(
        `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${VERCEL_TEAM_ID}`,
        auth(),
      );
      // Names only — values are never requested, decrypted, or printed.
      const prod = new Set(
        (e.envs ?? [])
          .filter((v) => (v.target ?? []).includes("production"))
          .map((v) => v.key),
      );
      const missing = (REQUIRED_ENV_BY_PROJECT[app] ?? []).filter((k) => !prod.has(k));
      report(
        missing.length ? "FAIL" : "PASS",
        missing.length ? `MISSING: ${missing.join(", ")}` : `${prod.size} vars, all required present`,
      );
    });
  }

  await check("Vercel", "Team plan", async (report) => {
    const t = await getJson(`https://api.vercel.com/v2/teams/${VERCEL_TEAM_ID}`, auth());
    const plan = t.billing?.plan;
    // Hobby caps cron jobs at 2 and refuses sub-daily schedules, so the
    // schedules declared in vercel.json silently never register.
    report(plan === "hobby" ? "FAIL" : "PASS", `plan=${plan ?? "unknown"}`);
  });

  await check("Vercel", "Cron schedules actually registered", async (report) => {
    // The authority is what Vercel registered on the live deployment, NOT
    // what vercel.json declares. These disagree whenever the plan can't
    // support the declared schedules — and the deployment still builds green,
    // so nothing surfaces the gap except this check.
    const declared = {};
    for (const app of ["tickets", "admin"]) {
      try {
        const cfg = JSON.parse(readFileSync(join(REPO_ROOT, "apps", app, "vercel.json"), "utf8"));
        declared[app] = (cfg.crons ?? []).length;
      } catch {
        declared[app] = 0;
      }
    }
    const out = [];
    let anyMissing = false;
    for (const app of ["tickets", "admin", "site"]) {
      const p = await getJson(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECTS[app]}?teamId=${VERCEL_TEAM_ID}`,
        auth(),
      );
      const defs = p.crons?.definitions ?? [];
      const want = declared[app] ?? 0;
      if (want > 0 && defs.length === 0) anyMissing = true;
      out.push(`${app}: ${defs.length} registered / ${want} declared`);
    }
    report(
      anyMissing ? "FAIL" : "PASS",
      out.join(" · ") + (anyMissing ? " — declared crons are NOT running" : ""),
    );
  });
}

// ------------------------------------------------------------------ health

async function healthChecks() {
  for (const [app, origin] of Object.entries(APP_ORIGINS)) {
    await check("Health", `${app}: /api/health?deep=1`, async (report) => {
      const started = Date.now();
      const body = await getJson(`${origin}/api/health?deep=1`);
      const ms = Date.now() - started;
      const ok = body?.status === "ok" || body?.ok === true;
      report(ok ? "PASS" : "WARN", `${ms}ms · ${JSON.stringify(body).slice(0, 110)}`);
    });
  }
}

// --------------------------------------------------------------------- DNS

async function dnsQuery(name, type) {
  const r = await getJson(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
  );
  return (r.Answer ?? []).map((a) => String(a.data).replace(/^"|"$/g, ""));
}

async function dnsChecks() {
  await check("DNS", "Google Workspace MX on apex (receiving)", async (report) => {
    const mx = await dnsQuery("dbc-germany.com", "MX");
    const google = mx.filter((m) => m.includes("aspmx.l.google.com"));
    report(google.length ? "PASS" : "FAIL", `${mx.length} MX · google=${google.length}`);
  });

  await check("DNS", "Apex SPF is Google (not overwritten)", async (report) => {
    const txt = await dnsQuery("dbc-germany.com", "TXT");
    const spf = txt.find((t) => t.startsWith("v=spf1"));
    report(
      spf?.includes("_spf.google.com") ? "PASS" : "FAIL",
      spf ? spf.slice(0, 90) : "no SPF record",
    );
  });

  await check("DNS", "Resend DKIM + send-subdomain records", async (report) => {
    const [dkim, sendSpf, sendMx] = await Promise.all([
      dnsQuery("resend._domainkey.dbc-germany.com", "TXT"),
      dnsQuery("send.dbc-germany.com", "TXT"),
      dnsQuery("send.dbc-germany.com", "MX"),
    ]);
    const ok =
      dkim.some((d) => d.includes("p=")) &&
      sendSpf.some((s) => s.includes("amazonses.com")) &&
      sendMx.some((m) => m.includes("feedback-smtp"));
    report(
      ok ? "PASS" : "FAIL",
      `dkim=${dkim.length ? "yes" : "no"} send-spf=${sendSpf.length ? "yes" : "no"} send-mx=${sendMx.length ? "yes" : "no"}`,
    );
  });

  await check("DNS", "DMARC policy", async (report) => {
    const txt = await dnsQuery("_dmarc.dbc-germany.com", "TXT");
    const dmarc = txt.find((t) => t.startsWith("v=DMARC1"));
    if (!dmarc) {
      report("WARN", "no _dmarc record");
      return;
    }
    // Strato's DNS wizard ships a German placeholder address; if it survived,
    // every aggregate report is being posted into the void.
    const rua = dmarc.match(/rua=mailto:([^;\s]+)/)?.[1];
    const placeholder = rua && !rua.endsWith("dbc-germany.com");
    report(
      placeholder ? "WARN" : "PASS",
      dmarc.slice(0, 90) + (placeholder ? ` — rua "${rua}" is not a DBC address` : ""),
    );
  });

  await check("DNS", "Search Console verification token", async (report) => {
    const txt = await dnsQuery("dbc-germany.com", "TXT");
    const gsc = txt.filter((t) => t.startsWith("google-site-verification="));
    const [info] = await restSelect("company_info?select=google_site_verification&limit=1");
    const stored = info?.google_site_verification ?? null;
    const match = stored && gsc.some((t) => t.includes(stored));
    report(
      gsc.length ? (stored && !match ? "WARN" : "PASS") : "FAIL",
      `${gsc.length} token(s) live` +
        (stored ? ` · company_info token ${match ? "matches" : "DOES NOT match DNS"}` : " · none stored in company_info"),
    );
  });
}

// ------------------------------------------------------------------ output

function render() {
  if (JSON_OUT) {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 2));
    return;
  }
  const w = (s, n) => String(s).padEnd(n).slice(0, n);
  const icon = { PASS: "PASS ✅", FAIL: "FAIL ❌", WARN: "WARN ⚠️ ", ERROR: "ERR  ⛔" };

  console.log(`\nReadiness verification — ${new Date().toISOString()}`);
  console.log("Read-only: every call above is a GET. No state was changed.\n");
  console.log(`${w("AREA", 10)} ${w("CHECK", 44)} ${w("STATUS", 8)} DETAIL`);
  console.log("-".repeat(140));
  for (const r of rows) {
    console.log(`${w(r.area, 10)} ${w(r.item, 44)} ${w(icon[r.status], 8)} ${r.detail}`);
  }
  const tally = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log("-".repeat(140));
  console.log(
    `${rows.length} checks · ${tally.PASS ?? 0} pass · ${tally.FAIL ?? 0} fail · ${tally.WARN ?? 0} warn · ${tally.ERROR ?? 0} error\n`,
  );
}

// -------------------------------------------------------------------- main

await stripeChecks();
await resendChecks();
await supabaseChecks();
await contentChecks();
await vercelChecks();
await healthChecks();
await dnsChecks();

render();
process.exit(rows.some((r) => r.status === "ERROR") ? 1 : 0);
