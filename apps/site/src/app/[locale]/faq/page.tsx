import type { Metadata } from "next";
import { Card, Container, Eyebrow, Heading, Reveal, Section } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/faq", pageKey: "faq" });
}

type Qa = {
  q: { en: string; de: string; fr: string };
  a: { en: string; de: string; fr: string };
};

const SECTIONS: Array<{
  title: { en: string; de: string; fr: string };
  qas: Qa[];
}> = [
  {
    title: {
      en: "Tickets & events",
      de: "Tickets & Events",
      fr: "Billets & événements",
    },
    qas: [
      {
        q: {
          en: "When is Richesses d'Afrique 2026 and where?",
          de: "Wann ist Richesses d'Afrique 2026 und wo?",
          fr: "Quand et où a lieu Richesses d'Afrique 2026 ?",
        },
        a: {
          en: "Saturday, 13 June 2026, in Essen, Germany. Tickets are available at tickets.dbc-germany.com.",
          de: "Samstag, 13. Juni 2026, in Essen. Tickets unter tickets.dbc-germany.com.",
          fr: "Samedi 13 juin 2026 à Essen (Allemagne). Billets sur tickets.dbc-germany.com.",
        },
      },
      {
        q: {
          en: "Can I get a refund?",
          de: "Kann ich mein Ticket erstatten lassen?",
          fr: "Puis-je obtenir un remboursement ?",
        },
        a: {
          en: "Yes, full refund up to 14 days before the event (standard consumer rights). After that, refunds are at our discretion; ticket transfers to a new name are always free.",
          de: "Ja, volle Erstattung bis 14 Tage vor der Veranstaltung (gesetzliches Widerrufsrecht). Danach nach unserem Ermessen; die Umschreibung auf einen neuen Namen ist jederzeit kostenlos.",
          fr: "Oui, remboursement intégral jusqu'à 14 jours avant l'événement (droit de rétractation). Au-delà, à notre discrétion ; le transfert à un nouveau nom reste gratuit.",
        },
      },
      {
        q: {
          en: "Can I transfer my ticket to a colleague?",
          de: "Kann ich mein Ticket an Kolleg:innen übertragen?",
          fr: "Puis-je transférer mon billet à un collègue ?",
        },
        a: {
          en: "Yes. Sign in at tickets.dbc-germany.com, open the order, and use the transfer flow — a new QR code is issued to the new attendee.",
          de: "Ja. Auf tickets.dbc-germany.com einloggen, die Bestellung öffnen und den Transfer nutzen — der neue Gast erhält einen neuen QR-Code.",
          fr: "Oui. Connectez-vous sur tickets.dbc-germany.com, ouvrez la commande et utilisez la fonction de transfert — un nouveau QR est généré pour le nouveau participant.",
        },
      },
    ],
  },
  {
    title: {
      en: "Programmes",
      de: "Programme",
      fr: "Programmes",
    },
    qas: [
      {
        q: {
          en: "Who is DBC Germany for?",
          de: "Für wen ist DBC Germany da?",
          fr: "À qui s'adresse DBC Germany ?",
        },
        a: {
          en: "Founders with African roots or African focus, based in Germany, Austria, or Switzerland, and European investors wanting exposure to that ecosystem.",
          de: "Gründer:innen mit afrikanischen Wurzeln oder Afrika-Fokus, ansässig in Deutschland, Österreich oder der Schweiz — sowie europäische Investor:innen, die Zugang zu diesem Ökosystem suchen.",
          fr: "Entrepreneurs aux racines africaines ou à focus africain, basés en Allemagne, Autriche ou Suisse — et investisseurs européens souhaitant s'exposer à cet écosystème.",
        },
      },
      {
        q: {
          en: "Do I need to speak French to apply?",
          de: "Muss ich Französisch sprechen?",
          fr: "Dois-je parler français pour candidater ?",
        },
        a: {
          en: "No. DBC Germany runs programmes in German and English; French is available on request because DBC International operates across francophone Africa.",
          de: "Nein. DBC Germany bietet Programme auf Deutsch und Englisch an; Französisch ist auf Anfrage verfügbar, da DBC International auch im frankophonen Afrika tätig ist.",
          fr: "Non. DBC Germany propose ses programmes en allemand et en anglais ; le français est disponible sur demande, DBC International opérant aussi dans l'Afrique francophone.",
        },
      },
      {
        q: {
          en: "How do I apply for incubation?",
          de: "Wie bewerbe ich mich für die Inkubation?",
          fr: "Comment candidater à l'incubation ?",
        },
        a: {
          en: "The public application form at /services/incubation/apply lands directly in our admin dashboard. We review applications weekly and respond within 10 business days.",
          de: "Das Bewerbungsformular unter /services/incubation/apply landet direkt in unserem Admin-Dashboard. Wir sichten Bewerbungen wöchentlich und antworten innerhalb von zehn Werktagen.",
          fr: "Le formulaire sur /services/incubation/apply arrive directement dans notre tableau de bord admin. Nous étudions les candidatures chaque semaine et répondons sous 10 jours ouvrés.",
        },
      },
    ],
  },
  {
    title: {
      en: "Legal & data",
      de: "Recht & Daten",
      fr: "Droit & données",
    },
    qas: [
      {
        q: {
          en: "Where is my data stored?",
          de: "Wo werden meine Daten gespeichert?",
          fr: "Où mes données sont-elles stockées ?",
        },
        a: {
          en: "In the EU (Supabase · Frankfurt region). See our Privacy policy for processors and retention.",
          de: "In der EU (Supabase · Frankfurt). Details zu Auftragsverarbeitern und Aufbewahrung in unserer Datenschutzerklärung.",
          fr: "Dans l'UE (Supabase · Francfort). Détails des sous-traitants et durées de conservation dans la politique de confidentialité.",
        },
      },
      {
        q: {
          en: "Is DBC Germany registered in the Handelsregister yet?",
          de: "Ist DBC Germany schon im Handelsregister eingetragen?",
          fr: "DBC Germany est-elle déjà au Handelsregister ?",
        },
        a: {
          en: "We are currently being set up as a UG (haftungsbeschränkt). The Handelsregister entry will appear in the Imprint as soon as it is issued.",
          de: "Wir befinden uns in der Gründung als UG (haftungsbeschränkt). Der Handelsregistereintrag wird im Impressum veröffentlicht, sobald er erteilt ist.",
          fr: "Nous sommes en cours d'immatriculation en tant qu'UG (haftungsbeschränkt). L'entrée au Handelsregister sera publiée dans les mentions légales dès son attribution.",
        },
      },
    ],
  },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  return (
    <Section>
      <Container max="3xl">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <Heading level={1} className="mt-3">
            {l === "de"
              ? "Häufige Fragen"
              : l === "fr"
                ? "Questions fréquentes"
                : "Frequently asked questions"}
          </Heading>
        </Reveal>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title.en}>
              <Reveal>
                <Heading level={3}>{section.title[l]}</Heading>
              </Reveal>
              <dl className="mt-6 space-y-4">
                {section.qas.map((qa, i) => (
                  <Reveal key={qa.q.en} delay={Math.min(i, 5) * 40}>
                  <Card padding="md">
                    <dt className="font-semibold text-foreground">
                      {qa.q[l]}
                    </dt>
                    <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                      {qa.a[l]}
                    </dd>
                  </Card>
                  </Reveal>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
