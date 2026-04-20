import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_SIGNATURE } from "./_layout";

type Locale = "en" | "de" | "fr";

export interface UpcomingEvent {
  /** Localized title (what attendees read). */
  title: string;
  /** ISO-8601 date the event starts. */
  startsAtIso: string;
  /** Venue name. */
  venueName: string;
  /** City (optional). */
  city?: string;
  /** Public URL the "Get your ticket" CTA points at. */
  ticketUrl: string;
}

interface NewsletterEmailProps {
  subject: string;
  preheader?: string;
  /** Pre-rendered plain-text / markdown-lite body (paragraphs split by blank lines). */
  body: string;
  unsubscribeUrl: string;
  locale: Locale;
  /** When present, renders the branded event hero block at the top of the body. */
  upcomingEvent?: UpcomingEvent;
}

const UNSUB = {
  en: "Unsubscribe",
  de: "Abmelden",
  fr: "Se d\u00e9sabonner",
};

const RECEIVED_BECAUSE = {
  en: "You are receiving this because you subscribed to the DBC Germany newsletter.",
  de: "Sie erhalten diese E-Mail, weil Sie den DBC-Germany-Newsletter abonniert haben.",
  fr: "Vous recevez ce message parce que vous \u00eates abonn\u00e9\u00b7e \u00e0 la newsletter DBC Germany.",
};

const HERO_COPY = {
  en: {
    eyebrow: "SAVE THE DATE",
    tagline: "Africa\u2019s top business group \u00b7 DACH edition",
    cta: "Get your ticket",
  },
  de: {
    eyebrow: "VORMERKEN",
    tagline:
      "Afrikas f\u00fchrende Wirtschaftsgruppe \u00b7 DACH-Ausgabe",
    cta: "Ticket sichern",
  },
  fr: {
    eyebrow: "\u00c0 VOS AGENDAS",
    tagline:
      "Le premier groupe d\u2019affaires d\u2019Afrique \u00b7 \u00e9dition DACH",
    cta: "R\u00e9server mon billet",
  },
} as const;

/**
 * Branded event announcement card rendered at the top of every newsletter
 * when an upcoming event is supplied. Pure CSS + email-safe inline styles —
 * no external imagery, so Gmail / Outlook / Apple Mail all render it
 * identically. DBC red primary, gold accent, dark backdrop.
 */
function EventHeroBanner({
  event,
  locale,
}: {
  event: UpcomingEvent;
  locale: Locale;
}) {
  const t = HERO_COPY[locale];
  const date = new Date(event.startsAtIso);
  const bcp47 = locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB";
  const dateLong = date.toLocaleDateString(bcp47, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const venueLine = event.city
    ? `${event.venueName} \u00b7 ${event.city}`
    : event.venueName;

  return (
    <Section
      style={{
        marginTop: "24px",
        marginBottom: "24px",
        backgroundColor: "#0f0f0f",
        borderRadius: "12px",
        overflow: "hidden",
        padding: "32px 28px",
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          height: "3px",
          width: "40px",
          backgroundColor: "#d4a017",
          marginBottom: "20px",
        }}
      />
      <Text
        style={{
          margin: "0 0 12px",
          color: "#d4a017",
          fontSize: "11px",
          letterSpacing: "0.25em",
          fontWeight: 700,
          lineHeight: "14px",
        }}
      >
        {t.eyebrow}
      </Text>
      <Text
        style={{
          margin: "0 0 8px",
          color: "#ffffff",
          fontSize: "26px",
          lineHeight: "32px",
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        {event.title}
      </Text>
      <Text
        style={{
          margin: "0 0 20px",
          color: "#a3a3a3",
          fontSize: "14px",
          lineHeight: "20px",
        }}
      >
        {t.tagline}
      </Text>
      <Text
        style={{
          margin: "0 0 4px",
          color: "#c8102e",
          fontSize: "20px",
          fontWeight: 700,
          letterSpacing: "0.01em",
        }}
      >
        {dateLong}
      </Text>
      <Text
        style={{
          margin: "0 0 24px",
          color: "#d4d4d4",
          fontSize: "13px",
        }}
      >
        {venueLine}
      </Text>
      <Button
        href={event.ticketUrl}
        style={{
          backgroundColor: "#c8102e",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {t.cta}
      </Button>
    </Section>
  );
}

export function NewsletterEmail(props: NewsletterEmailProps) {
  const paragraphs = props.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const footerQuestions = RECEIVED_BECAUSE[props.locale];

  return (
    <EmailLayout
      locale={props.locale}
      preview={props.preheader || props.subject}
      footerQuestions={footerQuestions}
      footerSignature={FOOTER_SIGNATURE}
    >
      {props.upcomingEvent && (
        <EventHeroBanner event={props.upcomingEvent} locale={props.locale} />
      )}
      <Section className="mt-6">
        <Text className="m-0 text-base font-semibold text-neutral-900">
          {props.subject}
        </Text>
      </Section>
      <Section className="mt-4">
        {paragraphs.map((p, i) => (
          <Text
            key={i}
            className="m-0 mb-4 text-sm leading-6 text-neutral-700"
          >
            {p}
          </Text>
        ))}
      </Section>
      <Section className="mt-6">
        <Text className="m-0 text-xs text-neutral-400">
          <Link
            href={props.unsubscribeUrl}
            className="text-neutral-500 underline"
          >
            {UNSUB[props.locale]}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}
