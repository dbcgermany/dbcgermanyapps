/**
 * Fixture data for the admin "Send all template previews" action.
 * Every string is clearly marked [PREVIEW] so previews are unmistakable when
 * they arrive at a real inbox. No production data is read.
 */

import type { UpcomingEvent } from "./send-newsletter";

export const PREVIEW_EVENT = {
  title: "[PREVIEW] Richesses d'Afrique Germany 2026",
  type: "Conference",
  slug: "richesses-2026-preview",
  startsAt: new Date("2026-06-13T17:00:00Z"),
  endsAt: new Date("2026-06-13T23:00:00Z"),
  city: "Essen",
  venueName: "[PREVIEW] Essen Convention Center",
  venueAddress: "Norbertstr. 2, 45131 Essen",
  timezone: "Europe/Berlin",
  dateLabel: "13 June 2026",
} as const;

export const PREVIEW_CONTACT = {
  firstName: "Anna",
  lastName: "[PREVIEW] Schmidt",
  fullName: "Anna [PREVIEW] Schmidt",
  email: "preview@dbc-germany.test",
} as const;

export const PREVIEW_TIER = {
  name: "Standard",
  priceCents: 9900,
} as const;

export const PREVIEW_TICKET = {
  shortId: "PREVTKN1",
  token: "preview-ticket-token-0000",
} as const;

export const PREVIEW_ORDER = {
  shortId: "PREVORDR",
  totalFormatted: "€99.00",
  subtotalFormatted: "€99.00",
  discountFormatted: null as string | null,
  paymentMethod: "Card",
} as const;

export const PREVIEW_URLS = {
  ticketsBase: "https://tickets.dbc-germany.com",
  orderUrl: "https://tickets.dbc-germany.com/de/confirmation/preview",
  registrationUrl:
    "https://tickets.dbc-germany.com/de/chapter-delegate/richesses-2026/register",
  loginUrl: "https://admin.dbc-germany.com/de/login",
  unsubscribeUrl: "https://dbc-germany.com/de/newsletter/unsubscribe?token=preview",
  confirmUrl: "https://dbc-germany.com/de/newsletter/confirm?token=preview",
  passwordResetUrl: "https://admin.dbc-germany.com/de/auth/reset?code=preview",
  staffInviteUrl: "https://admin.dbc-germany.com/de/auth/invite?code=preview",
  dashboardUrl: "https://admin.dbc-germany.com/de/dashboard",
  checkoutUrl: "https://tickets.dbc-germany.com/de/checkout/preview",
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

const NEWSLETTER_BODY_FR =
  "[APERÇU] Voici un aperçu d'une infolettre DBC Germany.\n\nNous partageons régulièrement des nouvelles sur nos événements à venir, des opportunités pour la diaspora africaine en Allemagne et des récits de notre communauté.\n\nMerci de votre soutien !";

const NEWSLETTER_BODY_DE =
  "[VORSCHAU] Hier ist eine Vorschau eines DBC-Germany-Newsletters.\n\nWir teilen regelmäßig Neuigkeiten zu unseren bevorstehenden Veranstaltungen, Möglichkeiten für die afrikanische Diaspora in Deutschland und Geschichten aus unserer Community.\n\nVielen Dank für Ihre Unterstützung!";

const NEWSLETTER_BODY_EN =
  "[PREVIEW] This is a preview of a DBC Germany newsletter.\n\nWe regularly share news about our upcoming events, opportunities for the African diaspora in Germany, and stories from our community.\n\nThank you for your support!";

export function previewNewsletterBody(locale: "en" | "de" | "fr"): string {
  return locale === "de"
    ? NEWSLETTER_BODY_DE
    : locale === "fr"
      ? NEWSLETTER_BODY_FR
      : NEWSLETTER_BODY_EN;
}

const NEWSLETTER_SUBJECT = {
  en: "[PREVIEW] DBC Germany — May newsletter",
  de: "[VORSCHAU] DBC Germany — Mai-Newsletter",
  fr: "[APERÇU] DBC Germany — Infolettre de mai",
};

export function previewNewsletterSubject(locale: "en" | "de" | "fr"): string {
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

export function previewStaffMessage(locale: "en" | "de" | "fr") {
  return {
    subject: STAFF_MESSAGE_SUBJECT[locale],
    body: STAFF_MESSAGE_BODY[locale],
  };
}

const AFTERCARE_SUBJECT = {
  en: "[PREVIEW] Thank you for joining us at Richesses 2026",
  de: "[VORSCHAU] Danke, dass Sie bei Richesses 2026 dabei waren",
  fr: "[APERÇU] Merci d'avoir participé à Richesses 2026",
};

const AFTERCARE_BODY = {
  en: "[PREVIEW] What a night! Photos and the panel recording will be in your inbox within 48 hours. In the meantime — share a moment that stayed with you.",
  de: "[VORSCHAU] Was für ein Abend! Fotos und die Panel-Aufzeichnung erhalten Sie innerhalb von 48 Stunden. Teilen Sie währenddessen einen Moment, der Ihnen geblieben ist.",
  fr: "[APERÇU] Quelle soirée ! Les photos et l'enregistrement du panel arrivent dans votre boîte sous 48 heures. En attendant — partagez un moment qui vous a marqué.",
};

export function previewAftercare(locale: "en" | "de" | "fr") {
  return {
    subject: AFTERCARE_SUBJECT[locale],
    body: AFTERCARE_BODY[locale],
  };
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

export function previewAdminAlert(locale: "en" | "de" | "fr") {
  return {
    subject: ADMIN_ALERT_SUBJECT[locale],
    headline: ADMIN_ALERT_HEADLINE[locale],
    body: ADMIN_ALERT_BODY[locale],
  };
}

export const PREVIEW_LINE_ITEMS = [
  { description: "Standard ticket × 1", amount: "€99.00" },
];

export const PREVIEW_UPCOMING_EVENT: UpcomingEvent = {
  title: PREVIEW_EVENT.title,
  startsAtIso: PREVIEW_EVENT.startsAt.toISOString(),
  venueName: PREVIEW_EVENT.venueName,
  city: PREVIEW_EVENT.city,
  ticketUrl: `${PREVIEW_URLS.ticketsBase}/de/events/${PREVIEW_EVENT.slug}`,
};

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
