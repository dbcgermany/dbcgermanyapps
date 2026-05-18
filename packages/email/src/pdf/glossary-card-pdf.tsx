import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const C = {
  primary: "#c8102e",
  text: "#111111",
  textMuted: "#737373",
  textSubtle: "#9a9a9a",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    borderBottomWidth: 2,
    marginBottom: 16,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 80, height: 24, objectFit: "contain" },
  brandSuffix: { fontSize: 12, fontWeight: "normal", marginLeft: 2 },
  brandName: { fontSize: 12, fontWeight: "bold", letterSpacing: 1.4 },
  meta: { alignItems: "flex-end" },
  metaLabel: {
    fontSize: 7.5,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: { fontSize: 9, marginTop: 2 },
  titleBlock: { marginBottom: 14 },
  eyebrow: {
    fontSize: 8.5,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "bold", lineHeight: 1.15 },
  lead: {
    fontSize: 9.5,
    color: C.textMuted,
    lineHeight: 1.55,
    marginTop: 6,
    maxWidth: 480,
  },
  langStrip: {
    flexDirection: "row",
    backgroundColor: C.bgSubtle,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    marginTop: 12,
  },
  langColLabel: {
    fontSize: 7.5,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "bold",
  },
  langCol: { flex: 1 },
  row: {
    flexDirection: "row",
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  rowEn: { flex: 1, color: C.text, fontWeight: "bold", fontSize: 8.8 },
  rowDe: { flex: 1, color: C.text, fontSize: 8.8 },
  rowFr: { flex: 1, color: C.text, fontSize: 8.8 },
  rowNote: {
    fontSize: 7.2,
    color: C.textSubtle,
    marginTop: 1.5,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.textMuted },
});

interface Term {
  en: string;
  de: string;
  fr: string;
  note?: { en: string; de: string; fr: string };
}

interface Section {
  heading: { en: string; de: string; fr: string };
  terms: Term[];
}

// 30 terms across 4 sections: company forms, money & deals, roles & titles, working conversation.
// Chosen for actual use by African-rooted founders meeting German hosts in Essen.
const SECTIONS: Section[] = [
  {
    heading: {
      en: "Company forms & legal",
      de: "Rechtsformen & Recht",
      fr: "Formes juridiques & droit",
    },
    terms: [
      {
        en: "Public Limited Company (PLC)",
        de: "Aktiengesellschaft (AG)",
        fr: "Société anonyme (SA)",
      },
      {
        en: "Limited Liability Company (Ltd)",
        de: "GmbH (Gesellschaft mit beschränkter Haftung)",
        fr: "SARL (Société à responsabilité limitée)",
      },
      {
        en: "Partnership",
        de: "Personengesellschaft",
        fr: "Société de personnes",
      },
      {
        en: "Sole proprietorship",
        de: "Einzelunternehmen",
        fr: "Entreprise individuelle",
      },
      {
        en: "Articles of association",
        de: "Satzung / Gesellschaftsvertrag",
        fr: "Statuts",
      },
      {
        en: "Commercial register",
        de: "Handelsregister",
        fr: "Registre du commerce",
      },
      {
        en: "Trade tax / VAT number",
        de: "USt-IdNr.",
        fr: "Numéro de TVA intracommunautaire",
      },
    ],
  },
  {
    heading: {
      en: "Money, deals & terms",
      de: "Geld, Deals & Konditionen",
      fr: "Argent, deals & conditions",
    },
    terms: [
      {
        en: "Term sheet",
        de: "Term Sheet / Eckdatenpapier",
        fr: "Term sheet / Lettre d'intention",
      },
      {
        en: "Valuation",
        de: "Unternehmensbewertung",
        fr: "Valorisation",
      },
      {
        en: "Equity stake",
        de: "Beteiligungsquote",
        fr: "Participation",
      },
      {
        en: "Convertible note",
        de: "Wandeldarlehen",
        fr: "Obligation convertible",
      },
      {
        en: "Down round",
        de: "Down-Round (Abwertungsrunde)",
        fr: "Tour de table à la baisse",
      },
      {
        en: "Runway",
        de: "Reichweite (Cash Runway)",
        fr: "Visibilité de trésorerie",
      },
      {
        en: "Burn rate",
        de: "Burn-Rate (monatlicher Cash-Verbrauch)",
        fr: "Burn rate (consommation mensuelle)",
      },
      {
        en: "Letter of intent (LOI)",
        de: "Absichtserklärung (LOI)",
        fr: "Lettre d'intention",
      },
      {
        en: "Due diligence",
        de: "Due Diligence (Sorgfaltsprüfung)",
        fr: "Due diligence (audit d'acquisition)",
      },
      {
        en: "Cap table",
        de: "Cap Table (Anteilseignerstruktur)",
        fr: "Table de capitalisation",
      },
    ],
  },
  {
    heading: {
      en: "Roles & titles",
      de: "Rollen & Titel",
      fr: "Rôles & titres",
    },
    terms: [
      {
        en: "Managing Director",
        de: "Geschäftsführer:in",
        fr: "Directeur·rice général·e",
      },
      {
        en: "Board of Directors",
        de: "Vorstand",
        fr: "Directoire",
      },
      {
        en: "Supervisory Board",
        de: "Aufsichtsrat",
        fr: "Conseil de surveillance",
      },
      {
        en: "General Counsel",
        de: "Rechtsabteilung / Justiziar",
        fr: "Directeur·rice juridique",
      },
      {
        en: "Chief Financial Officer (CFO)",
        de: "Finanzvorstand / kaufm. Geschäftsführer:in",
        fr: "Directeur·rice financier·ère",
      },
      {
        en: "Authorised signatory",
        de: "Prokurist:in",
        fr: "Fondé·e de pouvoir",
      },
    ],
  },
  {
    heading: {
      en: "In conversation",
      de: "Im Gespräch",
      fr: "Dans la conversation",
    },
    terms: [
      {
        en: "Pleased to meet you",
        de: "Sehr erfreut",
        fr: "Enchanté·e",
      },
      {
        en: "Could we exchange contacts?",
        de: "Können wir Kontakte austauschen?",
        fr: "Pouvons-nous échanger nos contacts ?",
      },
      {
        en: "I'd like to follow up next week",
        de: "Ich würde mich gerne nächste Woche melden",
        fr: "Je vous recontacte la semaine prochaine",
      },
      {
        en: "Could you make an introduction?",
        de: "Würden Sie mich vorstellen?",
        fr: "Pourriez-vous me présenter ?",
      },
      {
        en: "Let's talk over lunch",
        de: "Lassen Sie uns beim Mittagessen sprechen",
        fr: "Continuons à table",
      },
      {
        en: "What's the right next step?",
        de: "Was wäre der richtige nächste Schritt?",
        fr: "Quelle est la prochaine étape ?",
      },
      {
        en: "Thank you for your time",
        de: "Vielen Dank für Ihre Zeit",
        fr: "Merci pour votre temps",
      },
    ],
  },
];

const COPY = {
  en: {
    eyebrow: "Trilingual glossary card",
    title: "30 terms that come up in the room.",
    lead:
      "Use this in conversation between sessions. English column is the anchor; German and French are the formal forms a host or counterparty will use.",
    metaLabel: "Carry this",
    metaValue: "In your pocket",
    sectionLabelEN: "English",
    sectionLabelDE: "Deutsch",
    sectionLabelFR: "Français",
    footer: "Trilingual glossary · Richesses d'Afrique Germany 2026",
  },
  de: {
    eyebrow: "Dreisprachige Glossarkarte",
    title: "30 Begriffe, die im Raum fallen.",
    lead:
      "Nutzen Sie diese Karte in Gesprächen zwischen den Sessions. Die englische Spalte ist der Anker; Deutsch und Französisch sind die formellen Formen, die Gastgeber oder Gegenüber verwenden werden.",
    metaLabel: "In die Tasche",
    metaValue: "Immer dabei",
    sectionLabelEN: "English",
    sectionLabelDE: "Deutsch",
    sectionLabelFR: "Français",
    footer: "Dreisprachiges Glossar · Richesses d'Afrique Germany 2026",
  },
  fr: {
    eyebrow: "Glossaire trilingue de poche",
    title: "30 termes qui reviennent dans la salle.",
    lead:
      "À utiliser entre les sessions. La colonne anglaise sert d'ancrage ; l'allemand et le français sont les formes formelles que les hôtes ou contreparties emploieront.",
    metaLabel: "À garder",
    metaValue: "Dans la poche",
    sectionLabelEN: "English",
    sectionLabelDE: "Deutsch",
    sectionLabelFR: "Français",
    footer: "Glossaire trilingue · Richesses d'Afrique Germany 2026",
  },
} as const;

export interface GlossaryCardPdfProps {
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export function GlossaryCardPdf(props: GlossaryCardPdfProps) {
  const t = COPY[props.locale];
  const primary = props.primaryColor || C.primary;
  const brandName = props.brandName || "DBC Germany";
  const legalName = props.legalName || "DBC Germany";
  const supportEmail = props.supportEmail || "info@dbc-germany.com";

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        <View style={[s.header, { borderBottomColor: primary }]}>
          <View style={s.brandStack}>
            {props.logoUrl ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={props.logoUrl} style={s.logo} />
                <Text style={[s.brandSuffix, { color: primary }]}>
                  Germany
                </Text>
              </>
            ) : (
              <Text style={[s.brandName, { color: primary }]}>
                {brandName.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={s.meta}>
            <Text style={s.metaLabel}>{t.metaLabel}</Text>
            <Text style={s.metaValue}>{t.metaValue}</Text>
          </View>
        </View>

        <View style={s.titleBlock}>
          <Text style={s.eyebrow}>{t.eyebrow}</Text>
          <Text style={s.title}>{t.title}</Text>
          <Text style={s.lead}>{t.lead}</Text>
        </View>

        <View style={s.langStrip} fixed>
          <View style={s.langCol}>
            <Text style={s.langColLabel}>{t.sectionLabelEN}</Text>
          </View>
          <View style={s.langCol}>
            <Text style={s.langColLabel}>{t.sectionLabelDE}</Text>
          </View>
          <View style={s.langCol}>
            <Text style={s.langColLabel}>{t.sectionLabelFR}</Text>
          </View>
        </View>

        {SECTIONS.map((section, si) => (
          <View key={si} wrap={false}>
            <Text style={s.sectionHeading}>
              {section.heading[props.locale]}
            </Text>
            {section.terms.map((term, ti) => (
              <View key={ti} style={s.row} wrap={false}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={s.rowEn}>{term.en}</Text>
                  {term.note && (
                    <Text style={s.rowNote}>{term.note.en}</Text>
                  )}
                </View>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={s.rowDe}>{term.de}</Text>
                  {term.note && (
                    <Text style={s.rowNote}>{term.note.de}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowFr}>{term.fr}</Text>
                  {term.note && (
                    <Text style={s.rowNote}>{term.note.fr}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {t.footer} {"·"} {legalName} {"·"} {supportEmail}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
