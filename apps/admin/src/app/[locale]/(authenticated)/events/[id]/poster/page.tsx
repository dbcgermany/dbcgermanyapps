import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getEvent } from "@/actions/events";
import { getEventTiers } from "@/actions/door-sale";
import { getPosterConfig } from "@/actions/poster";
import { createServerClient } from "@dbc/supabase/server";
import { PosterPrintControls } from "./print-controls";
import { PosterConfigEditor } from "./poster-config-editor";

const DEFAULTS = {
  en: {
    eyebrow: "Tickets at the door",
    headline: "Scan to buy your ticket",
    priceFrom: "From",
    free: "Free entry",
    instructions:
      "Open your phone camera, point it at the QR code, and tap the notification to open the checkout.",
    back: "\u2190 Back to event",
  },
  de: {
    eyebrow: "Tickets vor Ort",
    headline: "Scannen und Ticket kaufen",
    priceFrom: "Ab",
    free: "Eintritt frei",
    instructions:
      "\u00D6ffnen Sie die Kamera auf Ihrem Handy, richten Sie sie auf den QR-Code und tippen Sie auf die Mitteilung.",
    back: "\u2190 Zur\u00FCck zur Veranstaltung",
  },
  fr: {
    eyebrow: "Billets sur place",
    headline: "Scannez pour acheter",
    priceFrom: "\u00C0 partir de",
    free: "Entr\u00E9e libre",
    instructions:
      "Ouvrez l\u2019appareil photo de votre t\u00E9l\u00E9phone, pointez-le vers le QR code, puis appuyez sur la notification.",
    back: "\u2190 Retour \u00E0 l\u2019\u00E9v\u00E9nement",
  },
};

export default async function EventPosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { locale, id } = await params;
  const { print } = await searchParams;
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [tiers, config, companyRes] = await Promise.all([
    getEventTiers(id),
    getPosterConfig(id),
    (async () => {
      const supabase = await createServerClient();
      return supabase
        .from("company_info")
        .select("brand_name, primary_color, logo_light_url")
        .eq("id", 1)
        .maybeSingle();
    })(),
  ]);

  const companyInfo = companyRes.data;
  const cheapestCents = tiers
    .map((t) => t.price_cents)
    .filter((c) => c > 0)
    .reduce<number | null>(
      (min, c) => (min === null || c < min ? c : min),
      null
    );
  const freeTierExists = tiers.some((t) => t.price_cents === 0);

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
  const checkoutUrl = `${ticketsBaseUrl}/${locale}/checkout/${event.slug}?src=door_poster`;

  const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
    width: 720,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });

  const d = DEFAULTS[key];

  // Merge: DB config overrides defaults per locale
  const eyebrow =
    (config[`eyebrow_${key}` as keyof typeof config] as string) || d.eyebrow;
  const headline =
    (config[`headline_${key}` as keyof typeof config] as string) || d.headline;
  const instructions =
    (config[`instructions_${key}` as keyof typeof config] as string) ||
    d.instructions;

  const title =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;
  const start = new Date(event.starts_at);
  const dateStr = start.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const brandName = companyInfo?.brand_name ?? "DBC Germany";
  const primary = companyInfo?.primary_color ?? "#c8102e";

  const priceLine = freeTierExists
    ? d.free
    : cheapestCents !== null
      ? `${d.priceFrom} \u20AC${(cheapestCents / 100).toFixed(0)}`
      : null;

  return (
    <>
      {/* Admin toolbar — hidden on print */}
      <div className="no-print space-y-6 p-6 print:hidden">
        <Link
          href={`/${locale}/events/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {d.back}
        </Link>

        <PosterConfigEditor
          eventId={id}
          locale={locale}
          initial={config}
          defaults={DEFAULTS}
        />

        <PosterPrintControls autoPrint={print === "1"} />
      </div>

      {/* A4 poster — print-ready */}
      <main className="poster mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white p-[14mm] text-black print:m-0 print:max-w-none print:p-[10mm]">
        <header
          className="flex items-center gap-3 border-b-4 pb-5"
          style={{ borderColor: primary }}
        >
          {companyInfo?.logo_light_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyInfo.logo_light_url}
              alt=""
              className="h-12 w-12 object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          <span
            className="text-2xl font-bold tracking-wider"
            style={{ color: primary }}
          >
            {brandName.toUpperCase()}
          </span>
        </header>

        <section className="mt-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: primary }}
          >
            {eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-5xl font-black leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-xl text-neutral-600">{dateStr}</p>
          <p className="mt-1 text-lg text-neutral-600">
            {event.venue_name}
            {event.city ? ` \u00B7 ${event.city}` : ""}
          </p>
          {priceLine && (
            <p
              className="mt-6 inline-block rounded-full px-5 py-2 text-lg font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {priceLine}
            </p>
          )}
        </section>

        <section className="mt-auto flex flex-col items-center gap-4 py-8">
          <p className="text-2xl font-bold">{headline}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR code \u2014 scan to open checkout"
            className="h-[72mm] w-[72mm]"
          />
          <p className="max-w-[160mm] text-center text-base text-neutral-600">
            {instructions}
          </p>
          <p className="text-xs text-neutral-400">{checkoutUrl}</p>
        </section>
      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
