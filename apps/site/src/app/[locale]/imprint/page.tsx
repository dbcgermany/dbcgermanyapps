import type { Metadata } from "next";
import { getCompanyInfo } from "@/lib/company-info";

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
    responsible: "Editorially responsible (§ 55 Abs. 2 RStV)",
    international: "International group entities",
    pending:
      "DBC Germany is currently being set up as a UG (haftungsbeschränkt). Register number, court, and VAT ID will be published here as soon as they are issued.",
    parent: "Parent organisation",
    france: "France",
    drc: "DR Congo",
    disclaimer: "Liability for content",
    disclaimerBody:
      "As a service provider we are responsible for our own content according to § 7 (1) TMG. According to §§ 8 to 10 TMG we are however not obliged to monitor transmitted or stored information. Obligations to remove or block the use of information under general laws remain unaffected.",
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
    responsible: "Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)",
    international: "Internationale Gruppengesellschaften",
    pending:
      "DBC Germany wird derzeit als UG (haftungsbeschränkt) gegründet. Handelsregisternummer, Registergericht und USt-IdNr. werden hier veröffentlicht, sobald sie erteilt sind.",
    parent: "Mutterorganisation",
    france: "Frankreich",
    drc: "DR Kongo",
    disclaimer: "Haftung für Inhalte",
    disclaimerBody:
      "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte verantwortlich. Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte Informationen zu überwachen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.",
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
    responsible: "Responsable de la publication (§ 55 al. 2 RStV)",
    international: "Entités internationales du groupe",
    pending:
      "DBC Germany est en cours d'immatriculation en tant qu'UG (haftungsbeschränkt). Le numéro HRB, le tribunal d'immatriculation et le numéro de TVA seront publiés dès leur attribution.",
    parent: "Organisation mère",
    france: "France",
    drc: "RD Congo",
    disclaimer: "Responsabilité relative au contenu",
    disclaimerBody:
      "En tant que prestataire de services, nous sommes responsables de nos propres contenus selon § 7 al. 1 TMG. Conformément aux §§ 8 à 10 TMG, nous ne sommes toutefois pas tenus de surveiller les informations transmises ou stockées. Les obligations de suppression ou de blocage de l'utilisation d'informations en vertu des lois générales restent inchangées.",
  },
} as const;

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = HEADINGS[locale as keyof typeof HEADINGS] ?? HEADINGS.en;
  const info = await getCompanyInfo();

  const fullName = [info?.legal_name, info?.legal_form]
    .filter(Boolean)
    .join(" ");
  const fullAddress = [
    info?.registered_address,
    [info?.registered_postal_code, info?.registered_city]
      .filter(Boolean)
      .join(" "),
    info?.registered_country,
  ].filter(Boolean);
  const register =
    info?.hrb_number && info?.hrb_court
      ? `${info.hrb_court} · HRB ${info.hrb_number}`
      : null;

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
          <strong>{fullName || "DBC Germany (UG in Gründung)"}</strong>
        </p>
        {fullAddress.length > 0 ? (
          fullAddress.map((line, i) => <p key={i}>{line}</p>)
        ) : (
          <>
            <p>Speditionstraße 15a</p>
            <p>40221 Düsseldorf</p>
            <p>Deutschland</p>
          </>
        )}
      </section>

      {info?.managing_directors && (
        <section className="mt-8 space-y-2 text-base">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.represented}
          </p>
          {info.managing_directors.split(",").map((name, i) => (
            <p key={i}>{name.trim()}</p>
          ))}
        </section>
      )}

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.contact}
        </p>
        {info?.phone && (
          <p>
            {locale === "de"
              ? "Telefon"
              : locale === "fr"
                ? "Téléphone"
                : "Phone"}
            :{" "}
            <a
              href={`tel:${info.phone.replace(/\s+/g, "")}`}
              className="text-primary hover:text-primary/80"
            >
              {info.phone}
            </a>
          </p>
        )}
        <p>
          E-Mail:{" "}
          <a
            href={`mailto:${info?.primary_email ?? "info@dbc-germany.com"}`}
            className="text-primary hover:text-primary/80"
          >
            {info?.primary_email ?? "info@dbc-germany.com"}
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.register}
        </p>
        <p className={register ? "" : "text-muted-foreground"}>
          {register ?? t.pending}
        </p>
      </section>

      <section className="mt-8 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.vat}
        </p>
        <p className={info?.vat_id ? "" : "text-muted-foreground"}>
          {info?.vat_id ?? t.pending}
        </p>
      </section>

      {info?.responsible_person && (
        <section className="mt-8 space-y-2 text-base">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.responsible}
          </p>
          <p>{info.responsible_person}</p>
          <p className="text-sm text-muted-foreground">
            {locale === "de"
              ? "Anschrift wie oben"
              : locale === "fr"
                ? "Adresse comme ci-dessus"
                : "Address as above"}
          </p>
        </section>
      )}

      <section className="mt-10 space-y-4 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.international}
        </p>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.parent} · {t.drc}
          </p>
          <p className="mt-2 font-medium">
            Diambilay Business Center SARL
          </p>
          <p className="text-sm text-muted-foreground">
            378, Av Likasi · Lubumbashi, Haut-Katanga · RD Congo
          </p>
          <p className="text-sm text-muted-foreground">
            +243 820 121 513 ·{" "}
            <a
              href="https://diambilaybusinesscenter.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              diambilaybusinesscenter.org
            </a>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.france}
          </p>
          <p className="mt-2 font-medium">
            DIAMBILAY BUSINESS CENTER (D.B.C.) — SAS
          </p>
          <p className="text-sm text-muted-foreground">
            43 Avenue du Gros Chêne · 95220 Herblay-sur-Seine · France
          </p>
          <p className="text-sm text-muted-foreground">
            SIREN 940 839 145 · SIRET 940 839 145 00015 · Capital 2 000 € ·{" "}
            {locale === "de"
              ? "immatrikuliert am 17.02.2025 beim RNE (INPI)"
              : locale === "fr"
                ? "immatriculée le 17/02/2025 au RNE (INPI)"
                : "registered on 17/02/2025 at the RNE (INPI)"}
          </p>
        </div>
      </section>

      <section className="mt-10 space-y-2 text-base">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.disclaimer}
        </p>
        <p className="text-sm text-muted-foreground">{t.disclaimerBody}</p>
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
