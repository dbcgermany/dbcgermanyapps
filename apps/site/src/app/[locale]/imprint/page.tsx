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
        ? "Impressum"
        : locale === "fr"
          ? "Mentions légales"
          : "Imprint",
  };
}

const HEADINGS = {
  en: {
    title: "Imprint",
    info: "Information according to § 5 TMG",
    represented: "Represented by",
    contact: "Contact",
    register: "Register entry",
    vat: "VAT ID",
    disputes: "Consumer dispute resolution",
    disputesBody:
      "We are neither willing nor obliged to participate in dispute-resolution proceedings before a consumer arbitration board.",
    responsible: "Editorially responsible",
  },
  de: {
    title: "Impressum",
    info: "Angaben gemäß § 5 TMG",
    represented: "Vertreten durch",
    contact: "Kontakt",
    register: "Registereintrag",
    vat: "Umsatzsteuer-ID",
    disputes: "Verbraucherstreitbeilegung",
    disputesBody:
      "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    responsible: "Redaktionell verantwortlich",
  },
  fr: {
    title: "Mentions légales",
    info: "Informations selon § 5 TMG",
    represented: "Représenté par",
    contact: "Contact",
    register: "Inscription au registre",
    vat: "N° de TVA",
    disputes: "Règlement des litiges de consommation",
    disputesBody:
      "Nous ne sommes ni disposés ni obligés de participer à une procédure de règlement des litiges devant une commission d'arbitrage des consommateurs.",
    responsible: "Responsable de la publication",
  },
} as const;

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = HEADINGS[locale as keyof typeof HEADINGS] ?? HEADINGS.en;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {t.title}
      </h1>

      <section className="mt-10 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.info}
        </p>
        <p>
          <strong>DBC Germany</strong>
        </p>
        <p>Speditionstraße 15a</p>
        <p>40221 Düsseldorf</p>
        <p>Deutschland</p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.represented}
        </p>
        <p>Jean-Clément Diambilay — Founder, DBC</p>
        <p>Ruth Bambi — Project Manager / Germany CEO</p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.contact}
        </p>
        <p>
          {locale === "de" ? "Telefon" : locale === "fr" ? "Téléphone" : "Phone"}
          :{" "}
          <a
            href="tel:+4916314895470"
            className="text-primary hover:text-primary/80"
          >
            +49 163 148 95 47
          </a>
        </p>
        <p>
          E-Mail:{" "}
          <a
            href="mailto:info@dbc-germany.com"
            className="text-primary hover:text-primary/80"
          >
            info@dbc-germany.com
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.register}
        </p>
        <p className="text-muted-foreground">
          {locale === "de"
            ? "HRB-Nummer und Registergericht werden nach Eintragung veröffentlicht."
            : locale === "fr"
              ? "Numéro HRB et tribunal seront publiés après enregistrement."
              : "Commercial register number and court will be published upon registration."}
        </p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.vat}
        </p>
        <p className="text-muted-foreground">
          {locale === "de"
            ? "Wird nach Zuteilung ergänzt."
            : locale === "fr"
              ? "À compléter après attribution."
              : "To be added upon issuance."}
        </p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.responsible}
        </p>
        <p>Jay N Kalala — Sales &amp; Sponsorship Lead</p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.disputes}
        </p>
        <p className="text-muted-foreground">{t.disputesBody}</p>
      </section>
    </div>
  );
}
