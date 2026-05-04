// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by counsel.
// Version: packages/legal/src/version.ts.

import type { PublicCompanyInfo } from "./company";
import { formatRegisteredAddress } from "./company";
import { LEGAL_LAST_UPDATED } from "./version";
import type { LegalLocale, LegalCopy } from "./types";
import { t } from "./types";

const COPY = {
  heading: { en: "US Privacy Notice", de: "Datenschutzhinweis für die USA", fr: "Avis de confidentialité pour les États-Unis" } satisfies LegalCopy<string>,
  lead: {
    en: "Supplemental privacy notice for residents of the United States, including California, Virginia, Colorado, Connecticut, Utah, and other states with comprehensive privacy legislation.",
    de: "Ergänzender Datenschutzhinweis für Einwohner der Vereinigten Staaten, insbesondere Kalifornien, Virginia, Colorado, Connecticut, Utah und weiterer Bundesstaaten mit umfassender Datenschutzgesetzgebung.",
    fr: "Avis de confidentialité supplémentaire pour les résidents des États-Unis, y compris la Californie, la Virginie, le Colorado, le Connecticut, l'Utah et d'autres États dotés d'une législation complète sur la vie privée.",
  } satisfies LegalCopy<string>,
  scopeH: { en: "Scope", de: "Geltungsbereich", fr: "Champ d'application" } satisfies LegalCopy<string>,
  scopeText: {
    en: "This notice supplements our Privacy Policy and applies to personal information collected from US residents through our websites and services.",
    de: "Dieser Hinweis ergänzt unsere Datenschutzerklärung und gilt für personenbezogene Daten, die wir von US-Einwohnern über unsere Websites und Dienste erheben.",
    fr: "Cet avis complète notre Politique de confidentialité et s'applique aux données personnelles collectées auprès des résidents des États-Unis via nos sites web et services.",
  } satisfies LegalCopy<string>,
  privacyLinkLabel: {
    en: "Privacy Policy",
    de: "Datenschutzerklärung",
    fr: "Politique de confidentialité",
  } satisfies LegalCopy<string>,
  categoriesH: {
    en: "Categories of personal information we collect",
    de: "Kategorien der erhobenen personenbezogenen Daten",
    fr: "Catégories de données personnelles que nous collectons",
  } satisfies LegalCopy<string>,
  thCategory: { en: "CCPA category", de: "CCPA-Kategorie", fr: "Catégorie CCPA" } satisfies LegalCopy<string>,
  thExamples: { en: "Examples", de: "Beispiele", fr: "Exemples" } satisfies LegalCopy<string>,
  thSource: { en: "Source", de: "Quelle", fr: "Source" } satisfies LegalCopy<string>,
  thPurpose: { en: "Business purpose", de: "Geschäftszweck", fr: "Finalité commerciale" } satisfies LegalCopy<string>,
  noSellH: {
    en: "We do not sell or share your personal information",
    de: "Wir verkaufen und teilen Ihre personenbezogenen Daten nicht",
    fr: "Nous ne vendons ni ne partageons vos données personnelles",
  } satisfies LegalCopy<string>,
  noSellText: {
    en: "We do not sell personal information. We do not share personal information for cross-context behavioral advertising. We have not sold or shared personal information in the preceding 12 months. Accordingly, no opt-out mechanism for sale or sharing is required.",
    de: "Wir verkaufen keine personenbezogenen Daten. Wir teilen keine personenbezogenen Daten für kontextübergreifende verhaltensbasierte Werbung. In den letzten 12 Monaten haben wir keine personenbezogenen Daten verkauft oder geteilt. Ein Opt-out-Mechanismus für Verkauf oder Teilen ist daher nicht erforderlich.",
    fr: "Nous ne vendons pas de données personnelles. Nous ne partageons pas de données personnelles à des fins de publicité comportementale inter-contextes. Nous n'avons ni vendu ni partagé de données personnelles au cours des 12 derniers mois. Par conséquent, aucun mécanisme de désinscription de la vente ou du partage n'est requis.",
  } satisfies LegalCopy<string>,
  rightsH: {
    en: "Your rights under US state privacy laws",
    de: "Ihre Rechte nach US-Bundesstaatengesetzen",
    fr: "Vos droits selon les lois étatiques américaines sur la vie privée",
  } satisfies LegalCopy<string>,
  rightsLead: {
    en: "Depending on your state of residence, you may have the following rights:",
    de: "Abhängig von Ihrem Wohnsitz können Sie folgende Rechte haben:",
    fr: "Selon votre État de résidence, vous pouvez disposer des droits suivants :",
  } satisfies LegalCopy<string>,
  rKnowH: { en: "Right to know / access", de: "Recht auf Auskunft", fr: "Droit de savoir / d'accès" } satisfies LegalCopy<string>,
  rKnowD: {
    en: "request disclosure of the categories and specific pieces of personal information we have collected about you.",
    de: "Sie können die Offenlegung der Kategorien und konkreten personenbezogenen Daten verlangen, die wir über Sie erhoben haben.",
    fr: "demander la divulgation des catégories et des éléments spécifiques de données personnelles que nous avons collectés à votre sujet.",
  } satisfies LegalCopy<string>,
  rDeleteH: { en: "Right to delete", de: "Recht auf Löschung", fr: "Droit à l'effacement" } satisfies LegalCopy<string>,
  rDeleteD: {
    en: "request deletion of your personal information, subject to certain legal exceptions (e.g., tax retention obligations).",
    de: "Sie können die Löschung Ihrer personenbezogenen Daten verlangen, vorbehaltlich gesetzlicher Ausnahmen (z. B. steuerliche Aufbewahrungspflichten).",
    fr: "demander la suppression de vos données personnelles, sous réserve de certaines exceptions légales (par exemple, obligations fiscales de conservation).",
  } satisfies LegalCopy<string>,
  rCorrectH: { en: "Right to correct", de: "Recht auf Berichtigung", fr: "Droit de rectification" } satisfies LegalCopy<string>,
  rCorrectD: {
    en: "request correction of inaccurate personal information.",
    de: "Sie können die Berichtigung unrichtiger personenbezogener Daten verlangen.",
    fr: "demander la correction de données personnelles inexactes.",
  } satisfies LegalCopy<string>,
  rLimitH: {
    en: "Right to limit use of sensitive personal information",
    de: "Recht auf Einschränkung der Verwendung sensibler Daten",
    fr: "Droit de limiter l'utilisation des données personnelles sensibles",
  } satisfies LegalCopy<string>,
  rLimitD: {
    en: "we do not use sensitive personal information beyond what is necessary to provide our services.",
    de: "Wir nutzen sensible personenbezogene Daten nicht über das hinaus, was zur Erbringung unserer Dienste erforderlich ist.",
    fr: "nous n'utilisons pas de données personnelles sensibles au-delà de ce qui est nécessaire à la fourniture de nos services.",
  } satisfies LegalCopy<string>,
  rNonDiscH: { en: "Right to non-discrimination", de: "Recht auf Nichtdiskriminierung", fr: "Droit à la non-discrimination" } satisfies LegalCopy<string>,
  rNonDiscD: {
    en: "we will not discriminate against you for exercising any of these rights.",
    de: "Wir benachteiligen Sie nicht, weil Sie diese Rechte wahrnehmen.",
    fr: "nous ne vous discriminerons pas pour avoir exercé l'un de ces droits.",
  } satisfies LegalCopy<string>,
  rOptOutH: { en: "Right to opt out of sale/sharing", de: "Widerspruchsrecht gegen Verkauf/Teilen", fr: "Droit de refuser la vente/le partage" } satisfies LegalCopy<string>,
  rOptOutD: {
    en: "not applicable — we do not sell or share personal information.",
    de: "nicht anwendbar — wir verkaufen oder teilen keine personenbezogenen Daten.",
    fr: "non applicable — nous ne vendons ni ne partageons de données personnelles.",
  } satisfies LegalCopy<string>,
  rAdmtH: { en: "Right re. automated decision-making (ADMT)", de: "Recht zu automatisierten Entscheidungen (ADMT)", fr: "Droit relatif à la prise de décision automatisée (ADMT)" } satisfies LegalCopy<string>,
  rAdmtD: {
    en: "we do not use automated decision-making technology (ADMT, as defined under California's November 2025 ADMT regulation) for any decision that has a legal or similarly significant effect on you. No opt-out is required because no such use occurs.",
    de: "Wir setzen keine automatisierte Entscheidungstechnologie (ADMT im Sinne der kalifornischen ADMT-Verordnung von November 2025) für Entscheidungen ein, die rechtliche oder ähnlich erhebliche Wirkungen auf Sie haben. Ein Widerspruch ist nicht erforderlich, da keine solche Nutzung stattfindet.",
    fr: "nous n'utilisons pas de technologie de prise de décision automatisée (ADMT au sens du règlement ADMT de Californie de novembre 2025) pour des décisions ayant un effet juridique ou similaire significatif sur vous. Aucune désinscription n'est requise car aucune telle utilisation n'a lieu.",
  } satisfies LegalCopy<string>,
  rProfilingH: { en: "Right to opt out of profiling for targeted advertising", de: "Widerspruchsrecht gegen Profiling für zielgerichtete Werbung", fr: "Droit de refuser le profilage à des fins de publicité ciblée" } satisfies LegalCopy<string>,
  rProfilingD: {
    en: "(Colorado, Connecticut, Virginia and similar states): we do not engage in profiling for targeted advertising. No opt-out signal handling is required.",
    de: "(Colorado, Connecticut, Virginia und ähnliche Bundesstaaten): Wir betreiben kein Profiling zu zielgerichteter Werbung. Eine Auswertung von Opt-out-Signalen ist nicht erforderlich.",
    fr: "(Colorado, Connecticut, Virginie et États similaires) : nous ne pratiquons aucun profilage à des fins de publicité ciblée. Aucun traitement de signaux d'opt-out n'est requis.",
  } satisfies LegalCopy<string>,
  submitH: { en: "How to submit a request", de: "Wie Sie einen Antrag stellen", fr: "Comment soumettre une demande" } satisfies LegalCopy<string>,
  submitLead: {
    en: "To submit a verifiable consumer request, you may:",
    de: "Um einen überprüfbaren Verbraucherantrag einzureichen, können Sie:",
    fr: "Pour soumettre une demande consommateur vérifiable, vous pouvez :",
  } satisfies LegalCopy<string>,
  submitEmail: {
    en: 'email us with the subject line "US Privacy Request"',
    de: 'uns mit der Betreffzeile "US Privacy Request" eine E-Mail senden',
    fr: 'nous écrire un e-mail avec l\'objet « US Privacy Request »',
  } satisfies LegalCopy<string>,
  submitSelf: {
    en: "use your account self-service settings to access, correct, or delete your data.",
    de: "die Self-Service-Einstellungen in Ihrem Konto nutzen, um Ihre Daten einzusehen, zu berichtigen oder zu löschen.",
    fr: "utiliser les paramètres en libre-service de votre compte pour consulter, corriger ou supprimer vos données.",
  } satisfies LegalCopy<string>,
  verify: {
    en: "We will verify your identity by matching the information in your request against data we already hold. You may designate an authorized agent to submit a request on your behalf; the agent must present a valid power of attorney or your signed written authorization.",
    de: "Wir verifizieren Ihre Identität, indem wir die Angaben in Ihrem Antrag mit den uns bereits vorliegenden Daten abgleichen. Sie können einen bevollmächtigten Vertreter benennen, der einen Antrag in Ihrem Namen stellt; der Vertreter muss eine gültige Vollmacht oder Ihre unterschriebene schriftliche Bevollmächtigung vorlegen.",
    fr: "Nous vérifierons votre identité en comparant les informations de votre demande avec les données que nous détenons déjà. Vous pouvez désigner un mandataire autorisé à soumettre une demande en votre nom ; le mandataire doit présenter une procuration valide ou votre autorisation écrite signée.",
  } satisfies LegalCopy<string>,
  timingH: { en: "Response timing", de: "Antwortzeit", fr: "Délai de réponse" } satisfies LegalCopy<string>,
  timingText: {
    en: "We will respond to verifiable consumer requests within 45 days of receipt. If additional time is needed, we will notify you of the reason and extension period (up to an additional 45 days).",
    de: "Wir beantworten überprüfbare Verbraucheranträge innerhalb von 45 Tagen nach Eingang. Sollte zusätzliche Zeit erforderlich sein, teilen wir Ihnen den Grund und den Verlängerungszeitraum mit (bis zu 45 weitere Tage).",
    fr: "Nous répondons aux demandes consommateur vérifiables dans les 45 jours suivant la réception. Si un délai supplémentaire est nécessaire, nous vous informerons de la raison et de la période de prolongation (jusqu'à 45 jours supplémentaires).",
  } satisfies LegalCopy<string>,
  incentiveH: { en: "Financial incentives", de: "Finanzielle Anreize", fr: "Incitations financières" } satisfies LegalCopy<string>,
  incentiveText: {
    en: "We do not offer financial incentives (including prices, rates, service levels, or quality) related to the collection, retention, sale, or deletion of personal information.",
    de: "Wir bieten keine finanziellen Anreize (einschließlich Preisen, Tarifen, Serviceleveln oder Qualität) im Zusammenhang mit der Erhebung, Speicherung, dem Verkauf oder der Löschung personenbezogener Daten.",
    fr: "Nous n'offrons aucune incitation financière (y compris prix, tarifs, niveaux de service ou qualité) liée à la collecte, à la conservation, à la vente ou à la suppression de données personnelles.",
  } satisfies LegalCopy<string>,
  sensitiveH: { en: "Sensitive personal information", de: "Sensible personenbezogene Daten", fr: "Données personnelles sensibles" } satisfies LegalCopy<string>,
  sensitiveText: {
    en: "We do not collect or process sensitive personal information as defined under the CCPA/CPRA for purposes beyond what is necessary to perform the services you have requested.",
    de: "Wir erheben oder verarbeiten keine sensiblen personenbezogenen Daten im Sinne des CCPA/CPRA über das hinaus, was zur Erbringung der von Ihnen angefragten Dienste erforderlich ist.",
    fr: "Nous ne collectons ni ne traitons de données personnelles sensibles au sens du CCPA/CPRA au-delà de ce qui est nécessaire à la fourniture des services que vous avez demandés.",
  } satisfies LegalCopy<string>,
  contactH: { en: "Contact", de: "Kontakt", fr: "Contact" } satisfies LegalCopy<string>,
  contactText: {
    en: "For questions about this notice or to exercise your rights, contact:",
    de: "Für Fragen zu diesem Hinweis oder zur Ausübung Ihrer Rechte wenden Sie sich an:",
    fr: "Pour toute question concernant cet avis ou pour exercer vos droits, contactez :",
  } satisfies LegalCopy<string>,
  lastUpdated: { en: "Last updated", de: "Letzte Aktualisierung", fr: "Dernière mise à jour" } satisfies LegalCopy<string>,
} as const;

const CATEGORIES: Array<{
  category: LegalCopy<string>;
  examples: LegalCopy<string>;
  source: LegalCopy<string>;
  purpose: LegalCopy<string>;
}> = [
  {
    category: { en: "Identifiers", de: "Identifikatoren", fr: "Identifiants" },
    examples: {
      en: "Name, email, phone number, IP address",
      de: "Name, E-Mail, Telefonnummer, IP-Adresse",
      fr: "Nom, e-mail, numéro de téléphone, adresse IP",
    },
    source: {
      en: "Directly from you; automatically collected",
      de: "Direkt von Ihnen; automatisch erhoben",
      fr: "Directement de vous ; collecté automatiquement",
    },
    purpose: {
      en: "Account management, ticket fulfillment, customer support",
      de: "Kontoverwaltung, Ticketabwicklung, Kundenservice",
      fr: "Gestion du compte, exécution du billet, support client",
    },
  },
  {
    category: {
      en: "Customer records (Cal. Civ. Code § 1798.80(e))",
      de: "Kundendaten (Cal. Civ. Code § 1798.80(e))",
      fr: "Dossiers clients (Cal. Civ. Code § 1798.80(e))",
    },
    examples: {
      en: "Name, address, phone, payment confirmation (no card numbers)",
      de: "Name, Anschrift, Telefon, Zahlungsbestätigung (keine Kartennummern)",
      fr: "Nom, adresse, téléphone, confirmation de paiement (pas de numéros de carte)",
    },
    source: {
      en: "Directly from you; payment processor (Stripe)",
      de: "Direkt von Ihnen; Zahlungsdienstleister (Stripe)",
      fr: "Directement de vous ; prestataire de paiement (Stripe)",
    },
    purpose: {
      en: "Order processing, invoicing, tax compliance",
      de: "Bestellabwicklung, Rechnungstellung, steuerliche Compliance",
      fr: "Traitement des commandes, facturation, conformité fiscale",
    },
  },
  {
    category: {
      en: "Commercial information",
      de: "Kommerzielle Informationen",
      fr: "Informations commerciales",
    },
    examples: {
      en: "Ticket purchases, order history, transaction amounts",
      de: "Ticketkäufe, Bestellhistorie, Transaktionsbeträge",
      fr: "Achats de billets, historique des commandes, montants des transactions",
    },
    source: {
      en: "Generated from your use of services",
      de: "Aus Ihrer Nutzung der Dienste erzeugt",
      fr: "Générées par votre utilisation des services",
    },
    purpose: {
      en: "Service delivery, analytics, customer support",
      de: "Leistungserbringung, Analyse, Kundenservice",
      fr: "Fourniture de service, analyse, support client",
    },
  },
  {
    category: {
      en: "Internet / electronic network activity",
      de: "Internet- / Netzwerkaktivität",
      fr: "Activité Internet / réseau électronique",
    },
    examples: {
      en: "Browser type, pages visited, timestamps",
      de: "Browsertyp, besuchte Seiten, Zeitstempel",
      fr: "Type de navigateur, pages visitées, horodatages",
    },
    source: {
      en: "Automatically collected (server logs)",
      de: "Automatisch erhoben (Serverprotokolle)",
      fr: "Collectées automatiquement (journaux serveur)",
    },
    purpose: {
      en: "Security, debugging, service improvement",
      de: "Sicherheit, Fehlersuche, Dienstverbesserung",
      fr: "Sécurité, débogage, amélioration du service",
    },
  },
  {
    category: {
      en: "Geolocation data",
      de: "Standortdaten",
      fr: "Données de géolocalisation",
    },
    examples: {
      en: "Approximate location derived from IP address",
      de: "Ungefährer Standort aus der IP-Adresse abgeleitet",
      fr: "Localisation approximative dérivée de l'adresse IP",
    },
    source: {
      en: "Automatically collected",
      de: "Automatisch erhoben",
      fr: "Collectées automatiquement",
    },
    purpose: {
      en: "Locale/language detection, fraud prevention",
      de: "Sprach-/Locale-Erkennung, Betrugsprävention",
      fr: "Détection de la langue/locale, prévention de la fraude",
    },
  },
];

export function UsPrivacyNotice({
  company,
  privacyUrl,
  locale = "en",
}: {
  company: PublicCompanyInfo | null;
  privacyUrl: string;
  locale?: LegalLocale;
}) {
  const c = company;
  const privacyEmail = c?.privacy_email ?? c?.primary_email ?? "";

  return (
    <article>
      <h1>{t(COPY.heading, locale)}</h1>
      <p className="lead">{t(COPY.lead, locale)}</p>

      <h2>{t(COPY.scopeH, locale)}</h2>
      <p>
        {t(COPY.scopeText, locale)}{" "}
        <a href={privacyUrl}>{t(COPY.privacyLinkLabel, locale)}</a>.
      </p>

      <h2>{t(COPY.categoriesH, locale)}</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>{t(COPY.thCategory, locale)}</th>
              <th>{t(COPY.thExamples, locale)}</th>
              <th>{t(COPY.thSource, locale)}</th>
              <th>{t(COPY.thPurpose, locale)}</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((row, i) => (
              <tr key={i}>
                <td>{t(row.category, locale)}</td>
                <td>{t(row.examples, locale)}</td>
                <td>{t(row.source, locale)}</td>
                <td>{t(row.purpose, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t(COPY.noSellH, locale)}</h2>
      <p><strong>{t(COPY.noSellText, locale)}</strong></p>

      <h2>{t(COPY.rightsH, locale)}</h2>
      <p>{t(COPY.rightsLead, locale)}</p>
      <ul>
        <li><strong>{t(COPY.rKnowH, locale)}</strong>: {t(COPY.rKnowD, locale)}</li>
        <li><strong>{t(COPY.rDeleteH, locale)}</strong>: {t(COPY.rDeleteD, locale)}</li>
        <li><strong>{t(COPY.rCorrectH, locale)}</strong>: {t(COPY.rCorrectD, locale)}</li>
        <li><strong>{t(COPY.rLimitH, locale)}</strong>: {t(COPY.rLimitD, locale)}</li>
        <li><strong>{t(COPY.rNonDiscH, locale)}</strong>: {t(COPY.rNonDiscD, locale)}</li>
        <li><strong>{t(COPY.rOptOutH, locale)}</strong>: {t(COPY.rOptOutD, locale)}</li>
        <li><strong>{t(COPY.rAdmtH, locale)}</strong>: {t(COPY.rAdmtD, locale)}</li>
        <li><strong>{t(COPY.rProfilingH, locale)}</strong>: {t(COPY.rProfilingD, locale)}</li>
      </ul>

      <h2>{t(COPY.submitH, locale)}</h2>
      <p>{t(COPY.submitLead, locale)}</p>
      <ul>
        <li>
          {t(COPY.submitEmail, locale)}:{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </li>
        <li>{t(COPY.submitSelf, locale)}</li>
      </ul>
      <p>{t(COPY.verify, locale)}</p>

      <h2>{t(COPY.timingH, locale)}</h2>
      <p>{t(COPY.timingText, locale)}</p>

      <h2>{t(COPY.incentiveH, locale)}</h2>
      <p>{t(COPY.incentiveText, locale)}</p>

      <h2>{t(COPY.sensitiveH, locale)}</h2>
      <p>{t(COPY.sensitiveText, locale)}</p>

      <h2>{t(COPY.contactH, locale)}</h2>
      <p>{t(COPY.contactText, locale)}</p>
      {c && (
        <address className="not-italic whitespace-pre-line">
          {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
          {"\n"}{formatRegisteredAddress(c)}
          {"\n"}{privacyEmail}
        </address>
      )}

      <hr />
      <p className="text-xs text-muted-foreground">
        {t(COPY.lastUpdated, locale)}: {t(LEGAL_LAST_UPDATED, locale)}
      </p>
    </article>
  );
}
