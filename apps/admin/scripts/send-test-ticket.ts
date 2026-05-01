// Preview the real ticket-delivery email at a recipient inbox using LIVE
// event/tier/branding data from Supabase, with NO database writes.
// Useful for visually verifying what buyers actually receive.
//
// Usage (from dbcgermanyapps/):
//   pnpm dlx tsx --tsconfig packages/email/tsconfig.json \
//     --env-file=apps/admin/.vercel/.env.production.local \
//     apps/admin/scripts/send-test-ticket.ts
//
// The --tsconfig flag is required: it forces esbuild to use jsx: "react-jsx"
// when compiling the email package's .tsx PDF/template files, otherwise they
// fall back to classic JSX runtime and throw "React is not defined" at
// render time.
//
// Optional flags:
//   --to=a@x.com,b@y.com              one or more recipients (comma-separated; default: realjaynka@gmail.com)
//   --name="Ruth Bambi"               attendee name printed on the ticket (default: "Jay N Kalala")
//   --event-id=<uuid>                 pin a specific event (default: latest "Richesses d'Afrique")
//   --tier-id=<uuid>                  pin a specific tier (default: highest-priced public tier)
//   --skip-invitation                 only send the ticket-only emails (no formal invitation variant)
//   --only=en|de|fr                   send only one locale instead of all three
//
// Logo override: company_info.logo_light_url is currently an SVG, which
// @react-pdf/renderer cannot rasterize. The script converts the local
// dbc-logo-red-gold-full.svg to PNG via sharp and passes it as a data URI so
// the PDF renders the brand mark correctly. To make this work in production
// (real ticket sends from server actions) the company_info row must be
// updated to point at a PNG/JPG/WebP version of the logo.
//
// Caveats:
//   - QR codes embed a synthetic UUID and will NOT validate at door scanners.
//   - From-address depends on RESEND_TICKETS_FROM env (verified domain) or
//     falls back to onboarding@resend.dev which only delivers to the Resend
//     account owner.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { sendTicketEmail } from "@dbc/email";

// Small delay between Resend API calls to stay under the 2 req/s rate limit.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RATE_LIMIT_DELAY_MS = 1200;
// Resend's emails.send periodically returns "Unable to fetch data" / application_error
// for minutes at a time; only generous retry budgets get past those windows.
const MAX_ATTEMPTS = 30;
const BACKOFF_CAP_MS = 8000;

async function sendWithRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T | undefined> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message;
      const transient = msg.includes("Unable to fetch data") || msg.includes("application_error");
      if (attempt === MAX_ATTEMPTS || !transient) {
        console.error(`[err] ${label} (final, attempt ${attempt}/${MAX_ATTEMPTS}): ${msg}`);
        return undefined;
      }
      const backoff = Math.min(1500 * attempt, BACKOFF_CAP_MS);
      console.error(`[retry] ${label} attempt ${attempt}/${MAX_ATTEMPTS} failed (${msg.slice(0, 60)}…); waiting ${backoff}ms`);
      await sleep(backoff);
    }
  }
  return undefined;
}

// Public PNG version of the brand logo (flat C-arrow style), hosted on
// Supabase storage. Used in place of company_info.logo_light_url because
// @react-pdf cannot rasterize SVG and Resend's HTML processor flakes when
// <img src> resolves to SVG. Generated from the same source SVG that lives
// in storage as logo_light_url-*.svg.
const LOGO_PNG_URL =
  "https://rcqgsexfuaoiiuqcqeka.supabase.co/storage/v1/object/public/brand-assets/dbc-logo-flat.png";

type Locale = "en" | "de" | "fr";
const ALL_LOCALES: Locale[] = ["en", "de", "fr"];

function arg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const TO_LIST = (arg("to", "realjaynka@gmail.com") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ATTENDEE_NAME = (arg("name", "Jay N Kalala") ?? "Jay N Kalala").trim();
const GENDER = (arg("gender", "male") ?? "male").trim() as
  | "male"
  | "female"
  | "diverse";
const LAST_NAME = (() => {
  const explicit = arg("lastname");
  if (explicit) return explicit.trim();
  const parts = ATTENDEE_NAME.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : ATTENDEE_NAME;
})();
const EVENT_ID = arg("event-id");
const TIER_ID = arg("tier-id");
const SKIP_INVITATION = flag("skip-invitation");
const ONLY = arg("only") as Locale | undefined;
const LOCALES: Locale[] =
  ONLY && ALL_LOCALES.includes(ONLY) ? [ONLY] : ALL_LOCALES;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const TICKETS_URL =
  process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: pnpm dlx tsx --env-file=apps/admin/.vercel/.env.production.local " +
      "apps/admin/scripts/send-test-ticket.ts"
  );
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error(
    "Missing RESEND_API_KEY. Run `vercel env pull` for the admin project " +
      "into apps/admin/.vercel/.env.production.local first."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchEvent() {
  if (EVENT_ID) {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
      )
      .eq("id", EVENT_ID)
      .single();
    if (error || !data) throw new Error(`Event ${EVENT_ID} not found: ${error?.message}`);
    return data;
  }
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .ilike("title_en", "%Richesses%")
    .order("starts_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Event lookup failed: ${error.message}`);
  if (!data?.length)
    throw new Error("No event matching '%Richesses%' found. Pass --event-id=<uuid>.");
  return data[0];
}

async function fetchTier(eventId: string) {
  if (TIER_ID) {
    const { data, error } = await supabase
      .from("ticket_tiers")
      .select("id, name_en, name_de, name_fr")
      .eq("id", TIER_ID)
      .single();
    if (error || !data) throw new Error(`Tier ${TIER_ID} not found: ${error?.message}`);
    return data;
  }
  const { data, error } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr, is_public, price_cents")
    .eq("event_id", eventId)
    .order("is_public", { ascending: false })
    .order("price_cents", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Tier lookup failed: ${error.message}`);
  if (!data?.length) throw new Error(`No tiers found for event ${eventId}.`);
  return data[0];
}

type CompanyInfoRow = {
  brand_name: string | null;
  legal_name: string | null;
  legal_form: string | null;
  support_email: string | null;
  primary_color: string | null;
  logo_light_url: string | null;
  office_line1: string | null;
  office_line2: string | null;
  office_postal_code: string | null;
  office_city: string | null;
  office_country: string | null;
  phone: string | null;
};

async function fetchCompanyInfo(): Promise<CompanyInfoRow | null> {
  const { data } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url, " +
        "office_line1, office_line2, office_postal_code, office_city, office_country, phone"
    )
    .eq("id", 1)
    .maybeSingle();
  return (data as CompanyInfoRow | null) ?? null;
}

async function main() {
  if (!TO_LIST.length) {
    console.error("No recipients. Pass --to=a@x.com[,b@y.com,...]");
    process.exit(1);
  }

  console.log(`-> Recipients (${TO_LIST.length}): ${TO_LIST.join(", ")}`);
  console.log(`-> Attendee: ${ATTENDEE_NAME}`);
  const [event, companyInfo] = await Promise.all([
    fetchEvent(),
    fetchCompanyInfo(),
  ]);
  const tier = await fetchTier(event.id);

  console.log(`-> Event:  ${event.title_en} (${event.id})`);
  console.log(`-> Tier:   ${tier.name_en} (${tier.id})`);
  console.log(`-> From:   ${process.env.RESEND_TICKETS_FROM ?? process.env.RESEND_FROM_ADDRESS ?? "onboarding@resend.dev (sandbox)"}`);
  console.log(`-> Locales: ${LOCALES.join(", ")}`);
  console.log(`-> Invitation variant: ${SKIP_INVITATION ? "skipped" : "EN per recipient"}`);
  console.log(`-> Logo: ${LOGO_PNG_URL}`);
  console.log("");

  const orderUrl = `${TICKETS_URL}/en/confirmation/preview-${randomUUID()}`;
  const senderLine1 = [companyInfo?.office_line1, companyInfo?.office_line2]
    .filter(Boolean)
    .join(", ");
  const branding = {
    brandName: companyInfo?.brand_name ?? undefined,
    legalName: companyInfo?.legal_name ?? undefined,
    legalForm: companyInfo?.legal_form ?? undefined,
    supportEmail: companyInfo?.support_email ?? undefined,
    primaryColor: companyInfo?.primary_color ?? undefined,
    logoUrl: LOGO_PNG_URL,
    senderLine1: senderLine1 || undefined,
    senderPostalCode: companyInfo?.office_postal_code ?? undefined,
    senderCity: companyInfo?.office_city ?? undefined,
    senderCountry: companyInfo?.office_country ?? undefined,
    senderPhone: companyInfo?.phone ?? undefined,
  };

  const eventCommon = {
    eventType: event.event_type,
    startsAt: new Date(event.starts_at),
    endsAt: new Date(event.ends_at),
    venueName: event.venue_name ?? "",
    venueAddress: event.venue_address ?? "",
    city: event.city ?? "",
    timezone: event.timezone,
    attendeeName: ATTENDEE_NAME,
    orderUrl,
    ...branding,
  };

  const titleFor = (loc: Locale) =>
    (event[`title_${loc}` as const] as string) || event.title_en;
  const tierFor = (loc: Locale) =>
    (tier[`name_${loc}` as const] as string) || tier.name_en;

  // Ticket-only emails: one per (recipient × locale)
  for (const to of TO_LIST) {
    for (const loc of LOCALES) {
      const ticketToken = randomUUID();
      const label = `mode=ticket-only to=${to} locale=${loc}`;
      const result = await sendWithRetry(label, () =>
        sendTicketEmail({
          ...eventCommon,
          attendeeEmail: to,
          eventTitle: titleFor(loc),
          tierName: tierFor(loc),
          ticketToken,
          locale: loc,
          isInvitation: false,
        })
      );
      if (result) {
        console.log(`[ok] mode=ticket-only to=${to.padEnd(28)} locale=${loc} id=${result.id}`);
      }
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Invitation emails (formal salutation + DIN A4 letter PDF):
  // one per (recipient × locale), unless --skip-invitation
  if (!SKIP_INVITATION) {
    for (const to of TO_LIST) {
      for (const loc of LOCALES) {
        const ticketToken = randomUUID();
        const label = `mode=invitation to=${to} locale=${loc}`;
        const result = await sendWithRetry(label, () =>
          sendTicketEmail({
            ...eventCommon,
            attendeeEmail: to,
            eventTitle: titleFor(loc),
            tierName: tierFor(loc),
            ticketToken,
            locale: loc,
            isInvitation: true,
            gender: GENDER,
            title: null,
            lastName: LAST_NAME,
            customBody: null,
          })
        );
        if (result) {
          console.log(`[ok] mode=invitation  to=${to.padEnd(28)} locale=${loc} id=${result.id}`);
        }
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }
  }

  console.log("\nDone. No database rows were written.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
