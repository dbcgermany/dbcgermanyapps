import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getEvent } from "@/actions/events";
import { getEventTiers } from "@/actions/door-sale";
import { createServerClient } from "@dbc/supabase/server";
import { PosterPrintControls } from "./print-controls";

export default async function EventPosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { locale, id } = await params;
  const { print } = await searchParams;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const tiers = await getEventTiers(id);
  const cheapestCents = tiers
    .map((t) => t.price_cents)
    .filter((c) => c > 0)
    .reduce<number | null>(
      (min, c) => (min === null || c < min ? c : min),
      null
    );
  const freeTierExists = tiers.some((t) => t.price_cents === 0);

  const supabase = await createServerClient();
  const { data: companyInfo } = await supabase
    .from("company_info")
    .select("brand_name, primary_color, logo_light_url")
    .eq("id", 1)
    .maybeSingle();

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";
  const checkoutUrl = `${ticketsBaseUrl}/${locale}/checkout/${event.slug}?src=door_poster`;

  // Generate QR as data URL on the server so the page renders without JS.
  const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
    width: 720,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });

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

  const COPY = {
    en: {
      eyebrow: "Tickets at the door",
      scan: "Scan to buy your ticket",
      priceFrom: "From",
      free: "Free entry",
      instructions:
        "Open your phone camera, point it at the QR code, and tap the notification to open the checkout.",
      back: "← Back to event",
    },
    de: {
      eyebrow: "Tickets vor Ort",
      scan: "Scannen und Ticket kaufen",
      priceFrom: "Ab",
      free: "Eintritt frei",
      instructions:
        "\u00D6ffnen Sie die Kamera auf Ihrem Handy, richten Sie sie auf den QR-Code und tippen Sie auf die Mitteilung.",
      back: "\u2190 Zur\u00fcck zur Veranstaltung",
    },
    fr: {
      eyebrow: "Billets sur place",
      scan: "Scannez pour acheter",
      priceFrom: "\u00C0 partir de",
      free: "Entr\u00e9e libre",
      instructions:
        "Ouvrez l'appareil photo de votre t\u00e9l\u00e9phone, pointez-le vers le QR code, puis appuyez sur la notification.",
      back: "\u2190 Retour \u00e0 l'\u00e9v\u00e9nement",
    },
  };
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = COPY[key];

  const priceLine = freeTierExists
    ? t.free
    : cheapestCents !== null
      ? `${t.priceFrom} \u20AC${(cheapestCents / 100).toFixed(0)}`
      : null;

  return (
    <>
      <div className="no-print p-6 print:hidden">
        <Link
          href={`/${locale}/events/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t.back}
        </Link>
        <PosterPrintControls autoPrint={print === "1"} />
      </div>

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
            {t.eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-5xl font-black leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-xl text-neutral-600">{dateStr}</p>
          <p className="mt-1 text-lg text-neutral-600">
            {event.venue_name}
            {event.city ? ` · ${event.city}` : ""}
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
          <p className="text-2xl font-bold">{t.scan}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR code — scan to open checkout"
            className="h-[72mm] w-[72mm]"
          />
          <p className="max-w-[160mm] text-center text-base text-neutral-600">
            {t.instructions}
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
