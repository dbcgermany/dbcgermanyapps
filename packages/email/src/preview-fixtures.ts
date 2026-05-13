/**
 * Fixture data for the admin "Send all template previews" action.
 * Every string is clearly marked [PREVIEW]/[VORSCHAU]/[APERÇU] so previews
 * are unmistakable when they arrive at a real inbox.
 *
 * Event-specific fields (slug, title, dates, venue, tier, URLs) are NOT
 * hardcoded — they come from buildPreviewEventFixture() which the
 * email-previews action calls at run time against the live database, so
 * the preview always points at the next upcoming published event. No
 * yearly maintenance burden when new events ship.
 */

import type { UpcomingEvent } from "./send-newsletter";

export type PreviewLocale = "en" | "de" | "fr";

// ---------------------------------------------------------------------------
// Static fixtures (don't depend on a specific event)
// ---------------------------------------------------------------------------

export const PREVIEW_CONTACT = {
  firstName: "Anna",
  lastName: "[PREVIEW] Schmidt",
  fullName: "Anna [PREVIEW] Schmidt",
  email: "preview@dbc-germany.test",
} as const;

export const PREVIEW_TICKET = {
  shortId: "PREVTKN1",
  token: "preview-ticket-token-0000",
} as const;

export const PREVIEW_ORDER = {
  shortId: "PREVORDR",
  paymentMethod: "Card",
} as const;

export const PREVIEW_BRAND = {
  brandName: "DBC Germany",
  legalName: "DBC Germany UG (haftungsbeschränkt)",
  legalForm: "UG (haftungsbeschränkt)",
  supportEmail: "support@dbc-germany.com",
  primaryColor: "#1F4068",
  logoUrl: "https://dbc-germany.com/logo.png",
  senderLine1: "Norbertstr. 2",
  senderPostalCode: "45131",
  senderCity: "Essen",
  senderCountry: "Germany",
  senderPhone: "+49 201 0000000",
} as const;

export const PREVIEW_ASK_SPEAKERS = [
  {
    name: "[PREVIEW] Bertille Diambilay",
    roleLabel: "Founder, Vert d'Eau",
  },
  {
    name: "[PREVIEW] Jean Tshipama",
    roleLabel: "Investor",
  },
];

// ---------------------------------------------------------------------------
// Event-specific fixture builder
// ---------------------------------------------------------------------------

export interface PreviewEventRow {
  slug: string;
  title_en: string | null;
  title_de: string | null;
  title_fr: string | null;
  event_type: string | null;
  starts_at: string;
  ends_at: string;
  city: string | null;
  venue_name: string | null;
  venue_address: string | null;
  timezone: string | null;
}

export interface PreviewTierRow {
  name_en: string | null;
  name_de: string | null;
  name_fr: string | null;
  price_cents: number;
}

export interface PreviewEventFixture {
  event: {
    title: string;
    type: string;
    slug: string;
    startsAt: Date;
    endsAt: Date;
    city: string;
    venueName: string;
    venueAddress: string;
    timezone: string;
    dateLabel: string;
  };
  tier: {
    name: string;
    priceCents: number;
  };
  order: {
    shortId: string;
    totalFormatted: string;
    subtotalFormatted: string;
    discountFormatted: string | null;
    paymentMethod: string;
  };
  urls: {
    ticketsBase: string;
    adminBase: string;
    siteBase: string;
    orderUrl: string;
    registrationUrl: string;
    loginUrl: string;
    unsubscribeUrl: string;
    confirmUrl: string;
    passwordResetUrl: string;
    staffInviteUrl: string;
    dashboardUrl: string;
    checkoutUrl: string;
  };
  upcomingEvent: UpcomingEvent;
  lineItems: { description: string; amount: string }[];
}

function pickLocalizedTitle(
  event: PreviewEventRow,
  locale: PreviewLocale
): string {
  return (
    (locale === "de" && event.title_de) ||
    (locale === "fr" && event.title_fr) ||
    event.title_en ||
    "Event"
  );
}

function pickLocalizedTierName(
  tier: PreviewTierRow,
  locale: PreviewLocale
): string {
  return (
    (locale === "de" && tier.name_de) ||
    (locale === "fr" && tier.name_fr) ||
    tier.name_en ||
    "Standard"
  );
}

function formatPriceEUR(cents: number): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Build an event-specific preview fixture from a real event row + tier row
 * + locale. Called by the email-previews action at run time so every
 * preview points at the current upcoming event without code changes.
 */
export function buildPreviewEventFixture(
  event: PreviewEventRow,
  tier: PreviewTierRow,
  locale: PreviewLocale,
  baseUrls: {
    ticketsBase: string;
    adminBase: string;
    siteBase: string;
  }
): PreviewEventFixture {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const title = `[PREVIEW] ${pickLocalizedTitle(event, locale)}`;
  const tierName = pickLocalizedTierName(tier, locale);
  const priceFormatted = formatPriceEUR(tier.price_cents);
  const dateLabel = startsAt.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const t = baseUrls.ticketsBase.replace(/\/$/, "");
  const a = baseUrls.adminBase.replace(/\/$/, "");
  const s = baseUrls.siteBase.replace(/\/$/, "");

  return {
    event: {
      title,
      type: event.event_type ?? "Conference",
      slug: event.slug,
      startsAt,
      endsAt,
      city: event.city ?? "",
      venueName: `[PREVIEW] ${event.venue_name ?? ""}`.trim(),
      venueAddress: event.venue_address ?? "",
      timezone: event.timezone ?? "Europe/Berlin",
      dateLabel,
    },
    tier: {
      name: tierName,
      priceCents: tier.price_cents,
    },
    order: {
      shortId: PREVIEW_ORDER.shortId,
      totalFormatted: priceFormatted,
      subtotalFormatted: priceFormatted,
      discountFormatted: null,
      paymentMethod: PREVIEW_ORDER.paymentMethod,
    },
    urls: {
      ticketsBase: t,
      adminBase: a,
      siteBase: s,
      orderUrl: `${t}/${locale}/confirmation/preview`,
      registrationUrl: `${t}/${locale}/chapter-delegate/${event.slug}/register`,
      loginUrl: `${a}/${locale}/login`,
      unsubscribeUrl: `${s}/${locale}/newsletter/unsubscribe?token=preview`,
      confirmUrl: `${s}/${locale}/newsletter/confirm?token=preview`,
      passwordResetUrl: `${a}/${locale}/auth/reset?code=preview`,
      staffInviteUrl: `${a}/${locale}/auth/invite?code=preview`,
      dashboardUrl: `${a}/${locale}/dashboard`,
      checkoutUrl: `${t}/${locale}/checkout/preview`,
    },
    upcomingEvent: {
      title,
      startsAtIso: startsAt.toISOString(),
      venueName: `[PREVIEW] ${event.venue_name ?? ""}`.trim(),
      city: event.city ?? "",
      ticketUrl: `${t}/${locale}/events/${event.slug}`,
    },
    lineItems: [
      {
        description: `${tierName} ticket × 1`,
        amount: priceFormatted,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Localised copy strings (don't depend on an event)
// ---------------------------------------------------------------------------

const NEWSLETTER_BODY_FR =
  "[APERÇU] Voici un aperçu d'une infolettre DBC Germany.\n\nNous partageons régulièrement des nouvelles sur nos événements à venir, des opportunités pour la diaspora africaine en Allemagne et des récits de notre communauté.\n\nMerci de votre soutien !";

const NEWSLETTER_BODY_DE =
  "[VORSCHAU] Hier ist eine Vorschau eines DBC-Germany-Newsletters.\n\nWir teilen regelmäßig Neuigkeiten zu unseren bevorstehenden Veranstaltungen, Möglichkeiten für die afrikanische Diaspora in Deutschland und Geschichten aus unserer Community.\n\nVielen Dank für Ihre Unterstützung!";

const NEWSLETTER_BODY_EN =
  "[PREVIEW] This is a preview of a DBC Germany newsletter.\n\nWe regularly share news about our upcoming events, opportunities for the African diaspora in Germany, and stories from our community.\n\nThank you for your support!";

export function previewNewsletterBody(locale: PreviewLocale): string {
  return locale === "de"
    ? NEWSLETTER_BODY_DE
    : locale === "fr"
      ? NEWSLETTER_BODY_FR
      : NEWSLETTER_BODY_EN;
}

const NEWSLETTER_SUBJECT = {
  en: "[PREVIEW] DBC Germany — Newsletter",
  de: "[VORSCHAU] DBC Germany — Newsletter",
  fr: "[APERÇU] DBC Germany — Infolettre",
};

export function previewNewsletterSubject(locale: PreviewLocale): string {
  return NEWSLETTER_SUBJECT[locale];
}

const STAFF_MESSAGE_SUBJECT = {
  en: "[PREVIEW] Quick heads-up from the team",
  de: "[VORSCHAU] Kurze Info aus dem Team",
  fr: "[APERÇU] Petite info de l'équipe",
};

const STAFF_MESSAGE_BODY = {
  en: "[PREVIEW] Hi team — this is what a staff broadcast email looks like. Use it for quick internal updates that don't need to live in a sequence.",
  de: "[VORSCHAU] Hallo Team — so sieht eine interne Rundmail aus. Für schnelle Updates, die nicht in eine Sequenz gehören.",
  fr: "[APERÇU] Bonjour l'équipe — voici à quoi ressemble un message interne. Pour des mises à jour rapides qui n'ont pas besoin d'une séquence.",
};

export function previewStaffMessage(locale: PreviewLocale) {
  return {
    subject: STAFF_MESSAGE_SUBJECT[locale],
    body: STAFF_MESSAGE_BODY[locale],
  };
}

const AFTERCARE_SUBJECT_EN = "[PREVIEW] Thank you for joining us";
const AFTERCARE_SUBJECT_DE = "[VORSCHAU] Vielen Dank für Ihre Teilnahme";
const AFTERCARE_SUBJECT_FR = "[APERÇU] Merci de votre participation";

const AFTERCARE_BODY = {
  en: "[PREVIEW] What a night! Photos and the panel recording will be in your inbox within 48 hours. In the meantime — share a moment that stayed with you.",
  de: "[VORSCHAU] Was für ein Abend! Fotos und die Panel-Aufzeichnung erhalten Sie innerhalb von 48 Stunden. Teilen Sie währenddessen einen Moment, der Ihnen geblieben ist.",
  fr: "[APERÇU] Quelle soirée ! Les photos et l'enregistrement du panel arrivent dans votre boîte sous 48 heures. En attendant — partagez un moment qui vous a marqué.",
};

export function previewAftercare(locale: PreviewLocale) {
  const subject =
    locale === "de"
      ? AFTERCARE_SUBJECT_DE
      : locale === "fr"
        ? AFTERCARE_SUBJECT_FR
        : AFTERCARE_SUBJECT_EN;
  return { subject, body: AFTERCARE_BODY[locale] };
}

const ADMIN_ALERT_SUBJECT = {
  en: "[PREVIEW] New high-value order",
  de: "[VORSCHAU] Neue Bestellung mit hohem Volumen",
  fr: "[APERÇU] Nouvelle commande à fort montant",
};

const ADMIN_ALERT_HEADLINE = {
  en: "[PREVIEW] €299 order from Anna Schmidt",
  de: "[VORSCHAU] Bestellung über €299 von Anna Schmidt",
  fr: "[APERÇU] Commande de €299 de la part d'Anna Schmidt",
};

const ADMIN_ALERT_BODY = {
  en: "[PREVIEW] An order over your alert threshold just landed. Click through to review and acknowledge.",
  de: "[VORSCHAU] Eine Bestellung über Ihrem Schwellenwert ist eingegangen. Bitte prüfen und bestätigen.",
  fr: "[APERÇU] Une commande dépasse votre seuil d'alerte. Veuillez la vérifier et l'accuser de réception.",
};

export function previewAdminAlert(locale: PreviewLocale) {
  return {
    subject: ADMIN_ALERT_SUBJECT[locale],
    headline: ADMIN_ALERT_HEADLINE[locale],
    body: ADMIN_ALERT_BODY[locale],
  };
}
