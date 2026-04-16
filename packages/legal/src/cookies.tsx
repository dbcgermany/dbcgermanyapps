// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by a German-
// admitted Rechtsanwalt. Do not consider this final for commercial launch
// until counsel signs off. Version: packages/legal/src/version.ts.

import type { LegalContext, LegalCopy } from "./types";
import { t } from "./types";
import { LEGAL_LAST_UPDATED } from "./version";

const heading: LegalCopy<string> = {
  en: "Cookie Policy",
  de: "Cookie-Richtlinie",
  fr: "Politique relative aux cookies",
};

const copy = {
  intro: {
    en: "This Cookie Policy explains how we use cookies and similar technologies on our websites. It supplements our Privacy Policy.",
    de: "Diese Cookie-Richtlinie erläutert, wie wir Cookies und ähnliche Technologien auf unseren Websites verwenden. Sie ergänzt unsere Datenschutzerklärung.",
    fr: "Cette politique relative aux cookies explique comment nous utilisons les cookies et technologies similaires sur nos sites web. Elle complète notre politique de confidentialité.",
  },
  whatAreCookies: {
    en: "What are cookies?",
    de: "Was sind Cookies?",
    fr: "Que sont les cookies ?",
  },
  whatAreCookiesText: {
    en: "Cookies are small text files that websites place on your device to store information. They help websites remember your preferences and improve your browsing experience. Some cookies are essential for the website to function; others help us understand how visitors interact with our sites.",
    de: "Cookies sind kleine Textdateien, die Websites auf Ihrem Gerät ablegen, um Informationen zu speichern. Sie helfen Websites, Ihre Einstellungen zu speichern und Ihr Nutzungserlebnis zu verbessern. Einige Cookies sind für die Funktion der Website unerlässlich; andere helfen uns zu verstehen, wie Besucher mit unseren Seiten interagieren.",
    fr: "Les cookies sont de petits fichiers texte que les sites web placent sur votre appareil pour stocker des informations. Ils aident les sites web à mémoriser vos préférences et à améliorer votre expérience de navigation. Certains cookies sont essentiels au fonctionnement du site ; d'autres nous aident à comprendre comment les visiteurs interagissent avec nos sites.",
  },
  cookiesWeUse: {
    en: "Cookies we use",
    de: "Cookies, die wir verwenden",
    fr: "Cookies que nous utilisons",
  },
  cookiesWeUseIntro: {
    en: "We currently use only essential and preference cookies. We do not load any analytics, advertising, or third-party tracking scripts.",
    de: "Wir verwenden derzeit ausschließlich notwendige Cookies und Präferenz-Cookies. Wir laden keine Analyse-, Werbe- oder Drittanbieter-Tracking-Skripte.",
    fr: "Nous utilisons actuellement uniquement des cookies essentiels et de préférence. Nous ne chargeons aucun script d'analyse, de publicité ou de suivi tiers.",
  },
  tableName: { en: "Name", de: "Name", fr: "Nom" },
  tableCategory: { en: "Category", de: "Kategorie", fr: "Catégorie" },
  tablePurpose: { en: "Purpose", de: "Zweck", fr: "Finalité" },
  tableDuration: { en: "Duration", de: "Speicherdauer", fr: "Durée" },
  tableProvider: { en: "Provider", de: "Anbieter", fr: "Fournisseur" },
  essential: { en: "Essential", de: "Notwendig", fr: "Essentiel" },
  preferences: { en: "Preferences", de: "Präferenzen", fr: "Préférences" },
  consentBanner: {
    en: "Your consent & how to change it",
    de: "Ihre Einwilligung und wie Sie sie ändern können",
    fr: "Votre consentement et comment le modifier",
  },
  consentBannerText: {
    en: 'When you first visit our site, a cookie consent banner appears. You may accept or reject non-essential cookies. Your choice is stored in the "cookie-consent" cookie for one year. You can change your choice at any time by clicking "Cookie settings" in the page footer.',
    de: 'Wenn Sie unsere Website zum ersten Mal besuchen, erscheint ein Cookie-Consent-Banner. Sie k\u00F6nnen nicht-essentielle Cookies akzeptieren oder ablehnen. Ihre Wahl wird im Cookie "cookie-consent" f\u00FCr ein Jahr gespeichert. Sie k\u00F6nnen Ihre Wahl jederzeit \u00E4ndern, indem Sie in der Fu\u00DFzeile auf "Cookie-Einstellungen" klicken.',
    fr: "Lors de votre première visite sur notre site, une bannière de consentement aux cookies apparaît. Vous pouvez accepter ou refuser les cookies non essentiels. Votre choix est enregistré dans le cookie « cookie-consent » pendant un an. Vous pouvez modifier votre choix à tout moment en cliquant sur « Paramètres des cookies » en pied de page.",
  },
  browserSettings: {
    en: "Browser-level controls",
    de: "Browsereinstellungen",
    fr: "Paramètres du navigateur",
  },
  browserSettingsText: {
    en: "You can also manage cookies through your browser settings. Most browsers allow you to block or delete cookies. Please note that blocking essential cookies may impair website functionality. Instructions for common browsers:",
    de: "Sie können Cookies auch über Ihre Browsereinstellungen verwalten. Die meisten Browser ermöglichen das Blockieren oder Löschen von Cookies. Bitte beachten Sie, dass das Blockieren essentieller Cookies die Website-Funktionalität beeinträchtigen kann. Anleitungen für gängige Browser:",
    fr: "Vous pouvez également gérer les cookies via les paramètres de votre navigateur. La plupart des navigateurs vous permettent de bloquer ou de supprimer les cookies. Veuillez noter que le blocage des cookies essentiels peut altérer le fonctionnement du site. Instructions pour les navigateurs courants :",
  },
  futureAnalytics: {
    en: "Future analytics",
    de: "Zukünftige Analysedienste",
    fr: "Analyse future",
  },
  futureAnalyticsText: {
    en: "If we introduce analytics or tracking cookies in the future, this policy will be updated beforehand and additional consent will be collected via our cookie banner. We will never activate non-essential cookies without your prior consent.",
    de: "Sollten wir in Zukunft Analyse- oder Tracking-Cookies einführen, wird diese Richtlinie zuvor aktualisiert und eine zusätzliche Einwilligung über unser Cookie-Banner eingeholt. Wir werden niemals nicht-essentielle Cookies ohne Ihre vorherige Einwilligung aktivieren.",
    fr: "Si nous introduisons des cookies d'analyse ou de suivi à l'avenir, cette politique sera mise à jour au préalable et un consentement supplémentaire sera recueilli via notre bannière de cookies. Nous n'activerons jamais de cookies non essentiels sans votre consentement préalable.",
  },
  usNote: {
    en: "Note for California (US) visitors",
    de: "Hinweis für Besucher aus Kalifornien (USA)",
    fr: "Note pour les visiteurs de Californie (États-Unis)",
  },
  usNoteText: {
    en: "Under the California Consumer Privacy Act (CCPA/CPRA), the cookies we use fall into the \"Essential\" and \"Functional\" categories. We do not use cookies for cross-context behavioral advertising, nor do we sell or share your personal information through cookies. No opt-out of cookie-based sale or sharing is required because none occurs.",
    de: 'Gem\u00E4\u00DF dem California Consumer Privacy Act (CCPA/CPRA) fallen die von uns verwendeten Cookies in die Kategorien "Essentiell" und "Funktional". Wir verwenden keine Cookies f\u00FCr kontext\u00FCbergreifende verhaltensbasierte Werbung und verkaufen oder teilen Ihre pers\u00F6nlichen Daten nicht \u00FCber Cookies. Ein Opt-out bez\u00FCglich Cookie-basiertem Verkauf oder Teilen ist nicht erforderlich, da beides nicht stattfindet.',
    fr: "En vertu du California Consumer Privacy Act (CCPA/CPRA), les cookies que nous utilisons relèvent des catégories « Essentiel » et « Fonctionnel ». Nous n'utilisons pas de cookies pour la publicité comportementale inter-contextes et ne vendons ni ne partageons vos informations personnelles via des cookies. Aucune désinscription relative à la vente ou au partage basé sur les cookies n'est requise car ni l'un ni l'autre n'a lieu.",
  },
  contact: { en: "Contact", de: "Kontakt", fr: "Contact" },
  contactText: {
    en: "If you have questions about our use of cookies, contact us at:",
    de: "Wenn Sie Fragen zu unserer Verwendung von Cookies haben, kontaktieren Sie uns unter:",
    fr: "Si vous avez des questions sur notre utilisation des cookies, contactez-nous à :",
  },
  lastUpdated: { en: "Last updated", de: "Letzte Aktualisierung", fr: "Dernière mise à jour" },
} satisfies Record<string, LegalCopy<string>>;

const COOKIES = [
  {
    name: "sb-*-auth-token",
    category: "essential" as const,
    purpose: {
      en: "Authentication session. Stores the signed JWT access token (1 hour) and refresh token (60 days) issued by Supabase Auth.",
      de: "Authentifizierungssitzung. Speichert das signierte JWT-Zugriffstoken (1 Stunde) und Auffrischungstoken (60 Tage), ausgestellt von Supabase Auth.",
      fr: "Session d'authentification. Stocke le jeton d'accès JWT signé (1 heure) et le jeton de rafraîchissement (60 jours) émis par Supabase Auth.",
    },
    duration: { en: "Access: 1 hour; Refresh: 60 days", de: "Zugriff: 1 Stunde; Aktualisierung: 60 Tage", fr: "Accès : 1 heure ; Rafraîchissement : 60 jours" },
    provider: "Supabase (EU-Central, Frankfurt)",
  },
  {
    name: "cookie-consent",
    category: "essential" as const,
    purpose: {
      en: "Records whether you accepted or rejected the cookie consent banner.",
      de: "Speichert, ob Sie das Cookie-Consent-Banner akzeptiert oder abgelehnt haben.",
      fr: "Enregistre si vous avez accepté ou refusé la bannière de consentement aux cookies.",
    },
    duration: { en: "1 year", de: "1 Jahr", fr: "1 an" },
    provider: { en: "First party", de: "Erstanbieter", fr: "Première partie" },
  },
  {
    name: "locale",
    category: "preferences" as const,
    purpose: {
      en: "Stores your language preference (en, de, or fr) so the site loads in your chosen language on return visits.",
      de: "Speichert Ihre Spracheinstellung (en, de oder fr), damit die Website bei erneuten Besuchen in Ihrer gewählten Sprache geladen wird.",
      fr: "Stocke votre préférence linguistique (en, de ou fr) afin que le site se charge dans la langue choisie lors de vos prochaines visites.",
    },
    duration: { en: "1 year", de: "1 Jahr", fr: "1 an" },
    provider: { en: "First party", de: "Erstanbieter", fr: "Première partie" },
  },
  {
    name: "dbc-theme",
    category: "preferences" as const,
    purpose: {
      en: "Stores your color theme preference (light or dark). Stored in localStorage, not as a traditional cookie.",
      de: "Speichert Ihre Farbschema-Einstellung (hell oder dunkel). Wird in localStorage gespeichert, nicht als herkömmliches Cookie.",
      fr: "Stocke votre préférence de thème de couleur (clair ou sombre). Stocké dans localStorage, pas en tant que cookie traditionnel.",
    },
    duration: { en: "Indefinite (localStorage)", de: "Unbegrenzt (localStorage)", fr: "Indéfini (localStorage)" },
    provider: { en: "First party", de: "Erstanbieter", fr: "Première partie" },
  },
];

const BROWSER_LINKS = [
  { name: "Chrome", url: "https://support.google.com/chrome/answer/95647" },
  {
    name: "Firefox",
    url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer",
  },
  {
    name: "Safari",
    url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac",
  },
  {
    name: "Edge",
    url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
  },
];

export function CookiePolicy({ company, locale }: LegalContext) {
  const c = company;

  return (
    <article>
      <h1>{t(heading, locale)}</h1>
      <p>{t(copy.intro, locale)}</p>

      <h2>{t(copy.whatAreCookies, locale)}</h2>
      <p>{t(copy.whatAreCookiesText, locale)}</p>

      <h2>{t(copy.cookiesWeUse, locale)}</h2>
      <p>{t(copy.cookiesWeUseIntro, locale)}</p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>{t(copy.tableName, locale)}</th>
              <th>{t(copy.tableCategory, locale)}</th>
              <th>{t(copy.tablePurpose, locale)}</th>
              <th>{t(copy.tableDuration, locale)}</th>
              <th>{t(copy.tableProvider, locale)}</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((cookie) => (
              <tr key={cookie.name}>
                <td className="font-mono text-xs">{cookie.name}</td>
                <td>
                  {cookie.category === "essential"
                    ? t(copy.essential, locale)
                    : t(copy.preferences, locale)}
                </td>
                <td>{t(cookie.purpose, locale)}</td>
                <td>{t(cookie.duration, locale)}</td>
                <td>
                  {typeof cookie.provider === "string"
                    ? cookie.provider
                    : t(cookie.provider, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t(copy.consentBanner, locale)}</h2>
      <p>{t(copy.consentBannerText, locale)}</p>

      <h2>{t(copy.browserSettings, locale)}</h2>
      <p>{t(copy.browserSettingsText, locale)}</p>
      <ul>
        {BROWSER_LINKS.map((b) => (
          <li key={b.name}>
            <a href={b.url} target="_blank" rel="noopener noreferrer">
              {b.name}
            </a>
          </li>
        ))}
      </ul>

      <h2>{t(copy.futureAnalytics, locale)}</h2>
      <p>{t(copy.futureAnalyticsText, locale)}</p>

      <h2>{t(copy.usNote, locale)}</h2>
      <p>{t(copy.usNoteText, locale)}</p>

      <h2>{t(copy.contact, locale)}</h2>
      <p>
        {t(copy.contactText, locale)}{" "}
        <a href={`mailto:${c?.privacy_email ?? c?.primary_email ?? ""}`}>
          {c?.privacy_email ?? c?.primary_email ?? "—"}
        </a>
      </p>

      <hr />
      <p className="text-xs text-muted-foreground">
        {t(copy.lastUpdated, locale)}: {t(LEGAL_LAST_UPDATED, locale)}
      </p>
    </article>
  );
}
