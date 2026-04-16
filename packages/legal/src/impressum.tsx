// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by a German-
// admitted Rechtsanwalt. Do not consider this final for commercial launch
// until counsel signs off. Version: packages/legal/src/version.ts.

import type { LegalContext } from "./types";
import { t } from "./types";
import { formatRegisteredAddress, formatFrenchAddress, formatParentAddress } from "./company";
import { LEGAL_LAST_UPDATED } from "./version";
import type { LegalCopy } from "./types";

const heading: LegalCopy<string> = {
  en: "Imprint (Legal Notice)",
  de: "Impressum",
  fr: "Mentions légales",
};

const copy = {
  informationPer: {
    en: "Information pursuant to § 5 DDG (German Digital Services Act)",
    de: "Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)",
    fr: "Informations conformément au § 5 DDG (loi allemande sur les services numériques)",
  },
  address: { en: "Address", de: "Adresse", fr: "Adresse" },
  operational: { en: "Operational headquarters", de: "Operativer Sitz", fr: "Siège opérationnel" },
  representatives: {
    en: "Authorized representative(s)",
    de: "Vertretungsberechtigte(r) Geschäftsführer",
    fr: "Représentant(s) autorisé(s)",
  },
  contact: { en: "Contact", de: "Kontakt", fr: "Contact" },
  email: { en: "Email", de: "E-Mail", fr: "E-mail" },
  phone: { en: "Phone", de: "Telefon", fr: "Téléphone" },
  contactFormLabel: { en: "Contact form", de: "Kontaktformular", fr: "Formulaire de contact" },
  register: { en: "Commercial register", de: "Handelsregister", fr: "Registre du commerce" },
  vatId: { en: "VAT identification number", de: "Umsatzsteuer-Identifikationsnummer", fr: "Numéro d'identification TVA" },
  taxId: { en: "Tax number", de: "Steuernummer", fr: "Numéro fiscal" },
  chamber: { en: "Chamber of commerce", de: "Zuständige Kammer", fr: "Chambre de commerce" },
  insurance: { en: "Professional liability insurance", de: "Berufshaftpflichtversicherung", fr: "Assurance responsabilité professionnelle" },
  supervisory: { en: "Supervisory authority", de: "Zuständige Aufsichtsbehörde", fr: "Autorité de surveillance compétente" },
  responsiblePerson: {
    en: "Responsible for content pursuant to § 18(2) MStV",
    de: "Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV",
    fr: "Responsable du contenu conformément au § 18 al. 2 MStV",
  },
  odr: {
    en: "EU Online Dispute Resolution",
    de: "EU-Streitschlichtung (Online-Streitbeilegung)",
    fr: "Règlement des litiges en ligne de l'UE",
  },
  odrText: {
    en: "The European Commission provides a platform for online dispute resolution (ODR):",
    de: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:",
    fr: "La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL) :",
  },
  vsbg: {
    en: "Consumer dispute resolution (§ 36 VSBG)",
    de: "Verbraucherstreitbeilegung (§ 36 VSBG)",
    fr: "Résolution des litiges des consommateurs (§ 36 VSBG)",
  },
  vsbgNotWilling: {
    en: "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
    de: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    fr: "Nous ne sommes ni disposés ni tenus de participer à des procédures de règlement des litiges devant un organisme de médiation des consommateurs.",
  },
  vsbgWilling: {
    en: "We are willing to participate in dispute resolution proceedings before a consumer arbitration board.",
    de: "Wir sind bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    fr: "Nous sommes disposés à participer à des procédures de règlement des litiges devant un organisme de médiation des consommateurs.",
  },
  liability: { en: "Liability for content", de: "Haftung für Inhalte", fr: "Responsabilité pour le contenu" },
  liabilityText: {
    en: "As a service provider, we are responsible for our own content on these pages in accordance with § 7(1) DDG. According to §§ 8 to 10 DDG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the time we become aware of a specific infringement. Upon becoming aware of such infringements, we will remove this content immediately.",
    de: "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.",
    fr: "En tant que prestataire de services, nous sommes responsables de nos propres contenus sur ces pages conformément au § 7 al. 1 DDG. Toutefois, en vertu des §§ 8 à 10 DDG, nous ne sommes pas tenus de surveiller les informations de tiers transmises ou stockées ni de rechercher les circonstances indiquant une activité illégale. Les obligations de suppression ou de blocage de l'utilisation d'informations conformément au droit général restent inchangées. Cependant, la responsabilité à cet égard n'est possible qu'à partir du moment où nous avons connaissance d'une infraction spécifique. Dès que nous aurons connaissance de telles infractions, nous supprimerons immédiatement ce contenu.",
  },
  liabilityLinks: { en: "Liability for links", de: "Haftung für Links", fr: "Responsabilité pour les liens" },
  liabilityLinksText: {
    en: "Our website contains links to external third-party websites over whose content we have no influence. We therefore cannot assume any liability for this third-party content. The respective provider or operator of the pages is always responsible for the content of linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. However, permanent monitoring of the content of linked pages is unreasonable without concrete evidence of a violation. Upon becoming aware of infringements, we will remove such links immediately.",
    de: "Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.",
    fr: "Notre offre contient des liens vers des sites web externes de tiers dont nous ne contrôlons pas le contenu. Nous ne pouvons donc assumer aucune responsabilité pour ce contenu tiers. Le fournisseur ou l'opérateur respectif des pages est toujours responsable du contenu des pages liées. Les pages liées ont été vérifiées pour d'éventuelles violations de la loi au moment de la liaison. Aucun contenu illégal n'était identifiable au moment de la liaison. Toutefois, une surveillance permanente du contenu des pages liées est déraisonnable sans preuve concrète d'une infraction. Dès que nous aurons connaissance d'infractions, nous supprimerons immédiatement ces liens.",
  },
  copyright: { en: "Copyright", de: "Urheberrecht", fr: "Droit d'auteur" },
  copyrightText: {
    en: "The content and works created by the site operators on these pages are subject to copyright law. Reproduction, editing, distribution, and any kind of use outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use. Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of infringements, we will remove such content immediately.",
    de: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.",
    fr: "Les contenus et œuvres créés par les opérateurs de ce site sont soumis au droit d'auteur. La reproduction, le traitement, la distribution et tout type d'utilisation en dehors des limites du droit d'auteur nécessitent le consentement écrit de l'auteur ou du créateur respectif. Les téléchargements et copies de ce site ne sont autorisés que pour un usage privé et non commercial. Dans la mesure où le contenu de ce site n'a pas été créé par l'opérateur, les droits d'auteur de tiers sont respectés. En particulier, les contenus de tiers sont identifiés comme tels. Si vous constatez néanmoins une violation du droit d'auteur, veuillez nous en informer. Dès que nous aurons connaissance d'infractions, nous supprimerons immédiatement ce contenu.",
  },
  frenchEntity: { en: "French entity", de: "Französische Gesellschaft", fr: "Entité française" },
  parentOrg: { en: "Parent organization", de: "Muttergesellschaft", fr: "Société mère" },
  lastUpdated: { en: "Last updated", de: "Letzte Aktualisierung", fr: "Dernière mise à jour" },
} satisfies Record<string, LegalCopy<string>>;

export function Impressum({ company, locale }: LegalContext) {
  const c = company;

  return (
    <article>
      <h1>{t(heading, locale)}</h1>

      <h2>{t(copy.informationPer, locale)}</h2>
      {c && (
        <p>
          {c.legal_name}
          {c.legal_form ? ` (${c.legal_form})` : ""}
          {c.trade_name ? (
            <>
              <br />
              {locale === "de"
                ? "Handelsname"
                : locale === "fr"
                  ? "Nom commercial"
                  : "Trading as"}: {c.trade_name}
            </>
          ) : null}
        </p>
      )}

      <h3>{t(copy.address, locale)}</h3>
      {c && (
        <address className="not-italic whitespace-pre-line">
          {formatRegisteredAddress(c)}
        </address>
      )}

      {c?.office_line1 && (
        <>
          <h3>{t(copy.operational, locale)}</h3>
          <address className="not-italic whitespace-pre-line">
            {c.office_line1}
            {c.office_line2 ? `\n${c.office_line2}` : ""}
            {c.office_postal_code || c.office_city
              ? `\n${[c.office_postal_code, c.office_city].filter(Boolean).join("\u00a0")}`
              : ""}
            {c.office_country ? `\n${c.office_country}` : ""}
          </address>
        </>
      )}

      <h3>{t(copy.representatives, locale)}</h3>
      <p>{c?.managing_directors ?? "—"}</p>

      <h3>{t(copy.contact, locale)}</h3>
      <ul>
        <li>
          {t(copy.email, locale)}: {c?.primary_email ?? "—"}
        </li>
        {c?.phone && (
          <li>
            {t(copy.phone, locale)}: {c.phone}
          </li>
        )}
        {c?.contact_form_url && (
          <li>
            {t(copy.contactFormLabel, locale)}:{" "}
            <a href={c.contact_form_url}>{c.contact_form_url}</a>
          </li>
        )}
      </ul>

      {(c?.hrb_number || c?.hrb_court) && (
        <>
          <h3>{t(copy.register, locale)}</h3>
          <p>
            {c.hrb_number}
            {c.hrb_court ? `, ${c.hrb_court}` : ""}
          </p>
        </>
      )}

      {c?.vat_id && (
        <>
          <h3>{t(copy.vatId, locale)}</h3>
          <p>{c.vat_id}</p>
        </>
      )}

      {c?.tax_id && (
        <>
          <h3>{t(copy.taxId, locale)}</h3>
          <p>{c.tax_id}</p>
        </>
      )}

      {c?.chamber_of_commerce && (
        <>
          <h3>{t(copy.chamber, locale)}</h3>
          <p>{c.chamber_of_commerce}</p>
        </>
      )}

      {c?.professional_liability_insurance && (
        <>
          <h3>{t(copy.insurance, locale)}</h3>
          <p>{c.professional_liability_insurance}</p>
        </>
      )}

      {c?.supervisory_authority && (
        <>
          <h3>{t(copy.supervisory, locale)}</h3>
          <p>{c.supervisory_authority}</p>
        </>
      )}

      <h3>{t(copy.responsiblePerson, locale)}</h3>
      <p>{c?.responsible_person ?? "—"}</p>

      <hr />

      {c?.fr_legal_name && (
        <>
          <h2>{t(copy.frenchEntity, locale)}</h2>
          <p>
            {c.fr_legal_name}
            {c.fr_legal_form ? ` (${c.fr_legal_form})` : ""}
            {c.fr_siren ? ` · SIREN ${c.fr_siren}` : ""}
            {c.fr_director ? (
              <>
                <br />
                {locale === "de"
                  ? "Geschäftsführer"
                  : locale === "fr"
                    ? "Directeur Général"
                    : "Director"}: {c.fr_director}
              </>
            ) : null}
          </p>
          <address className="not-italic whitespace-pre-line">
            {formatFrenchAddress(c)}
          </address>
        </>
      )}

      {c?.parent_company_name && (
        <>
          <h2>{t(copy.parentOrg, locale)}</h2>
          <p>{c.parent_company_name}</p>
          <address className="not-italic whitespace-pre-line">
            {formatParentAddress(c)}
          </address>
        </>
      )}

      <hr />

      <h2>{t(copy.odr, locale)}</h2>
      <p>
        {t(copy.odrText, locale)}{" "}
        <a
          href={c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"}
        </a>
      </p>

      <h2>{t(copy.vsbg, locale)}</h2>
      <p>
        {c?.vsbg_statement === "willing_specified" || c?.vsbg_statement === "willing_general"
          ? t(copy.vsbgWilling, locale)
          : t(copy.vsbgNotWilling, locale)}
      </p>

      <hr />

      <h2>{t(copy.liability, locale)}</h2>
      <p>{t(copy.liabilityText, locale)}</p>

      <h2>{t(copy.liabilityLinks, locale)}</h2>
      <p>{t(copy.liabilityLinksText, locale)}</p>

      <h2>{t(copy.copyright, locale)}</h2>
      <p>{t(copy.copyrightText, locale)}</p>

      <hr />
      <p className="text-xs text-muted-foreground">
        {t(copy.lastUpdated, locale)}: {t(LEGAL_LAST_UPDATED, locale)}
      </p>
    </article>
  );
}
