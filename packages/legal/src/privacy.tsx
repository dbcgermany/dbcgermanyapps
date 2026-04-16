// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by a German-
// admitted Rechtsanwalt. Do not consider this final for commercial launch
// until counsel signs off. Version: packages/legal/src/version.ts.

import type { LegalContext, LegalCopy, LegalLocale } from "./types";
import { t } from "./types";
import { formatRegisteredAddress } from "./company";
import { LEGAL_LAST_UPDATED } from "./version";

const heading: LegalCopy<string> = {
  en: "Privacy Policy",
  de: "Datenschutzerklärung",
  fr: "Politique de confidentialité",
};

function T({ k, locale }: { k: LegalCopy<string>; locale: LegalLocale }) {
  return <>{t(k, locale)}</>;
}

function S({
  children,
  locale,
}: {
  children: Record<LegalLocale, React.ReactNode>;
  locale: LegalLocale;
}) {
  return <>{children[locale] ?? children.en}</>;
}

export function PrivacyPolicy({ company, locale, marketingSiteUrl }: LegalContext) {
  const c = company;
  const privacyEmail = c?.privacy_email ?? c?.primary_email ?? "";
  const cookiesUrl = `${marketingSiteUrl}/${locale}/cookies`;
  const contactFormUrl = c?.contact_form_url ?? `${marketingSiteUrl}/${locale}/contact`;

  return (
    <article>
      <h1>{t(heading, locale)}</h1>

      {/* ——— 1. Controller ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "1. Controller",
            de: "1. Verantwortliche Stelle",
            fr: "1. Responsable du traitement",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <p>
              The controller within the meaning of the General Data Protection
              Regulation (GDPR) and other applicable data protection laws is:
            </p>
          ),
          de: (
            <p>
              Die verantwortliche Stelle im Sinne der Datenschutz-Grundverordnung
              (DSGVO) und anderer anwendbarer Datenschutzgesetze ist:
            </p>
          ),
          fr: (
            <p>
              Le responsable du traitement au sens du Règlement général sur la
              protection des données (RGPD) et des autres lois applicables en
              matière de protection des données est :
            </p>
          ),
        }}
      </S>
      {c && (
        <address className="not-italic whitespace-pre-line">
          {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
          {"\n"}
          {formatRegisteredAddress(c)}
          {"\n"}
          {c.primary_email}
          {c.phone ? `\n${c.phone}` : ""}
        </address>
      )}

      <h3>
        <S locale={locale}>
          {{
            en: "Data Protection Officer",
            de: "Datenschutzbeauftragte(r)",
            fr: "Délégué(e) à la protection des données",
          }}
        </S>
      </h3>
      {c?.dpo_required && c?.dpo_name ? (
        <p>
          {c.dpo_name}
          {c.dpo_email ? (
            <>
              {" — "}
              <a href={`mailto:${c.dpo_email}`}>{c.dpo_email}</a>
            </>
          ) : null}
        </p>
      ) : (
        <S locale={locale}>
          {{
            en: <p>A Data Protection Officer is not required under Art. 37 GDPR based on our current processing activities. For data protection inquiries, contact us at <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
            de: <p>Ein Datenschutzbeauftragter ist gemäß Art. 37 DSGVO aufgrund unserer aktuellen Verarbeitungstätigkeiten nicht erforderlich. Für Datenschutzanfragen wenden Sie sich an <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
            fr: <p>Un délégué à la protection des données n'est pas requis en vertu de l'art. 37 RGPD au regard de nos activités de traitement actuelles. Pour toute question relative à la protection des données, contactez-nous à <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
          }}
        </S>
      )}

      {/* ——— 2. What we collect ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "2. Personal data we collect",
            de: "2. Personenbezogene Daten, die wir erheben",
            fr: "2. Données personnelles que nous collectons",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <h3>Account data</h3>
              <p>Email address, first name, last name, phone number (optional), date of birth (optional), and postal address (optional).</p>
              <h3>Ticketing data</h3>
              <p>Buyer information, attendee title, first name, last name, email address, and ticket salutation preferences.</p>
              <h3>Newsletter data</h3>
              <p>Email address, consent timestamp, and the IP address at the time of double-opt-in confirmation (as proof of consent).</p>
              <h3>Payment data</h3>
              <p>Payments are processed by Stripe Payments Europe, Ltd. We never receive or store your full card number, CVC, or bank details. We receive only the confirmation of payment success, transaction reference, and billing metadata.</p>
              <h3>Technical data (server logs)</h3>
              <p>IP address, browser user-agent string, page requested, timestamp. Retained for 30 days, then automatically deleted.</p>
              <h3>Cookies</h3>
              <p>See our <a href={cookiesUrl}>Cookie Policy</a> for a detailed list.</p>
            </>
          ),
          de: (
            <>
              <h3>Kontodaten</h3>
              <p>E-Mail-Adresse, Vorname, Nachname, Telefonnummer (optional), Geburtsdatum (optional) und Postanschrift (optional).</p>
              <h3>Ticketdaten</h3>
              <p>Käuferinformationen, Titel des Teilnehmers, Vorname, Nachname, E-Mail-Adresse und Anredepräferenzen.</p>
              <h3>Newsletter-Daten</h3>
              <p>E-Mail-Adresse, Zeitstempel der Einwilligung und die IP-Adresse zum Zeitpunkt der Double-Opt-in-Bestätigung (als Einwilligungsnachweis).</p>
              <h3>Zahlungsdaten</h3>
              <p>Zahlungen werden von Stripe Payments Europe, Ltd. abgewickelt. Wir erhalten oder speichern niemals Ihre vollständige Kartennummer, CVC oder Bankdaten. Wir erhalten lediglich die Zahlungsbestätigung, Transaktionsreferenz und Rechnungsmetadaten.</p>
              <h3>Technische Daten (Serverprotokolle)</h3>
              <p>IP-Adresse, Browser-User-Agent, angeforderte Seite, Zeitstempel. Aufbewahrung: 30 Tage, danach automatische Löschung.</p>
              <h3>Cookies</h3>
              <p>Siehe unsere <a href={cookiesUrl}>Cookie-Richtlinie</a> für eine detaillierte Liste.</p>
            </>
          ),
          fr: (
            <>
              <h3>Données de compte</h3>
              <p>Adresse e-mail, prénom, nom, numéro de téléphone (facultatif), date de naissance (facultatif) et adresse postale (facultatif).</p>
              <h3>Données de billetterie</h3>
              <p>Informations sur l'acheteur, titre du participant, prénom, nom, adresse e-mail et préférences de salutation.</p>
              <h3>Données de newsletter</h3>
              <p>Adresse e-mail, horodatage du consentement et adresse IP au moment de la confirmation du double opt-in (comme preuve de consentement).</p>
              <h3>Données de paiement</h3>
              <p>Les paiements sont traités par Stripe Payments Europe, Ltd. Nous ne recevons ni ne stockons jamais votre numéro de carte complet, CVC ou coordonnées bancaires. Nous recevons uniquement la confirmation de paiement, la référence de transaction et les métadonnées de facturation.</p>
              <h3>Données techniques (journaux serveur)</h3>
              <p>Adresse IP, chaîne user-agent du navigateur, page demandée, horodatage. Conservation : 30 jours, puis suppression automatique.</p>
              <h3>Cookies</h3>
              <p>Consultez notre <a href={cookiesUrl}>politique relative aux cookies</a> pour une liste détaillée.</p>
            </>
          ),
        }}
      </S>

      {/* ——— 3. Purposes & legal bases ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "3. Purposes and legal bases for processing",
            de: "3. Zwecke und Rechtsgrundlagen der Verarbeitung",
            fr: "3. Finalités et bases juridiques du traitement",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Purpose</th><th>Legal basis (GDPR)</th></tr></thead>
                <tbody>
                  <tr><td>Account creation and management, ticket purchase and delivery, ticket transfers</td><td>Art. 6(1)(b) — performance of contract</td></tr>
                  <tr><td>Newsletter dispatch (double-opt-in)</td><td>Art. 6(1)(a) — consent (revocable at any time)</td></tr>
                  <tr><td>Fraud prevention, IT security, abuse detection</td><td>Art. 6(1)(f) — legitimate interest</td></tr>
                  <tr><td>Tax and accounting retention (invoices, receipts)</td><td>Art. 6(1)(c) — legal obligation (§ 147 AO, 10 years)</td></tr>
                  <tr><td>Photography and video at events for marketing</td><td>Art. 6(1)(f) — legitimate interest, with opt-out available on-site</td></tr>
                </tbody>
              </table>
            </div>
          ),
          de: (
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Zweck</th><th>Rechtsgrundlage (DSGVO)</th></tr></thead>
                <tbody>
                  <tr><td>Kontoerstellung und -verwaltung, Ticketkauf und -zustellung, Ticket-Übertragungen</td><td>Art. 6 Abs. 1 lit. b — Vertragserfüllung</td></tr>
                  <tr><td>Newsletter-Versand (Double-Opt-in)</td><td>Art. 6 Abs. 1 lit. a — Einwilligung (jederzeit widerrufbar)</td></tr>
                  <tr><td>Betrugsprävention, IT-Sicherheit, Missbrauchserkennung</td><td>Art. 6 Abs. 1 lit. f — berechtigtes Interesse</td></tr>
                  <tr><td>Steuerliche Aufbewahrungspflichten (Rechnungen, Belege)</td><td>Art. 6 Abs. 1 lit. c — rechtliche Verpflichtung (§ 147 AO, 10 Jahre)</td></tr>
                  <tr><td>Foto- und Videoaufnahmen bei Veranstaltungen zu Marketingzwecken</td><td>Art. 6 Abs. 1 lit. f — berechtigtes Interesse, mit Opt-out vor Ort</td></tr>
                </tbody>
              </table>
            </div>
          ),
          fr: (
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Finalité</th><th>Base juridique (RGPD)</th></tr></thead>
                <tbody>
                  <tr><td>Création et gestion de compte, achat et livraison de billets, transferts de billets</td><td>Art. 6(1)(b) — exécution du contrat</td></tr>
                  <tr><td>Envoi de newsletter (double opt-in)</td><td>Art. 6(1)(a) — consentement (révocable à tout moment)</td></tr>
                  <tr><td>Prévention de la fraude, sécurité informatique, détection des abus</td><td>Art. 6(1)(f) — intérêt légitime</td></tr>
                  <tr><td>Conservation fiscale et comptable (factures, reçus)</td><td>Art. 6(1)(c) — obligation légale (§ 147 AO, 10 ans)</td></tr>
                  <tr><td>Photographie et vidéo lors d'événements à des fins marketing</td><td>Art. 6(1)(f) — intérêt légitime, avec opt-out disponible sur place</td></tr>
                </tbody>
              </table>
            </div>
          ),
        }}
      </S>

      {/* ——— 4. Recipients & processors ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "4. Recipients and service providers (data processors)",
            de: "4. Empfänger und Dienstleister (Auftragsverarbeiter)",
            fr: "4. Destinataires et prestataires de services (sous-traitants)",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>We share personal data only with the following categories of service providers, each bound by a data processing agreement (DPA) or equivalent contractual safeguards:</p>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Provider</th><th>Purpose</th><th>Location / transfer basis</th></tr></thead>
                  <tbody>
                    <tr><td>Supabase, Inc.</td><td>Database, authentication, file storage</td><td>EU-Central (Frankfurt, Germany) — no transfer outside EEA</td></tr>
                    <tr><td>Stripe Payments Europe, Ltd.</td><td>Payment processing</td><td>Ireland (EU); onward US transfers covered by SCCs per Stripe DPA</td></tr>
                    <tr><td>Resend, Inc.</td><td>Transactional and newsletter email delivery</td><td>USA — EU-US Data Privacy Framework + Standard Contractual Clauses</td></tr>
                    <tr><td>Vercel, Inc.</td><td>Website hosting and delivery</td><td>USA — EU-US Data Privacy Framework + Standard Contractual Clauses</td></tr>
                    <tr><td>Google LLC (Workspace)</td><td>Operational email (info@, support@)</td><td>USA — EU-US Data Privacy Framework + Standard Contractual Clauses</td></tr>
                  </tbody>
                </table>
              </div>
              <p><strong>We do not sell, share, or otherwise disclose personal data to event sponsors, exhibitors, or other third parties for their own marketing purposes.</strong> Sponsors receive only aggregated, anonymized statistics (e.g., total attendance count).</p>
            </>
          ),
          de: (
            <>
              <p>Wir geben personenbezogene Daten nur an die folgenden Kategorien von Dienstleistern weiter, die jeweils durch einen Auftragsverarbeitungsvertrag (AVV) oder gleichwertige vertragliche Garantien gebunden sind:</p>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Anbieter</th><th>Zweck</th><th>Standort / Übermittlungsgrundlage</th></tr></thead>
                  <tbody>
                    <tr><td>Supabase, Inc.</td><td>Datenbank, Authentifizierung, Dateispeicherung</td><td>EU-Central (Frankfurt, Deutschland) — keine Übermittlung außerhalb des EWR</td></tr>
                    <tr><td>Stripe Payments Europe, Ltd.</td><td>Zahlungsabwicklung</td><td>Irland (EU); Weiterleitung in die USA durch SCCs gemäß Stripe-AVV</td></tr>
                    <tr><td>Resend, Inc.</td><td>Transaktions- und Newsletter-E-Mail-Versand</td><td>USA — EU-US-Datenschutzrahmen + Standardvertragsklauseln</td></tr>
                    <tr><td>Vercel, Inc.</td><td>Website-Hosting und -Bereitstellung</td><td>USA — EU-US-Datenschutzrahmen + Standardvertragsklauseln</td></tr>
                    <tr><td>Google LLC (Workspace)</td><td>Operative E-Mail (info@, support@)</td><td>USA — EU-US-Datenschutzrahmen + Standardvertragsklauseln</td></tr>
                  </tbody>
                </table>
              </div>
              <p><strong>Wir verkaufen, teilen oder offenbaren personenbezogene Daten nicht an Veranstaltungssponsoren, Aussteller oder andere Dritte für deren eigene Marketingzwecke.</strong> Sponsoren erhalten lediglich aggregierte, anonymisierte Statistiken (z. B. Gesamtteilnehmerzahl).</p>
            </>
          ),
          fr: (
            <>
              <p>Nous ne partageons les données personnelles qu'avec les catégories de prestataires de services suivantes, chacune liée par un contrat de sous-traitance (DPA) ou des garanties contractuelles équivalentes :</p>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Prestataire</th><th>Finalité</th><th>Localisation / base de transfert</th></tr></thead>
                  <tbody>
                    <tr><td>Supabase, Inc.</td><td>Base de données, authentification, stockage de fichiers</td><td>EU-Central (Francfort, Allemagne) — aucun transfert hors EEE</td></tr>
                    <tr><td>Stripe Payments Europe, Ltd.</td><td>Traitement des paiements</td><td>Irlande (UE) ; transferts ultérieurs aux USA couverts par les CCT conformément au DPA Stripe</td></tr>
                    <tr><td>Resend, Inc.</td><td>Envoi d'e-mails transactionnels et de newsletters</td><td>USA — Cadre de protection des données UE-US + Clauses contractuelles types</td></tr>
                    <tr><td>Vercel, Inc.</td><td>Hébergement et diffusion du site web</td><td>USA — Cadre de protection des données UE-US + Clauses contractuelles types</td></tr>
                    <tr><td>Google LLC (Workspace)</td><td>E-mail opérationnel (info@, support@)</td><td>USA — Cadre de protection des données UE-US + Clauses contractuelles types</td></tr>
                  </tbody>
                </table>
              </div>
              <p><strong>Nous ne vendons, ne partageons ni ne divulguons de données personnelles aux sponsors d'événements, exposants ou autres tiers à des fins de marketing.</strong> Les sponsors ne reçoivent que des statistiques agrégées et anonymisées (p. ex., nombre total de participants).</p>
            </>
          ),
        }}
      </S>

      {/* ——— 5. International transfers ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "5. International data transfers",
            de: "5. Internationale Datenübermittlungen",
            fr: "5. Transferts internationaux de données",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>Where personal data is transferred to countries outside the European Economic Area (EEA), we ensure adequate safeguards are in place, including EU-US Data Privacy Framework certification and/or Standard Contractual Clauses (SCCs) adopted by the European Commission. The specific safeguard for each provider is listed in Section 4 above. You may request a copy of the relevant SCCs by contacting <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
          de: <p>Soweit personenbezogene Daten in Länder außerhalb des Europäischen Wirtschaftsraums (EWR) übermittelt werden, stellen wir sicher, dass angemessene Schutzmaßnahmen vorhanden sind, einschließlich der Zertifizierung nach dem EU-US-Datenschutzrahmen und/oder Standardvertragsklauseln (SCCs), die von der Europäischen Kommission verabschiedet wurden. Die spezifische Schutzmaßnahme für jeden Anbieter ist in Abschnitt 4 oben aufgeführt. Sie können eine Kopie der relevanten SCCs anfordern, indem Sie sich an <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> wenden.</p>,
          fr: <p>Lorsque des données personnelles sont transférées vers des pays situés en dehors de l'Espace économique européen (EEE), nous veillons à ce que des garanties adéquates soient en place, notamment la certification au Cadre de protection des données UE-US et/ou les Clauses contractuelles types (CCT) adoptées par la Commission européenne. La garantie spécifique pour chaque prestataire est indiquée à la section 4 ci-dessus. Vous pouvez demander une copie des CCT pertinentes en contactant <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
        }}
      </S>

      {/* ——— 6. Retention ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "6. Data retention",
            de: "6. Speicherdauer",
            fr: "6. Durée de conservation",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <ul>
              <li><strong>Account data</strong>: retained until you delete your account, plus a 30-day soft-deletion period for recovery.</li>
              <li><strong>Ticket and order records</strong>: retained for the duration of the event plus 10 years to comply with German tax record-keeping obligations (§ 147 AO).</li>
              <li><strong>Newsletter subscription</strong>: retained until you unsubscribe; your email is then placed on a 3-year suppression list (to honor your unsubscribe request), after which it is fully deleted.</li>
              <li><strong>Server logs</strong>: 30 days, then automatically purged.</li>
              <li><strong>Consent records</strong> (double-opt-in proof, cookie consent choices): retained for the duration of the processing they authorize plus 3 years (statute of limitations).</li>
            </ul>
          ),
          de: (
            <ul>
              <li><strong>Kontodaten</strong>: werden bis zur Löschung Ihres Kontos aufbewahrt, zuzüglich einer 30-tägigen Soft-Delete-Frist zur Wiederherstellung.</li>
              <li><strong>Ticket- und Bestellaufzeichnungen</strong>: werden für die Dauer der Veranstaltung plus 10 Jahre aufbewahrt, um den deutschen steuerlichen Aufbewahrungspflichten (§ 147 AO) zu entsprechen.</li>
              <li><strong>Newsletter-Abonnement</strong>: wird bis zur Abmeldung aufbewahrt; Ihre E-Mail-Adresse wird dann für 3 Jahre auf einer Sperrliste geführt (um Ihre Abmeldung zu berücksichtigen), danach vollständig gelöscht.</li>
              <li><strong>Serverprotokolle</strong>: 30 Tage, danach automatische Löschung.</li>
              <li><strong>Einwilligungsnachweise</strong> (Double-Opt-in-Nachweis, Cookie-Einwilligung): werden für die Dauer der autorisierten Verarbeitung plus 3 Jahre (Verjährungsfrist) aufbewahrt.</li>
            </ul>
          ),
          fr: (
            <ul>
              <li><strong>Données de compte</strong> : conservées jusqu'à la suppression de votre compte, plus une période de suppression douce de 30 jours pour la récupération.</li>
              <li><strong>Enregistrements de billets et commandes</strong> : conservés pendant la durée de l'événement plus 10 ans pour respecter les obligations fiscales allemandes de conservation des documents (§ 147 AO).</li>
              <li><strong>Abonnement à la newsletter</strong> : conservé jusqu'au désabonnement ; votre e-mail est ensuite placé sur une liste de suppression de 3 ans (pour honorer votre demande de désabonnement), après quoi il est entièrement supprimé.</li>
              <li><strong>Journaux serveur</strong> : 30 jours, puis suppression automatique.</li>
              <li><strong>Preuves de consentement</strong> (preuve de double opt-in, choix de cookies) : conservées pendant la durée du traitement qu'elles autorisent plus 3 ans (délai de prescription).</li>
            </ul>
          ),
        }}
      </S>

      {/* ——— 7. Your rights ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "7. Your rights",
            de: "7. Ihre Rechte",
            fr: "7. Vos droits",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>Under the GDPR and applicable national laws, you have the following rights with respect to your personal data:</p>
              <ul>
                <li><strong>Right of access</strong> (Art. 15 GDPR): obtain confirmation of whether your data is processed and a copy of that data.</li>
                <li><strong>Right to rectification</strong> (Art. 16 GDPR): correct inaccurate data or complete incomplete data.</li>
                <li><strong>Right to erasure ("right to be forgotten")</strong> (Art. 17 GDPR): request deletion of your data where no legal retention obligation applies.</li>
                <li><strong>Right to restriction of processing</strong> (Art. 18 GDPR): request that processing be limited while a dispute is resolved.</li>
                <li><strong>Right to data portability</strong> (Art. 20 GDPR): receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to object</strong> (Art. 21 GDPR): object to processing based on legitimate interest, including direct marketing.</li>
                <li><strong>Right to withdraw consent</strong> (Art. 7(3) GDPR): withdraw consent at any time without affecting the lawfulness of prior processing.</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> or use the self-service options in your account settings.</p>
              <p><strong>Right to lodge a complaint with a supervisory authority:</strong></p>
              <ul>
                <li>Germany: Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI), or the state authority for North Rhine-Westphalia (LDI NRW).</li>
                <li>France: Commission Nationale de l'Informatique et des Libertés (CNIL).</li>
                <li>United Kingdom: Information Commissioner's Office (ICO).</li>
                <li>South Africa: Information Regulator (POPIA).</li>
                <li>Nigeria: National Information Technology Development Agency (NITDA).</li>
                <li>United States: your state Attorney General.</li>
              </ul>
            </>
          ),
          de: (
            <>
              <p>Nach der DSGVO und den geltenden nationalen Gesetzen haben Sie folgende Rechte in Bezug auf Ihre personenbezogenen Daten:</p>
              <ul>
                <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO): Bestätigung, ob Ihre Daten verarbeitet werden, und Kopie dieser Daten.</li>
                <li><strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten oder Vervollständigung unvollständiger Daten.</li>
                <li><strong>Recht auf Löschung („Recht auf Vergessenwerden")</strong> (Art. 17 DSGVO): Löschung Ihrer Daten, sofern keine gesetzliche Aufbewahrungspflicht besteht.</li>
                <li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung während einer Klärung.</li>
                <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO): Erhalt Ihrer Daten in einem strukturierten, maschinenlesbaren Format.</li>
                <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO): Widerspruch gegen die Verarbeitung auf Grundlage berechtigter Interessen, einschließlich Direktwerbung.</li>
                <li><strong>Recht auf Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO): jederzeitiger Widerruf der Einwilligung, ohne die Rechtmäßigkeit der bisherigen Verarbeitung zu berühren.</li>
              </ul>
              <p>Zur Ausübung dieser Rechte kontaktieren Sie uns unter <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> oder nutzen Sie die Self-Service-Optionen in Ihren Kontoeinstellungen.</p>
              <p><strong>Beschwerderecht bei einer Aufsichtsbehörde:</strong></p>
              <ul>
                <li>Deutschland: Bundesbeauftragte(r) für den Datenschutz und die Informationsfreiheit (BfDI) oder die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW).</li>
                <li>Frankreich: Commission Nationale de l'Informatique et des Libertés (CNIL).</li>
                <li>Vereinigtes Königreich: Information Commissioner's Office (ICO).</li>
                <li>Südafrika: Information Regulator (POPIA).</li>
                <li>Nigeria: National Information Technology Development Agency (NITDA).</li>
                <li>USA: Attorney General Ihres Bundesstaates.</li>
              </ul>
            </>
          ),
          fr: (
            <>
              <p>En vertu du RGPD et des lois nationales applicables, vous disposez des droits suivants concernant vos données personnelles :</p>
              <ul>
                <li><strong>Droit d'accès</strong> (art. 15 RGPD) : obtenir confirmation du traitement de vos données et une copie de celles-ci.</li>
                <li><strong>Droit de rectification</strong> (art. 16 RGPD) : corriger les données inexactes ou compléter les données incomplètes.</li>
                <li><strong>Droit à l'effacement (« droit à l'oubli »)</strong> (art. 17 RGPD) : demander la suppression de vos données en l'absence d'obligation légale de conservation.</li>
                <li><strong>Droit à la limitation du traitement</strong> (art. 18 RGPD) : demander la limitation du traitement pendant le règlement d'un litige.</li>
                <li><strong>Droit à la portabilité des données</strong> (art. 20 RGPD) : recevoir vos données dans un format structuré et lisible par machine.</li>
                <li><strong>Droit d'opposition</strong> (art. 21 RGPD) : s'opposer au traitement fondé sur l'intérêt légitime, y compris le marketing direct.</li>
                <li><strong>Droit de retirer le consentement</strong> (art. 7(3) RGPD) : retirer le consentement à tout moment sans affecter la licéité du traitement antérieur.</li>
              </ul>
              <p>Pour exercer ces droits, contactez-nous à <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> ou utilisez les options en libre-service dans les paramètres de votre compte.</p>
              <p><strong>Droit d'introduire une réclamation auprès d'une autorité de contrôle :</strong></p>
              <ul>
                <li>Allemagne : Bundesbeauftragte(r) für den Datenschutz und die Informationsfreiheit (BfDI) ou l'autorité du Land de Rhénanie-du-Nord-Westphalie (LDI NRW).</li>
                <li>France : Commission Nationale de l'Informatique et des Libertés (CNIL).</li>
                <li>Royaume-Uni : Information Commissioner's Office (ICO).</li>
                <li>Afrique du Sud : Information Regulator (POPIA).</li>
                <li>Nigeria : National Information Technology Development Agency (NITDA).</li>
                <li>États-Unis : Attorney General de votre État.</li>
              </ul>
            </>
          ),
        }}
      </S>

      {/* ——— 8. Children ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "8. Children's privacy",
            de: "8. Datenschutz für Kinder",
            fr: "8. Protection des données des enfants",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>Our services are not directed at children under 16 years of age. Persons under 16 may not create an account. Children under 16 may attend events only when accompanied by a guardian who holds a valid adult ticket. The guardian manages any ticket purchases on their own account. We do not knowingly collect personal data from children under 16. If you believe we have inadvertently collected such data, contact us at <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> and we will promptly delete it.</p>,
          de: <p>Unsere Dienste richten sich nicht an Kinder unter 16 Jahren. Personen unter 16 Jahren dürfen kein Konto erstellen. Kinder unter 16 Jahren dürfen Veranstaltungen nur in Begleitung einer erziehungsberechtigten Person besuchen, die ein gültiges Erwachsenenticket besitzt. Die erziehungsberechtigte Person verwaltet alle Ticketkäufe auf ihrem eigenen Konto. Wir erheben wissentlich keine personenbezogenen Daten von Kindern unter 16 Jahren. Falls Sie glauben, dass wir versehentlich solche Daten erhoben haben, kontaktieren Sie uns unter <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>, und wir werden diese umgehend löschen.</p>,
          fr: <p>Nos services ne sont pas destinés aux enfants de moins de 16 ans. Les personnes de moins de 16 ans ne peuvent pas créer de compte. Les enfants de moins de 16 ans ne peuvent assister aux événements que s'ils sont accompagnés d'un tuteur détenant un billet adulte valide. Le tuteur gère les achats de billets sur son propre compte. Nous ne collectons pas sciemment de données personnelles auprès d'enfants de moins de 16 ans. Si vous pensez que nous avons collecté ces données par inadvertance, contactez-nous à <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> et nous les supprimerons rapidement.</p>,
        }}
      </S>

      {/* ——— 9. Automated decision-making ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "9. Automated decision-making",
            de: "9. Automatisierte Entscheidungsfindung",
            fr: "9. Prise de décision automatisée",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>We do not use automated decision-making, including profiling, that produces legal effects or similarly significantly affects you (Art. 22 GDPR).</p>,
          de: <p>Wir verwenden keine automatisierte Entscheidungsfindung, einschließlich Profiling, die rechtliche Wirkungen erzeugt oder Sie in ähnlicher Weise erheblich beeinträchtigt (Art. 22 DSGVO).</p>,
          fr: <p>Nous n'utilisons pas de prise de décision automatisée, y compris le profilage, qui produit des effets juridiques ou vous affecte de manière similairement significative (art. 22 RGPD).</p>,
        }}
      </S>

      {/* ——— 10. California (CCPA/CPRA) ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "10. California privacy rights (CCPA/CPRA)",
            de: "10. Datenschutzrechte für Kalifornien (CCPA/CPRA)",
            fr: "10. Droits de confidentialité pour la Californie (CCPA/CPRA)",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>If you are a California resident, the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA) provides you with additional rights:</p>
              <ul>
                <li><strong>Right to know</strong>: what personal information we collect, use, disclose, and sell (we do not sell).</li>
                <li><strong>Right to delete</strong>: request deletion of your personal information.</li>
                <li><strong>Right to correct</strong>: request correction of inaccurate personal information.</li>
                <li><strong>Right to limit use of sensitive personal information</strong>: we do not use sensitive PI for purposes beyond what is necessary to provide our services.</li>
                <li><strong>Right to non-discrimination</strong>: we will not discriminate against you for exercising your rights.</li>
              </ul>
              <p><strong>We do not sell or share personal information for cross-context behavioral advertising.</strong> No opt-out of sale or sharing is required because we do not engage in these practices.</p>
              <p>To submit a verifiable consumer request, contact <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> or use the <a href={contactFormUrl}>contact form</a>. You may designate an authorized agent to make a request on your behalf.</p>
              <p>We do not offer financial incentives related to the collection, sale, or deletion of personal information.</p>
            </>
          ),
          de: (
            <p>Wenn Sie in Kalifornien ansässig sind, gewährt Ihnen der California Consumer Privacy Act (CCPA), geändert durch den California Privacy Rights Act (CPRA), zusätzliche Rechte: Auskunft, Löschung, Berichtigung, Einschränkung der Nutzung sensibler Daten und Nichtdiskriminierung. Wir verkaufen oder teilen keine personenbezogenen Daten für kontextübergreifende verhaltensbasierte Werbung. Zur Ausübung Ihrer Rechte wenden Sie sich an <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>
          ),
          fr: (
            <p>Si vous résidez en Californie, le California Consumer Privacy Act (CCPA), tel que modifié par le California Privacy Rights Act (CPRA), vous confère des droits supplémentaires : droit à l'information, suppression, rectification, limitation de l'utilisation des données sensibles et non-discrimination. Nous ne vendons ni ne partageons de données personnelles pour la publicité comportementale inter-contextes. Pour exercer vos droits, contactez <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>
          ),
        }}
      </S>

      {/* ——— 11. UK addendum ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "11. United Kingdom addendum",
            de: "11. Vereinigtes Königreich — Ergänzung",
            fr: "11. Addendum Royaume-Uni",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>If you are a UK resident, the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018 apply in addition to or in place of the EU GDPR as appropriate. Your rights under Section 7 above are equally available under UK law. The supervisory authority is the Information Commissioner's Office (ICO): <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>. As we maintain an establishment in the EU, no separate UK representative under Art. 27 UK GDPR is required.</p>,
          de: <p>Für Einwohner des Vereinigten Königreichs gelten zusätzlich oder anstelle der EU-DSGVO die UK General Data Protection Regulation (UK GDPR) und der Data Protection Act 2018. Ihre Rechte aus Abschnitt 7 gelten gleichermaßen nach britischem Recht. Die Aufsichtsbehörde ist das Information Commissioner's Office (ICO): <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>,
          fr: <p>Si vous résidez au Royaume-Uni, le UK General Data Protection Regulation (UK GDPR) et le Data Protection Act 2018 s'appliquent en complément ou en remplacement du RGPD européen. Vos droits décrits à la section 7 s'appliquent également en droit britannique. L'autorité de contrôle est l'Information Commissioner's Office (ICO) : <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>,
        }}
      </S>

      {/* ——— 12. POPIA (South Africa) ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "12. South Africa — POPIA addendum",
            de: "12. Südafrika — POPIA-Ergänzung",
            fr: "12. Afrique du Sud — Addendum POPIA",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>If you are a data subject in South Africa, the Protection of Personal Information Act (POPIA) applies. Our Information Officer is:</p>
              {c?.popia_info_officer_name ? (
                <p>{c.popia_info_officer_name}{c.popia_info_officer_email ? ` — ${c.popia_info_officer_email}` : ""}</p>
              ) : (
                <p>{c?.managing_directors ?? "—"} — <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a></p>
              )}
              <p>You may lodge a complaint with the Information Regulator of South Africa: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>.</p>
            </>
          ),
          de: (
            <p>Für Betroffene in Südafrika gilt der Protection of Personal Information Act (POPIA). Unser Information Officer ist {c?.popia_info_officer_name ?? (c?.managing_directors ?? "—")} ({c?.popia_info_officer_email ?? privacyEmail}). Beschwerden können beim Information Regulator von Südafrika eingereicht werden: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>.</p>
          ),
          fr: (
            <p>Pour les personnes concernées en Afrique du Sud, le Protection of Personal Information Act (POPIA) s'applique. Notre Information Officer est {c?.popia_info_officer_name ?? (c?.managing_directors ?? "—")} ({c?.popia_info_officer_email ?? privacyEmail}). Les réclamations peuvent être déposées auprès de l'Information Regulator d'Afrique du Sud : <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>.</p>
          ),
        }}
      </S>

      {/* ——— 13. NDPR (Nigeria) ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "13. Nigeria — NDPR addendum",
            de: "13. Nigeria — NDPR-Ergänzung",
            fr: "13. Nigeria — Addendum NDPR",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>If you are a data subject in Nigeria, the Nigeria Data Protection Regulation (NDPR) and Nigeria Data Protection Act (NDPA) apply. Our Data Protection Compliance Officer is:</p>
              {c?.ndpr_dpco_name ? (
                <p>{c.ndpr_dpco_name}{c.ndpr_dpco_email ? ` — ${c.ndpr_dpco_email}` : ""}</p>
              ) : (
                <p>{c?.managing_directors ?? "—"} — <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a></p>
              )}
              <p>All lawful bases for processing and cross-border transfer disclosures described in this policy apply equally under the NDPR/NDPA framework.</p>
            </>
          ),
          de: <p>Für Betroffene in Nigeria gelten die Nigeria Data Protection Regulation (NDPR) und der Nigeria Data Protection Act (NDPA). Unser Data Protection Compliance Officer ist {c?.ndpr_dpco_name ?? (c?.managing_directors ?? "—")} ({c?.ndpr_dpco_email ?? privacyEmail}). Alle in dieser Richtlinie beschriebenen Rechtsgrundlagen und grenzüberschreitenden Übermittlungsangaben gelten gleichermaßen im NDPR/NDPA-Rahmen.</p>,
          fr: <p>Pour les personnes concernées au Nigeria, la Nigeria Data Protection Regulation (NDPR) et le Nigeria Data Protection Act (NDPA) s'appliquent. Notre Data Protection Compliance Officer est {c?.ndpr_dpco_name ?? (c?.managing_directors ?? "—")} ({c?.ndpr_dpco_email ?? privacyEmail}). Toutes les bases juridiques et divulgations de transfert transfrontalier décrites dans cette politique s'appliquent également dans le cadre NDPR/NDPA.</p>,
        }}
      </S>

      {/* ——— 14. DR Congo ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "14. Democratic Republic of the Congo",
            de: "14. Demokratische Republik Kongo",
            fr: "14. République Démocratique du Congo",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>Data subjects in the Democratic Republic of the Congo benefit from the protections of Loi n° 020/2020 (telecommunications law) and emerging data protection legislation. We apply EU-grade data protection standards globally. If you believe your rights have been infringed, please contact us at <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
          de: <p>Betroffene in der Demokratischen Republik Kongo profitieren vom Schutz des Loi n° 020/2020 (Telekommunikationsgesetz) und der entstehenden Datenschutzgesetzgebung. Wir wenden weltweit EU-konforme Datenschutzstandards an. Wenn Sie der Meinung sind, dass Ihre Rechte verletzt wurden, kontaktieren Sie uns unter <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
          fr: <p>Les personnes concernées en République Démocratique du Congo bénéficient des protections de la Loi n° 020/2020 (loi sur les télécommunications) et de la législation émergente en matière de protection des données. Nous appliquons des normes de protection des données de niveau européen à l'échelle mondiale. Si vous estimez que vos droits ont été violés, veuillez nous contacter à <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.</p>,
        }}
      </S>

      {/* ——— 15. Changes ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "15. Changes to this privacy policy",
            de: "15. Änderungen dieser Datenschutzerklärung",
            fr: "15. Modifications de cette politique de confidentialité",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: <p>We may update this Privacy Policy to reflect changes in our practices or legal requirements. Material changes will be communicated via an in-app banner and, where possible, by email. The date of the last update is shown below.</p>,
          de: <p>Wir können diese Datenschutzerklärung aktualisieren, um Änderungen unserer Praktiken oder rechtlicher Anforderungen widerzuspiegeln. Wesentliche Änderungen werden über ein Banner in der App und, soweit möglich, per E-Mail mitgeteilt. Das Datum der letzten Aktualisierung ist unten angegeben.</p>,
          fr: <p>Nous pouvons mettre à jour cette politique de confidentialité pour refléter les changements dans nos pratiques ou les exigences légales. Les modifications importantes seront communiquées via une bannière dans l'application et, si possible, par e-mail. La date de la dernière mise à jour est indiquée ci-dessous.</p>,
        }}
      </S>

      {/* ——— 16. Contact ——— */}
      <h2>
        <S locale={locale}>
          {{
            en: "16. Contact",
            de: "16. Kontakt",
            fr: "16. Contact",
          }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <p>
              For any data protection inquiries, contact us at:{" "}
              <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
              {c && (
                <>
                  <br />
                  {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
                  <br />
                  {formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
          de: (
            <p>
              Für Datenschutzanfragen kontaktieren Sie uns unter:{" "}
              <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
              {c && (
                <>
                  <br />
                  {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
                  <br />
                  {formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
          fr: (
            <p>
              Pour toute question relative à la protection des données, contactez-nous à :{" "}
              <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
              {c && (
                <>
                  <br />
                  {c.legal_name}{c.legal_form ? ` (${c.legal_form})` : ""}
                  <br />
                  {formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
        }}
      </S>

      <hr />
      <p className="text-xs text-muted-foreground">
        <T k={{ en: "Last updated", de: "Letzte Aktualisierung", fr: "Dernière mise à jour" }} locale={locale} />: {t(LEGAL_LAST_UPDATED, locale)}
      </p>
    </article>
  );
}
