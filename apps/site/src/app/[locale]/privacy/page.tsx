import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de"
        ? "Datenschutzerklärung"
        : locale === "fr"
          ? "Politique de confidentialité"
          : "Privacy Policy",
  };
}

const CONTENT = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated",
    date: "April 13, 2026",
    sections: [
      {
        heading: "Who we are",
        body: "DBC Germany GmbH (\"DBC Germany\", \"we\") is the controller of personal data processed on dbc-germany.com and ticket.dbc-germany.com. Contact: hello@dbc-germany.com.",
      },
      {
        heading: "What we collect",
        body: "We collect only what we need to run our services: contact form submissions (name, email, topic, message), account data for buyers and staff (email, password hash, profile info), and order/ticket records. Technical logs (IP, user-agent) are retained short-term for security and abuse detection.",
      },
      {
        heading: "Legal basis",
        body: "Contract (Art. 6(1)(b) GDPR) for your orders and tickets; legitimate interest (Art. 6(1)(f)) for fraud prevention, cookie consent for optional analytics; explicit consent (Art. 6(1)(a)) for marketing emails.",
      },
      {
        heading: "Sharing",
        body: "Processors include Supabase (EU-Central, Frankfurt), Stripe (payments), Resend (transactional email), Vercel (hosting, EU). No data is sold.",
      },
      {
        heading: "Your rights",
        body: "Access, rectification, erasure, restriction, portability, objection. Email hello@dbc-germany.com and we will respond within one month.",
      },
      {
        heading: "Retention",
        body: "Orders and invoices: 10 years (German tax law). Audit log: 2 years. Marketing contacts: until you unsubscribe.",
      },
      {
        heading: "Cookies",
        body: "We use strictly necessary cookies for login and cart. Optional analytics cookies are set only after consent. Manage via the cookie banner.",
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert",
    date: "13. April 2026",
    sections: [
      {
        heading: "Wer wir sind",
        body: "Die DBC Germany GmbH („DBC Germany“, „wir“) ist Verantwortliche im Sinne der DSGVO für die auf dbc-germany.com und ticket.dbc-germany.com verarbeiteten personenbezogenen Daten. Kontakt: hello@dbc-germany.com.",
      },
      {
        heading: "Welche Daten wir erheben",
        body: "Wir erheben nur, was nötig ist: Kontaktformular-Einsendungen (Name, E-Mail, Thema, Nachricht), Konto-Daten für Käufer:innen und Mitarbeitende (E-Mail, Passwort-Hash, Profilinformationen) sowie Bestell- und Ticket-Daten. Technische Logs (IP, User-Agent) werden kurzfristig zur Sicherheit gespeichert.",
      },
      {
        heading: "Rechtsgrundlage",
        body: "Vertrag (Art. 6 Abs. 1 lit. b DSGVO) für Bestellungen und Tickets; berechtigtes Interesse (Art. 6 Abs. 1 lit. f) für Betrugsprävention; Einwilligung (Art. 6 Abs. 1 lit. a) für Marketing-E-Mails und optionale Analytik-Cookies.",
      },
      {
        heading: "Weitergabe",
        body: "Auftragsverarbeiter: Supabase (EU-Central, Frankfurt), Stripe (Zahlungen), Resend (transaktionale E-Mails), Vercel (Hosting, EU). Keine Datenweitergabe zu Verkaufszwecken.",
      },
      {
        heading: "Ihre Rechte",
        body: "Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch. Schreiben Sie an hello@dbc-germany.com — wir antworten innerhalb eines Monats.",
      },
      {
        heading: "Aufbewahrung",
        body: "Bestellungen und Rechnungen: 10 Jahre (HGB). Audit-Log: 2 Jahre. Marketing-Kontakte: bis zur Abmeldung.",
      },
      {
        heading: "Cookies",
        body: "Wir verwenden technisch notwendige Cookies für Login und Warenkorb. Optionale Analytik-Cookies werden nur nach Einwilligung gesetzt. Verwaltung über das Cookie-Banner.",
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour",
    date: "13 avril 2026",
    sections: [
      {
        heading: "Qui nous sommes",
        body: "DBC Germany GmbH (« DBC Germany », « nous ») est responsable du traitement des données personnelles collectées sur dbc-germany.com et ticket.dbc-germany.com. Contact : hello@dbc-germany.com.",
      },
      {
        heading: "Ce que nous collectons",
        body: "Uniquement le nécessaire : soumissions du formulaire de contact (nom, e-mail, sujet, message), données de compte acheteur·euse et staff (e-mail, hash du mot de passe, profil) et enregistrements de commandes/billets. Les logs techniques (IP, user-agent) sont conservés à court terme pour la sécurité.",
      },
      {
        heading: "Base légale",
        body: "Contrat (art. 6(1)(b) RGPD) pour vos commandes et billets ; intérêt légitime (art. 6(1)(f)) pour la prévention de la fraude ; consentement (art. 6(1)(a)) pour les e-mails marketing et les cookies analytiques optionnels.",
      },
      {
        heading: "Partage",
        body: "Sous-traitants : Supabase (EU-Central, Francfort), Stripe (paiements), Resend (e-mails transactionnels), Vercel (hébergement, UE). Aucune revente de données.",
      },
      {
        heading: "Vos droits",
        body: "Accès, rectification, effacement, limitation, portabilité, opposition. Écrivez à hello@dbc-germany.com — réponse sous un mois.",
      },
      {
        heading: "Conservation",
        body: "Commandes et factures : 10 ans (obligations fiscales allemandes). Journal d'audit : 2 ans. Contacts marketing : jusqu'au désabonnement.",
      },
      {
        heading: "Cookies",
        body: "Nous utilisons des cookies strictement nécessaires pour la connexion et le panier. Les cookies analytiques optionnels sont posés après consentement. Gestion via la bannière cookies.",
      },
    ],
  },
} as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content = CONTENT[locale as keyof typeof CONTENT] ?? CONTENT.en;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="text-xs text-muted-foreground">
        {content.updated}: {content.date}
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {content.title}
      </h1>
      <div className="mt-10 space-y-8">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl font-bold">{section.heading}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
