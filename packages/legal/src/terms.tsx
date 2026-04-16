// ⚖ DRAFT — reviewed 2026-04-19 by Claude, NOT yet reviewed by a German-
// admitted Rechtsanwalt. Do not consider this final for commercial launch
// until counsel signs off. Version: packages/legal/src/version.ts.

import type { LegalContext, LegalLocale } from "./types";
import { t } from "./types";
import { formatRegisteredAddress } from "./company";
import { LEGAL_LAST_UPDATED } from "./version";

type L<T> = Record<LegalLocale, T>;

function S({
  children,
  locale,
}: {
  children: Record<LegalLocale, React.ReactNode>;
  locale: LegalLocale;
}) {
  return <>{children[locale] ?? children.en}</>;
}

export function TermsOfService({ company, locale, marketingSiteUrl }: LegalContext) {
  const c = company;
  const legalEmail = c?.legal_email ?? c?.primary_email ?? "";
  const privacyEmail = c?.privacy_email ?? c?.primary_email ?? "";
  const privacyUrl = `${marketingSiteUrl}/${locale}/privacy`;
  const entityName = c
    ? `${c.legal_name}${c.legal_form ? ` (${c.legal_form})` : ""}`
    : "";

  const heading: L<string> = {
    en: "Terms of Service",
    de: "Allgemeine Geschäftsbedingungen",
    fr: "Conditions générales d'utilisation",
  };

  return (
    <article>
      <h1>{t(heading, locale)}</h1>

      {/* ——— 1. Acceptance & parties ——— */}
      <h2>
        <S locale={locale}>
          {{ en: "1. Acceptance and parties", de: "1. Geltungsbereich und Vertragsparteien", fr: "1. Acceptation et parties" }}
        </S>
      </h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>By creating an account, purchasing a ticket, subscribing to a newsletter, or otherwise using our services, you agree to these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use our services.</p>
              <p>The contracting party is:</p>
              {c && (
                <address className="not-italic whitespace-pre-line">
                  {entityName}
                  {"\n"}{formatRegisteredAddress(c)}
                  {"\n"}{c.primary_email}
                </address>
              )}
              <p>(&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;DBC Germany&quot;) and you, the user (&quot;you&quot;, &quot;your&quot;).</p>
            </>
          ),
          de: (
            <>
              <p>Durch die Erstellung eines Kontos, den Kauf eines Tickets, das Abonnieren eines Newsletters oder die sonstige Nutzung unserer Dienste stimmen Sie diesen Allgemeinen Geschäftsbedingungen (&quot;AGB&quot;) zu. Wenn Sie nicht einverstanden sind, nutzen Sie unsere Dienste nicht.</p>
              <p>Die Vertragspartei ist:</p>
              {c && (
                <address className="not-italic whitespace-pre-line">
                  {entityName}
                  {"\n"}{formatRegisteredAddress(c)}
                  {"\n"}{c.primary_email}
                </address>
              )}
              <p>(nachfolgend &quot;wir&quot;, &quot;uns&quot; oder &quot;DBC Germany&quot;) und Sie, der Nutzer (&quot;Sie&quot;, &quot;Ihr&quot;).</p>
            </>
          ),
          fr: (
            <>
              <p>En créant un compte, en achetant un billet, en vous abonnant à une newsletter ou en utilisant autrement nos services, vous acceptez les présentes Conditions générales d'utilisation (&quot;Conditions&quot;). Si vous n'acceptez pas, n'utilisez pas nos services.</p>
              <p>La partie contractante est :</p>
              {c && (
                <address className="not-italic whitespace-pre-line">
                  {entityName}
                  {"\n"}{formatRegisteredAddress(c)}
                  {"\n"}{c.primary_email}
                </address>
              )}
              <p>(ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;DBC Germany&quot;) et vous, l'utilisateur (&quot;vous&quot;, &quot;votre&quot;).</p>
            </>
          ),
        }}
      </S>

      {/* ——— 2. Services ——— */}
      <h2><S locale={locale}>{{ en: "2. Scope of services", de: "2. Leistungsumfang", fr: "2. Étendue des services" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>We operate a platform for discovering events, purchasing event tickets, managing event registrations, receiving newsletters, and related services. Our services are provided via our websites (dbc-germany.com, tickets.dbc-germany.com, admin.dbc-germany.com) and associated communications.</p>,
          de: <p>Wir betreiben eine Plattform zur Entdeckung von Veranstaltungen, zum Kauf von Veranstaltungstickets, zur Verwaltung von Anmeldungen, zum Empfang von Newslettern und verwandten Diensten. Unsere Dienste werden über unsere Websites (dbc-germany.com, tickets.dbc-germany.com, admin.dbc-germany.com) und die zugehörige Kommunikation bereitgestellt.</p>,
          fr: <p>Nous exploitons une plateforme pour découvrir des événements, acheter des billets, gérer les inscriptions, recevoir des newsletters et des services connexes. Nos services sont fournis via nos sites web (dbc-germany.com, tickets.dbc-germany.com, admin.dbc-germany.com) et les communications associées.</p>,
        }}
      </S>

      {/* ——— 3. Account ——— */}
      <h2><S locale={locale}>{{ en: "3. Account", de: "3. Benutzerkonto", fr: "3. Compte" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <ul>
              <li><strong>Eligibility</strong>: You must be at least 16 years old to create an account. Persons under 16 may attend events only with an adult guardian who holds a valid ticket.</li>
              <li><strong>Accuracy</strong>: You must provide accurate and current information and keep it up to date.</li>
              <li><strong>Security</strong>: You are responsible for safeguarding your account credentials. Notify us immediately at <a href={`mailto:${legalEmail}`}>{legalEmail}</a> if you suspect unauthorized access.</li>
              <li><strong>Suspension</strong>: We may suspend or terminate your account if you violate these Terms or if we reasonably suspect fraud.</li>
            </ul>
          ),
          de: (
            <ul>
              <li><strong>Berechtigung</strong>: Sie müssen mindestens 16 Jahre alt sein, um ein Konto zu erstellen. Personen unter 16 Jahren dürfen Veranstaltungen nur mit einer erziehungsberechtigten Person besuchen, die ein gültiges Ticket besitzt.</li>
              <li><strong>Richtigkeit</strong>: Sie müssen korrekte und aktuelle Angaben machen und diese aktuell halten.</li>
              <li><strong>Sicherheit</strong>: Sie sind für den Schutz Ihrer Zugangsdaten verantwortlich. Benachrichtigen Sie uns unverzüglich unter <a href={`mailto:${legalEmail}`}>{legalEmail}</a>, wenn Sie einen unbefugten Zugriff vermuten.</li>
              <li><strong>Sperrung</strong>: Wir können Ihr Konto sperren oder kündigen, wenn Sie gegen diese AGB verstoßen oder wir berechtigterweise Betrug vermuten.</li>
            </ul>
          ),
          fr: (
            <ul>
              <li><strong>Éligibilité</strong> : Vous devez avoir au moins 16 ans pour créer un compte. Les personnes de moins de 16 ans ne peuvent assister aux événements qu'avec un tuteur adulte détenant un billet valide.</li>
              <li><strong>Exactitude</strong> : Vous devez fournir des informations exactes et à jour et les maintenir actualisées.</li>
              <li><strong>Sécurité</strong> : Vous êtes responsable de la protection de vos identifiants de connexion. Prévenez-nous immédiatement à <a href={`mailto:${legalEmail}`}>{legalEmail}</a> si vous soupçonnez un accès non autorisé.</li>
              <li><strong>Suspension</strong> : Nous pouvons suspendre ou résilier votre compte si vous enfreignez ces Conditions ou si nous suspectons raisonnablement une fraude.</li>
            </ul>
          ),
        }}
      </S>

      {/* ——— 4. Tickets & payment ——— */}
      <h2><S locale={locale}>{{ en: "4. Tickets and payment", de: "4. Tickets und Zahlung", fr: "4. Billets et paiement" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>Ticket prices are displayed in Euros (EUR) and include applicable VAT. Payments are processed by Stripe Payments Europe, Ltd. By purchasing a ticket, you agree to Stripe's applicable terms. We do not store your full payment card details.</p>,
          de: <p>Ticketpreise werden in Euro (EUR) angezeigt und verstehen sich inklusive der geltenden MwSt. Zahlungen werden von Stripe Payments Europe, Ltd. abgewickelt. Durch den Kauf eines Tickets stimmen Sie den geltenden Bedingungen von Stripe zu. Wir speichern keine vollständigen Zahlungskartendaten.</p>,
          fr: <p>Les prix des billets sont affichés en euros (EUR), TVA applicable incluse. Les paiements sont traités par Stripe Payments Europe, Ltd. En achetant un billet, vous acceptez les conditions applicables de Stripe. Nous ne stockons pas les détails complets de votre carte de paiement.</p>,
        }}
      </S>

      {/* ——— 5. Entry ——— */}
      <h2><S locale={locale}>{{ en: "5. Entry and admission", de: "5. Einlass und Zutritt", fr: "5. Entrée et admission" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>A valid ticket grants a revocable, non-exclusive, personal license to attend the specified event at the specified venue. Entry requires presentation of a valid ticket (QR code). We reserve the right to request photo identification matching the ticket holder's name. We may refuse entry or eject any attendee who violates these Terms, applicable venue rules, or behaves in a manner that threatens the safety or enjoyment of others — without refund.</p>,
          de: <p>Ein gültiges Ticket gewährt eine widerrufliche, nicht-exklusive, persönliche Lizenz zur Teilnahme an der angegebenen Veranstaltung am angegebenen Veranstaltungsort. Zum Einlass ist ein gültiges Ticket (QR-Code) vorzuzeigen. Wir behalten uns vor, einen Lichtbildausweis zu verlangen, der dem Ticketinhaber entspricht. Wir können Personen den Zutritt verweigern oder des Veranstaltungsortes verweisen, die gegen diese AGB, die geltenden Hausordnungen des Veranstaltungsortes verstoßen oder sich in einer Weise verhalten, die die Sicherheit oder das Vergnügen anderer gefährdet — ohne Erstattung.</p>,
          fr: <p>Un billet valide accorde une licence révocable, non exclusive et personnelle pour assister à l'événement spécifié au lieu indiqué. L'entrée nécessite la présentation d'un billet valide (code QR). Nous nous réservons le droit de demander une pièce d'identité avec photo correspondant au nom du titulaire du billet. Nous pouvons refuser l'entrée ou expulser tout participant qui enfreint ces Conditions, les règles du lieu applicables ou se comporte d'une manière menaçant la sécurité ou le plaisir des autres — sans remboursement.</p>,
        }}
      </S>

      {/* ——— 6. Transfers ——— */}
      <h2><S locale={locale}>{{ en: "6. Ticket transfers", de: "6. Ticket-Übertragungen", fr: "6. Transferts de billets" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <ul>
              <li>You may transfer a ticket to another person using the transfer function in your account, free of charge.</li>
              <li>Transfers must be initiated at least 48 hours before the event start time.</li>
              <li>Each ticket may be transferred once. The new holder is bound by these Terms.</li>
              <li>We are not responsible for transfers arranged outside our platform.</li>
            </ul>
          ),
          de: (
            <ul>
              <li>Sie können ein Ticket über die Übertragungsfunktion in Ihrem Konto kostenlos auf eine andere Person übertragen.</li>
              <li>Übertragungen müssen mindestens 48 Stunden vor Veranstaltungsbeginn eingeleitet werden.</li>
              <li>Jedes Ticket darf einmal übertragen werden. Der neue Inhaber ist an diese AGB gebunden.</li>
              <li>Für außerhalb unserer Plattform vereinbarte Übertragungen übernehmen wir keine Verantwortung.</li>
            </ul>
          ),
          fr: (
            <ul>
              <li>Vous pouvez transférer un billet à une autre personne en utilisant la fonction de transfert de votre compte, gratuitement.</li>
              <li>Les transferts doivent être initiés au moins 48 heures avant le début de l'événement.</li>
              <li>Chaque billet ne peut être transféré qu'une seule fois. Le nouveau titulaire est lié par ces Conditions.</li>
              <li>Nous ne sommes pas responsables des transferts organisés en dehors de notre plateforme.</li>
            </ul>
          ),
        }}
      </S>

      {/* ——— 7. Refunds ——— */}
      <h2><S locale={locale}>{{ en: "7. Refund policy", de: "7. Erstattungsrichtlinie", fr: "7. Politique de remboursement" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p><strong>Pursuant to § 312g(2) No. 9 of the German Civil Code (BGB) and Article 16(l) of the EU Consumer Rights Directive</strong>, the right of withdrawal does not apply to contracts for the provision of services related to leisure activities if the contract provides for a specific date or period of performance. As event tickets are for a specific date, <strong>the 14-day withdrawal right does not apply</strong>.</p>
              <p>Tickets are non-refundable except where required by mandatory law:</p>
              <ul>
                <li><strong>Event cancellation by us</strong>: full refund of the ticket price (excluding service fees) within 30 days.</li>
                <li><strong>Event postponement of 60 days or more</strong>: refund offered if you cannot attend the rescheduled date.</li>
                <li><strong>Material program change</strong>: if the headlining act or primary content is substantially altered, you may request a refund within 14 days of the announcement.</li>
              </ul>
              <p>Name transfers (Section 6) are the recommended alternative to cancellation.</p>
            </>
          ),
          de: (
            <>
              <p><strong>Gemäß § 312g Abs. 2 Nr. 9 BGB und Art. 16 Buchst. l der EU-Verbraucherrechterichtlinie</strong> gilt das Widerrufsrecht nicht für Verträge über Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, wenn im Vertrag ein bestimmter Zeitpunkt oder Zeitraum der Erbringung vorgesehen ist. Da Veranstaltungstickets für einen bestimmten Termin gelten, <strong>besteht kein 14-tägiges Widerrufsrecht</strong>.</p>
              <p>Tickets sind nicht erstattungsfähig, es sei denn, zwingendes Recht schreibt eine Erstattung vor:</p>
              <ul>
                <li><strong>Absage der Veranstaltung durch uns</strong>: vollständige Erstattung des Ticketpreises (abzüglich Servicegebühren) innerhalb von 30 Tagen.</li>
                <li><strong>Verschiebung um 60 Tage oder mehr</strong>: Erstattung, wenn Sie den neuen Termin nicht wahrnehmen können.</li>
                <li><strong>Wesentliche Programmänderung</strong>: Bei erheblicher Änderung des Hauptprogramms können Sie innerhalb von 14 Tagen nach Bekanntgabe eine Erstattung beantragen.</li>
              </ul>
              <p>Namensübertragungen (Abschnitt 6) sind die empfohlene Alternative zur Stornierung.</p>
            </>
          ),
          fr: (
            <>
              <p><strong>Conformément au § 312g(2) n° 9 du Code civil allemand (BGB) et à l'article 16(l) de la Directive européenne relative aux droits des consommateurs</strong>, le droit de rétractation ne s'applique pas aux contrats de fourniture de services liés à des activités de loisirs lorsque le contrat prévoit une date ou une période d'exécution spécifique. Comme les billets d'événement sont pour une date précise, <strong>le droit de rétractation de 14 jours ne s'applique pas</strong>.</p>
              <p>Les billets ne sont pas remboursables, sauf si la loi impérative l'exige :</p>
              <ul>
                <li><strong>Annulation de l'événement par nous</strong> : remboursement intégral du prix du billet (hors frais de service) dans les 30 jours.</li>
                <li><strong>Report de 60 jours ou plus</strong> : remboursement proposé si vous ne pouvez pas assister à la nouvelle date.</li>
                <li><strong>Changement substantiel du programme</strong> : en cas de modification significative du contenu principal, vous pouvez demander un remboursement dans les 14 jours suivant l'annonce.</li>
              </ul>
              <p>Les transferts de nom (Section 6) sont l'alternative recommandée à l'annulation.</p>
            </>
          ),
        }}
      </S>

      {/* ——— 8. Cancellation by DBC ——— */}
      <h2><S locale={locale}>{{ en: "8. Event cancellation by us", de: "8. Absage durch den Veranstalter", fr: "8. Annulation par l'organisateur" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>If we cancel an event, we will notify ticket holders by email and refund the ticket price (excluding service fees) within 30 days of cancellation. Service fees are non-refundable.</p>,
          de: <p>Wenn wir eine Veranstaltung absagen, benachrichtigen wir die Ticketinhaber per E-Mail und erstatten den Ticketpreis (abzüglich Servicegebühren) innerhalb von 30 Tagen nach Absage. Servicegebühren werden nicht erstattet.</p>,
          fr: <p>Si nous annulons un événement, nous informerons les détenteurs de billets par e-mail et rembourserons le prix du billet (hors frais de service) dans les 30 jours suivant l'annulation. Les frais de service ne sont pas remboursables.</p>,
        }}
      </S>

      {/* ——— 9. Conduct ——— */}
      <h2><S locale={locale}>{{ en: "9. Code of conduct", de: "9. Verhaltensregeln", fr: "9. Code de conduite" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>All attendees must comply with the venue house rules posted at the event location and applicable law. In addition:</p>
              <ul>
                <li>Harassment, discrimination, threats, or violence of any kind are prohibited and will result in immediate removal without refund.</li>
                <li>Unauthorized recording, broadcasting, or streaming of event content is prohibited.</li>
                <li>We reserve the right to refuse entry or eject any person whose conduct threatens the safety, security, or enjoyment of other attendees.</li>
              </ul>
            </>
          ),
          de: (
            <>
              <p>Alle Teilnehmer müssen die am Veranstaltungsort ausgehängte Hausordnung und geltendes Recht einhalten. Darüber hinaus:</p>
              <ul>
                <li>Belästigung, Diskriminierung, Drohungen oder Gewalt jeder Art sind verboten und führen zum sofortigen Verweis ohne Erstattung.</li>
                <li>Unbefugtes Aufnehmen, Übertragen oder Streamen von Veranstaltungsinhalten ist untersagt.</li>
                <li>Wir behalten uns vor, Personen den Zutritt zu verweigern oder des Veranstaltungsortes zu verweisen, deren Verhalten die Sicherheit oder das Vergnügen anderer gefährdet.</li>
              </ul>
            </>
          ),
          fr: (
            <>
              <p>Tous les participants doivent respecter le règlement intérieur affiché sur le lieu de l'événement et la loi applicable. En outre :</p>
              <ul>
                <li>Le harcèlement, la discrimination, les menaces ou la violence de toute nature sont interdits et entraîneront une expulsion immédiate sans remboursement.</li>
                <li>L'enregistrement, la diffusion ou le streaming non autorisés du contenu de l'événement sont interdits.</li>
                <li>Nous nous réservons le droit de refuser l'entrée ou d'expulser toute personne dont le comportement menace la sécurité ou le plaisir des autres participants.</li>
              </ul>
            </>
          ),
        }}
      </S>

      {/* ——— 10. Photo/video ——— */}
      <h2><S locale={locale}>{{ en: "10. Photography and video", de: "10. Foto- und Videoaufnahmen", fr: "10. Photographie et vidéo" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>Events may be photographed and filmed by us or our authorized representatives for marketing, press, and archival purposes. By attending the event, you acknowledge that you may appear in such recordings. If you do not wish to be identifiable in published materials, an opt-out wristband is available at the registration desk. Speakers and panelists consent to audio-visual recording of their sessions as part of their speaker agreement.</p>,
          de: <p>Veranstaltungen können von uns oder unseren autorisierten Vertretern zu Marketing-, Presse- und Archivierungszwecken fotografiert und gefilmt werden. Durch Ihre Teilnahme nehmen Sie zur Kenntnis, dass Sie in solchen Aufnahmen erscheinen können. Wenn Sie nicht in veröffentlichten Materialien identifizierbar sein möchten, erhalten Sie am Registrierungsschalter ein Opt-out-Armband. Sprecher und Diskussionsteilnehmer stimmen der audiovisuellen Aufzeichnung ihrer Sitzungen als Teil ihrer Sprechervereinbarung zu.</p>,
          fr: <p>Les événements peuvent être photographiés et filmés par nous ou nos représentants autorisés à des fins de marketing, de presse et d'archivage. En participant à l'événement, vous reconnaissez que vous pouvez apparaître dans ces enregistrements. Si vous ne souhaitez pas être identifiable dans les supports publiés, un bracelet d'exclusion est disponible au comptoir d'inscription. Les intervenants et panélistes consentent à l'enregistrement audiovisuel de leurs sessions dans le cadre de leur accord d'intervenant.</p>,
        }}
      </S>

      {/* ——— 11. Minors ——— */}
      <h2><S locale={locale}>{{ en: "11. Minors", de: "11. Minderjährige", fr: "11. Mineurs" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>Persons under 16 years of age may attend events only when accompanied by an adult guardian who holds a valid adult ticket. The guardian assumes full responsibility for the minor's conduct, safety, and compliance with these Terms. Ticket purchases for minors must be made through the guardian's account.</p>,
          de: <p>Personen unter 16 Jahren dürfen Veranstaltungen nur in Begleitung einer erziehungsberechtigten Person besuchen, die ein gültiges Erwachsenenticket besitzt. Die erziehungsberechtigte Person übernimmt die volle Verantwortung für das Verhalten, die Sicherheit und die Einhaltung dieser AGB durch den Minderjährigen. Ticketkäufe für Minderjährige müssen über das Konto der erziehungsberechtigten Person erfolgen.</p>,
          fr: <p>Les personnes de moins de 16 ans ne peuvent assister aux événements que si elles sont accompagnées d'un tuteur adulte détenant un billet adulte valide. Le tuteur assume l'entière responsabilité du comportement, de la sécurité et du respect de ces Conditions par le mineur. Les achats de billets pour mineurs doivent être effectués via le compte du tuteur.</p>,
        }}
      </S>

      {/* ——— 12. IP ——— */}
      <h2><S locale={locale}>{{ en: "12. Intellectual property", de: "12. Geistiges Eigentum", fr: "12. Propriété intellectuelle" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>All content published by us (text, images, logos, designs, event programs) is protected by copyright and trademark law. You may view and download content for personal, non-commercial use only. Any content you post on our platforms (reviews, photos, social media tagged posts) grants us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with our services and marketing.</p>,
          de: <p>Alle von uns veröffentlichten Inhalte (Texte, Bilder, Logos, Designs, Veranstaltungsprogramme) sind durch Urheber- und Markenrecht geschützt. Sie dürfen Inhalte nur für den persönlichen, nicht kommerziellen Gebrauch ansehen und herunterladen. Alle von Ihnen auf unseren Plattformen veröffentlichten Inhalte (Bewertungen, Fotos, getaggte Social-Media-Beiträge) gewähren uns eine nicht-exklusive, weltweite, lizenzgebührenfreie Lizenz zur Nutzung, Vervielfältigung und Anzeige dieser Inhalte im Zusammenhang mit unseren Diensten und unserem Marketing.</p>,
          fr: <p>Tout contenu publié par nous (textes, images, logos, designs, programmes d'événements) est protégé par le droit d'auteur et le droit des marques. Vous ne pouvez consulter et télécharger le contenu qu'à des fins personnelles et non commerciales. Tout contenu que vous publiez sur nos plateformes (avis, photos, publications sur les réseaux sociaux) nous accorde une licence non exclusive, mondiale et libre de redevances pour utiliser, reproduire et afficher ce contenu en relation avec nos services et notre marketing.</p>,
        }}
      </S>

      {/* ——— 13. Force majeure ——— */}
      <h2><S locale={locale}>{{ en: "13. Force majeure", de: "13. Höhere Gewalt", fr: "13. Force majeure" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>We are not liable for delays, cancellations, or failure to perform due to circumstances beyond our reasonable control, including but not limited to: pandemics, epidemics, war, armed conflict, terrorism, natural disasters, strikes, government orders, or disruption to critical infrastructure. In such cases, we will first attempt to reschedule the event. Refunds are issued only if the event cannot be reasonably rescheduled.</p>,
          de: <p>Wir haften nicht für Verzögerungen, Absagen oder Nichterfüllung aufgrund von Umständen außerhalb unserer zumutbaren Kontrolle, einschließlich, aber nicht beschränkt auf: Pandemien, Epidemien, Krieg, bewaffnete Konflikte, Terrorismus, Naturkatastrophen, Streiks, behördliche Anordnungen oder Störungen der kritischen Infrastruktur. In solchen Fällen werden wir zunächst versuchen, die Veranstaltung zu verschieben. Erstattungen erfolgen nur, wenn die Veranstaltung nicht zumutbar verschoben werden kann.</p>,
          fr: <p>Nous ne sommes pas responsables des retards, annulations ou inexécutions dus à des circonstances indépendantes de notre volonté, y compris mais sans s'y limiter : pandémies, épidémies, guerre, conflit armé, terrorisme, catastrophes naturelles, grèves, ordres gouvernementaux ou perturbation des infrastructures critiques. Dans de tels cas, nous tenterons d'abord de reporter l'événement. Les remboursements ne sont émis que si l'événement ne peut pas être raisonnablement reporté.</p>,
        }}
      </S>

      {/* ——— 14. Liability ——— */}
      <h2><S locale={locale}>{{ en: "14. Limitation of liability", de: "14. Haftungsbeschränkung", fr: "14. Limitation de responsabilité" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>To the extent permitted by applicable law, our total aggregate liability to you for all claims arising out of or relating to these Terms or our services shall not exceed the amount you paid for the relevant ticket(s).</p>
              <p>This limitation does <strong>not</strong> apply to liability that cannot be excluded or limited under mandatory law, including:</p>
              <ul>
                <li>Liability for death or personal injury (life, body, health).</li>
                <li>Liability for intentional misconduct (Vorsatz) or gross negligence (grobe Fahrlässigkeit).</li>
                <li>Liability under the German Product Liability Act (Produkthaftungsgesetz).</li>
                <li>Liability for breach of essential contractual obligations (wesentliche Vertragspflichten / Kardinalpflichten), limited to foreseeable, typical damages.</li>
              </ul>
            </>
          ),
          de: (
            <>
              <p>Soweit gesetzlich zulässig, ist unsere gesamte Haftung Ihnen gegenüber für alle Ansprüche, die sich aus diesen AGB oder unseren Diensten ergeben, auf den Betrag beschränkt, den Sie für das/die betreffende(n) Ticket(s) bezahlt haben.</p>
              <p>Diese Haftungsbeschränkung gilt <strong>nicht</strong> für Haftung, die nach zwingendem Recht nicht ausgeschlossen oder beschränkt werden kann, insbesondere:</p>
              <ul>
                <li>Haftung für Schäden an Leben, Körper und Gesundheit.</li>
                <li>Haftung bei Vorsatz oder grober Fahrlässigkeit.</li>
                <li>Haftung nach dem Produkthaftungsgesetz.</li>
                <li>Haftung für die Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), beschränkt auf den vorhersehbaren, vertragstypischen Schaden.</li>
              </ul>
            </>
          ),
          fr: (
            <>
              <p>Dans la mesure permise par la loi applicable, notre responsabilité totale envers vous pour toutes les réclamations découlant de ces Conditions ou de nos services ne dépassera pas le montant que vous avez payé pour le(s) billet(s) concerné(s).</p>
              <p>Cette limitation ne s'applique <strong>pas</strong> à la responsabilité qui ne peut être exclue ou limitée en vertu du droit impératif, notamment :</p>
              <ul>
                <li>Responsabilité en cas de décès ou de dommage corporel (vie, intégrité physique, santé).</li>
                <li>Responsabilité en cas de faute intentionnelle (Vorsatz) ou de négligence grave (grobe Fahrlässigkeit).</li>
                <li>Responsabilité en vertu de la loi allemande sur la responsabilité du fait des produits (Produkthaftungsgesetz).</li>
                <li>Responsabilité pour violation des obligations contractuelles essentielles (Kardinalpflichten), limitée aux dommages prévisibles et typiques du contrat.</li>
              </ul>
            </>
          ),
        }}
      </S>

      {/* ——— 15. Governing law ——— */}
      <h2><S locale={locale}>{{ en: "15. Governing law and jurisdiction", de: "15. Anwendbares Recht und Gerichtsstand", fr: "15. Droit applicable et juridiction" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p>These Terms are governed by the laws of the Federal Republic of Germany, without regard to conflict of law provisions. If you are a merchant (Kaufmann), the exclusive place of jurisdiction for all disputes is Düsseldorf, Germany.</p>
              <p>If you are a consumer habitually resident in the European Union, you also benefit from any mandatory provisions of the consumer protection laws of your country of residence. Nothing in these Terms affects your right as a consumer to bring proceedings in your country of residence (Regulation (EU) No. 1215/2012, Art. 18).</p>
              <p>The European Commission provides an online dispute resolution platform: <a href={c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"} target="_blank" rel="noopener noreferrer">{c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"}</a>.</p>
            </>
          ),
          de: (
            <>
              <p>Diese AGB unterliegen dem Recht der Bundesrepublik Deutschland unter Ausschluss der Kollisionsnormen. Wenn Sie Kaufmann sind, ist ausschließlicher Gerichtsstand für alle Streitigkeiten Düsseldorf, Deutschland.</p>
              <p>Wenn Sie Verbraucher mit gewöhnlichem Aufenthalt in der Europäischen Union sind, profitieren Sie zusätzlich von den zwingenden Bestimmungen des Verbraucherschutzrechts Ihres Wohnsitzlandes. Diese AGB beeinträchtigen nicht Ihr Recht als Verbraucher, Klagen an Ihrem Wohnsitz zu erheben (Verordnung (EU) Nr. 1215/2012, Art. 18).</p>
              <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href={c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"} target="_blank" rel="noopener noreferrer">{c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"}</a>.</p>
            </>
          ),
          fr: (
            <>
              <p>Les présentes Conditions sont régies par le droit de la République fédérale d'Allemagne, sans tenir compte des dispositions relatives aux conflits de lois. Si vous êtes commerçant, la juridiction exclusive pour tous les litiges est Düsseldorf, Allemagne.</p>
              <p>Si vous êtes un consommateur résidant habituellement dans l'Union européenne, vous bénéficiez également des dispositions impératives du droit de la protection des consommateurs de votre pays de résidence. Ces Conditions n'affectent pas votre droit en tant que consommateur d'intenter une action dans votre pays de résidence (Règlement (UE) n° 1215/2012, art. 18).</p>
              <p>La Commission européenne met à disposition une plateforme de règlement en ligne des litiges : <a href={c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"} target="_blank" rel="noopener noreferrer">{c?.eu_odr_link ?? "https://ec.europa.eu/consumers/odr"}</a>.</p>
            </>
          ),
        }}
      </S>

      {/* ——— 16. Changes ——— */}
      <h2><S locale={locale}>{{ en: "16. Changes to these terms", de: "16. Änderungen dieser AGB", fr: "16. Modifications de ces conditions" }}</S></h2>
      <S locale={locale}>
        {{
          en: <p>We may modify these Terms from time to time. Material changes will be notified to you at least 30 days in advance by email or in-app notification. Continued use of our services after the effective date constitutes acceptance of the updated Terms. If you do not agree, you may close your account before the effective date.</p>,
          de: <p>Wir können diese AGB von Zeit zu Zeit ändern. Wesentliche Änderungen werden Ihnen mindestens 30 Tage im Voraus per E-Mail oder In-App-Benachrichtigung mitgeteilt. Die fortgesetzte Nutzung unserer Dienste nach dem Wirksamkeitsdatum gilt als Annahme der aktualisierten AGB. Wenn Sie nicht einverstanden sind, können Sie Ihr Konto vor dem Wirksamkeitsdatum schließen.</p>,
          fr: <p>Nous pouvons modifier ces Conditions de temps à autre. Les modifications importantes vous seront notifiées au moins 30 jours à l'avance par e-mail ou notification dans l'application. L'utilisation continue de nos services après la date d'entrée en vigueur constitue l'acceptation des Conditions mises à jour. Si vous n'acceptez pas, vous pouvez fermer votre compte avant la date d'entrée en vigueur.</p>,
        }}
      </S>

      {/* ——— 17. US Arbitration addendum ——— */}
      <h2><S locale={locale}>{{ en: "17. Dispute resolution for United States residents", de: "17. Streitbeilegung für Einwohner der Vereinigten Staaten", fr: "17. Résolution des litiges pour les résidents des États-Unis" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <>
              <p><strong>This Section 17 applies only if you are a resident of the United States. It contains a binding individual arbitration agreement and a class action waiver. Please read it carefully.</strong></p>
              <h3>17.1 Pre-arbitration dispute notice</h3>
              <p>Before initiating arbitration, you must send a written dispute notice describing the nature and basis of the claim and the specific relief sought to <a href={`mailto:${legalEmail}`}>{legalEmail}</a>. We will attempt to resolve the dispute informally within 60 days of receiving the notice.</p>
              <h3>17.2 Binding individual arbitration</h3>
              <p>If the dispute is not resolved within 60 days, either party may commence binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration will be conducted in English. The seat of arbitration will be Delaware, United States, unless you elect to have it conducted in the state of your residence. The arbitrator's decision is final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>
              <h3>17.3 Class action waiver</h3>
              <p><strong>You and we agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</strong> If this class action waiver is found to be unenforceable, then the entirety of this arbitration agreement shall be null and void (but the remaining Terms survive).</p>
              <h3>17.4 Opt-out</h3>
              <p>You may opt out of this arbitration agreement within 30 days of first creating your account by sending an email to <a href={`mailto:${legalEmail}`}>{legalEmail}</a> with the subject line &quot;Arbitration Opt-Out&quot; and including your name, email address, and a clear statement that you wish to opt out. If you opt out, the governing law and jurisdiction provisions of Section 15 apply.</p>
              <h3>17.5 Small claims exception</h3>
              <p>Either party may bring an individual action in small claims court for disputes within the court's jurisdiction.</p>
              <h3>17.6 Severability</h3>
              <p>If any provision of this Section 17 is found unenforceable, the remaining provisions remain in full force and effect.</p>
            </>
          ),
          de: (
            <p><em>Dieser Abschnitt gilt nur für Einwohner der Vereinigten Staaten. Er enthält eine verbindliche individuelle Schiedsvereinbarung und einen Verzicht auf Sammelklagen. Vor Einleitung eines Schiedsverfahrens muss eine Streitbeilegungsmitteilung an <a href={`mailto:${legalEmail}`}>{legalEmail}</a> gesandt werden. Wenn der Streit nicht innerhalb von 60 Tagen beigelegt wird, kann eine bindende Einzelschiedsgerichtsbarkeit nach den Consumer Arbitration Rules der AAA eingeleitet werden. Opt-out ist innerhalb von 30 Tagen nach Kontoerstellung möglich.</em></p>
          ),
          fr: (
            <p><em>Cette section s'applique uniquement aux résidents des États-Unis. Elle contient un accord d'arbitrage individuel contraignant et une renonciation aux actions collectives. Avant d'initier un arbitrage, un avis de litige doit être envoyé à <a href={`mailto:${legalEmail}`}>{legalEmail}</a>. Si le litige n'est pas résolu dans les 60 jours, un arbitrage individuel contraignant peut être initié selon les Consumer Arbitration Rules de l'AAA. L'option de désistement est possible dans les 30 jours suivant la création du compte.</em></p>
          ),
        }}
      </S>

      {/* ——— 18. Contact ——— */}
      <h2><S locale={locale}>{{ en: "18. Contact", de: "18. Kontakt", fr: "18. Contact" }}</S></h2>
      <S locale={locale}>
        {{
          en: (
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href={`mailto:${legalEmail}`}>{legalEmail}</a>
              {c && (
                <>
                  <br />{entityName}
                  <br />{formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
          de: (
            <p>
              Für Fragen zu diesen AGB kontaktieren Sie uns unter:{" "}
              <a href={`mailto:${legalEmail}`}>{legalEmail}</a>
              {c && (
                <>
                  <br />{entityName}
                  <br />{formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
          fr: (
            <p>
              Pour toute question concernant ces Conditions, contactez-nous à :{" "}
              <a href={`mailto:${legalEmail}`}>{legalEmail}</a>
              {c && (
                <>
                  <br />{entityName}
                  <br />{formatRegisteredAddress(c, { oneLine: true })}
                </>
              )}
            </p>
          ),
        }}
      </S>

      {/* ——— Privacy policy link ——— */}
      <p>
        <S locale={locale}>
          {{
            en: <>For information about how we process your personal data, see our <a href={privacyUrl}>Privacy Policy</a>.</>,
            de: <>Informationen zur Verarbeitung Ihrer personenbezogenen Daten finden Sie in unserer <a href={privacyUrl}>Datenschutzerklärung</a>.</>,
            fr: <>Pour plus d'informations sur le traitement de vos données personnelles, consultez notre <a href={privacyUrl}>Politique de confidentialité</a>.</>,
          }}
        </S>
      </p>

      <hr />
      <p className="text-xs text-muted-foreground">
        <S locale={locale}>{{ en: "Last updated", de: "Letzte Aktualisierung", fr: "Dernière mise à jour" }}</S>: {t(LEGAL_LAST_UPDATED, locale)}
      </p>
    </article>
  );
}
