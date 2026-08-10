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
  accent: "#d4a017",
  text: "#111111",
  textMuted: "#737373",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
  rule: "#cfcfcf",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 44,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    borderBottomWidth: 2,
    marginBottom: 22,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 90, height: 28, objectFit: "contain" },
  brandSuffix: { fontSize: 14, fontWeight: "normal", marginLeft: 2 },
  brandName: { fontSize: 14, fontWeight: "bold", letterSpacing: 1.5 },
  pageMeta: { alignItems: "flex-end" },
  pageMetaLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pageMetaValue: { fontSize: 10, color: C.text, marginTop: 2 },
  cover: { marginTop: 60 },
  coverEyebrow: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 1.15,
    marginBottom: 14,
  },
  coverLead: {
    fontSize: 12,
    color: C.text,
    lineHeight: 1.55,
    marginBottom: 18,
    maxWidth: 440,
  },
  coverNote: {
    fontSize: 9.5,
    color: C.textMuted,
    lineHeight: 1.55,
    marginBottom: 28,
    maxWidth: 440,
  },
  coverInstructions: {
    backgroundColor: C.bgSubtle,
    border: `1pt solid ${C.border}`,
    borderRadius: 4,
    padding: 16,
    marginTop: 28,
  },
  coverInstrTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverInstrItem: {
    fontSize: 10,
    lineHeight: 1.55,
    color: C.text,
    marginBottom: 3,
  },
  sectionEyebrow: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    lineHeight: 1.2,
  },
  sectionHint: {
    fontSize: 10,
    color: C.textMuted,
    lineHeight: 1.55,
    marginBottom: 18,
    maxWidth: 460,
  },
  lineGroup: { marginBottom: 18 },
  lineLabel: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  line: {
    borderBottomWidth: 0.7,
    borderBottomColor: C.rule,
    height: 22,
  },
  twoCol: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },
  smallBox: {
    border: `1pt solid ${C.border}`,
    borderRadius: 3,
    padding: 12,
    marginBottom: 12,
    minHeight: 70,
  },
  smallBoxLabel: {
    fontSize: 8.5,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  threeColMatrix: { flexDirection: "row", gap: 10 },
  matrixCol: {
    flex: 1,
    border: `1pt solid ${C.border}`,
    borderRadius: 3,
    padding: 10,
    minHeight: 110,
  },
  matrixHead: {
    fontSize: 8.5,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  numberedRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  numberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3,
  },
  numberedLine: {
    flex: 1,
    borderBottomWidth: 0.7,
    borderBottomColor: C.rule,
    height: 18,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    borderTopWidth: 0.7,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.textMuted },
});

const T = {
  en: {
    eyebrow: "Outcomes Worksheet",
    pageMetaLabel: "Your copy",
    pageMetaValue: "Bring this with you",
    coverTitle: "Leave Essen with one decision made.",
    coverLead:
      "This is the worksheet operators in the room use to walk out with something they can act on the next morning. Not a journal. A short, honest set of answers that you'll come back to four times.",
    coverNote:
      "Fill the first two pages on the train, the plane, the night before. The third page mid-event. The fourth on the way home. Re-read it once a month. That's the whole method.",
    coverInstrTitle: "How to use this",
    coverInstrItems: [
      "Pages 1 and 2: write these answers before you arrive. Pen, not phone.",
      "Page 3: capture three names and three signals during the day.",
      "Page 4: write your 90-day commitment on the way home, then put it on your wall.",
    ],
    p1Eyebrow: "Page 1 of 4 · Before Essen",
    p1Title: "The one decision",
    p1Hint:
      "Most operators arrive with a list. You only need one. Write the single decision you'd be glad to have made by the end of September 5.",
    p1Q1: "The one decision I want to walk out with",
    p1Q2: "Why this decision matters to me right now",
    p1Q3: "What's been blocking me from making it",
    p1Q4: "What would make me confident to make it",
    p2Eyebrow: "Page 2 of 4 · Before Essen",
    p2Title: "The room you need",
    p2Hint:
      "Who in the room would change the answer? Be specific — a role, a stage, a company type. Three is enough.",
    matrixWhoTitle: "Who I need to meet",
    matrixWhyTitle: "Why this person",
    matrixAskTitle: "The ask, in one line",
    p2WildcardLabel: "One wildcard — someone I'd never normally approach",
    p3Eyebrow: "Page 3 of 4 · During Essen",
    p3Title: "Three signals, three names",
    p3Hint:
      "Catch them while they're warm. One line per box. Don't polish it.",
    p3Names: "Three names I want to follow up with this week",
    p3Signals:
      "Three signals from the day — a quote, a number, a market that surprised me",
    p3Reframe: "One thing I now think differently about",
    p4Eyebrow: "Page 4 of 4 · After Essen",
    p4Title: "The 90-day commitment",
    p4Hint:
      "If September 5 was worth it, write the proof. Three milestones, each one you can verify yourself on a specific date.",
    p4WriteTitle: "The commitment, written as if it's already true",
    p4MilestoneLabel: "Milestone",
    p4DateLabel: "By",
    p4AccountabilityLabel:
      "The person I'll send this page to within 7 days",
    footerLeft: "Outcomes Worksheet · Richesses d'Afrique Germany 2026",
    footerRight: "Page {n} of 4",
  },
  de: {
    eyebrow: "Ergebnis-Worksheet",
    pageMetaLabel: "Ihr Exemplar",
    pageMetaValue: "Bitte mitbringen",
    coverTitle:
      "Verlassen Sie Essen mit einer einzigen Entscheidung im Gepäck.",
    coverLead:
      "Mit diesem Worksheet gehen die Operatoren im Raum hinaus und haben am nächsten Morgen etwas, woran sie konkret arbeiten können. Kein Tagebuch. Ein kurzer, ehrlicher Satz Antworten, zu dem Sie viermal zurückkehren.",
    coverNote:
      "Füllen Sie die ersten beiden Seiten unterwegs aus, am Abend zuvor. Seite drei mitten am Tag. Seite vier auf der Rückreise. Lesen Sie es einmal im Monat noch einmal. Mehr Methode braucht es nicht.",
    coverInstrTitle: "So nutzen Sie es",
    coverInstrItems: [
      "Seite 1 und 2: vor der Anreise ausfüllen. Mit Stift, nicht mit Handy.",
      "Seite 3: drei Namen und drei Beobachtungen im Verlauf des Tages festhalten.",
      "Seite 4: Ihre 90-Tage-Verpflichtung auf dem Rückweg notieren und sichtbar aufhängen.",
    ],
    p1Eyebrow: "Seite 1 von 4 · Vor Essen",
    p1Title: "Die eine Entscheidung",
    p1Hint:
      "Die meisten kommen mit einer Liste. Sie brauchen nur eine. Schreiben Sie die eine Entscheidung auf, mit der Sie am 5. September gerne herausgehen würden.",
    p1Q1: "Die eine Entscheidung, mit der ich rausgehen will",
    p1Q2: "Warum diese Entscheidung jetzt wichtig ist",
    p1Q3: "Was mich bisher davon abgehalten hat",
    p1Q4: "Was mir die Sicherheit gäbe, sie zu treffen",
    p2Eyebrow: "Seite 2 von 4 · Vor Essen",
    p2Title: "Der Raum, den Sie brauchen",
    p2Hint:
      "Wer im Raum würde Ihre Antwort ändern? Werden Sie konkret — Rolle, Phase, Unternehmensart. Drei reichen.",
    matrixWhoTitle: "Wen ich treffen muss",
    matrixWhyTitle: "Warum diese Person",
    matrixAskTitle: "Die Bitte, in einem Satz",
    p2WildcardLabel:
      "Ein Wildcard — jemand, den ich sonst nie ansprechen würde",
    p3Eyebrow: "Seite 3 von 4 · Während Essen",
    p3Title: "Drei Signale, drei Namen",
    p3Hint:
      "Notieren Sie es, solange es frisch ist. Eine Zeile pro Feld. Nicht polieren.",
    p3Names:
      "Drei Namen, mit denen ich diese Woche nachfassen will",
    p3Signals:
      "Drei Signale des Tages — ein Zitat, eine Zahl, ein Markt, der mich überrascht hat",
    p3Reframe: "Eine Sache, die ich jetzt anders sehe",
    p4Eyebrow: "Seite 4 von 4 · Nach Essen",
    p4Title: "Die 90-Tage-Verpflichtung",
    p4Hint:
      "Wenn der 5. September etwas wert war, schreiben Sie den Beweis auf. Drei Meilensteine, jeder überprüfbar an einem konkreten Datum.",
    p4WriteTitle:
      "Die Verpflichtung, formuliert als sei sie bereits Realität",
    p4MilestoneLabel: "Meilenstein",
    p4DateLabel: "Bis",
    p4AccountabilityLabel:
      "An wen ich diese Seite innerhalb von 7 Tagen schicken werde",
    footerLeft: "Ergebnis-Worksheet · Richesses d'Afrique Germany 2026",
    footerRight: "Seite {n} von 4",
  },
  fr: {
    eyebrow: "Feuille de résultats",
    pageMetaLabel: "Votre exemplaire",
    pageMetaValue: "À emporter",
    coverTitle: "Repartez d'Essen avec une seule décision prise.",
    coverLead:
      "Voici la feuille que les opérateurs et opératrices dans la salle utilisent pour repartir avec quelque chose d'actionnable dès le lendemain. Pas un journal. Quelques réponses courtes et honnêtes, sur lesquelles vous reviendrez quatre fois.",
    coverNote:
      "Remplissez les deux premières pages dans le train, l'avion, la veille au soir. La troisième en milieu de journée. La quatrième sur le chemin du retour. Relisez-la une fois par mois. C'est toute la méthode.",
    coverInstrTitle: "Mode d'emploi",
    coverInstrItems: [
      "Pages 1 et 2 à remplir avant d'arriver. Au stylo, pas au téléphone.",
      "Page 3 : trois noms et trois signaux à capter pendant la journée.",
      "Page 4 : votre engagement à 90 jours rédigé sur le retour, puis mis au mur.",
    ],
    p1Eyebrow: "Page 1 sur 4 · Avant Essen",
    p1Title: "L'unique décision",
    p1Hint:
      "La plupart arrivent avec une liste. Une seule suffit. Notez la décision unique que vous serez heureux d'avoir prise le soir du 5 septembre.",
    p1Q1: "La seule décision avec laquelle je veux ressortir",
    p1Q2: "Pourquoi cette décision compte maintenant",
    p1Q3: "Ce qui m'a empêché de la prendre jusqu'ici",
    p1Q4: "Ce qui me donnerait la confiance de la prendre",
    p2Eyebrow: "Page 2 sur 4 · Avant Essen",
    p2Title: "La salle qu'il vous faut",
    p2Hint:
      "Qui, dans la salle, changerait votre réponse ? Soyez précis : un rôle, un stade, un type d'entreprise. Trois suffisent.",
    matrixWhoTitle: "Qui je dois rencontrer",
    matrixWhyTitle: "Pourquoi cette personne",
    matrixAskTitle: "La demande, en une ligne",
    p2WildcardLabel:
      "Un wildcard — quelqu'un que je n'aborderais jamais normalement",
    p3Eyebrow: "Page 3 sur 4 · Pendant Essen",
    p3Title: "Trois signaux, trois noms",
    p3Hint:
      "Notez tant que c'est chaud. Une ligne par case. Pas besoin de polir.",
    p3Names:
      "Trois noms que je veux relancer cette semaine",
    p3Signals:
      "Trois signaux de la journée — une citation, un chiffre, un marché qui m'a surpris",
    p3Reframe: "Une chose que je vois différemment maintenant",
    p4Eyebrow: "Page 4 sur 4 · Après Essen",
    p4Title: "L'engagement à 90 jours",
    p4Hint:
      "Si le 5 septembre en valait la peine, écrivez la preuve. Trois jalons, chacun vérifiable à une date précise.",
    p4WriteTitle:
      "L'engagement, formulé comme s'il était déjà acquis",
    p4MilestoneLabel: "Jalon",
    p4DateLabel: "Pour le",
    p4AccountabilityLabel:
      "La personne à qui j'enverrai cette page sous 7 jours",
    footerLeft:
      "Feuille de résultats · Richesses d'Afrique Germany 2026",
    footerRight: "Page {n} sur 4",
  },
} as const;

export interface OutcomesWorksheetPdfProps {
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
  attendeeName?: string | null;
}

function Footer({
  pageNumber,
  legalName,
  supportEmail,
  footerLeft,
  footerRight,
}: {
  pageNumber: number;
  legalName: string;
  supportEmail: string;
  footerLeft: string;
  footerRight: string;
}) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        {footerLeft} {"·"} {legalName} {"·"} {supportEmail}
      </Text>
      <Text style={s.footerText}>
        {footerRight.replace("{n}", String(pageNumber))}
      </Text>
    </View>
  );
}

function Header({
  primary,
  brandName,
  logoUrl,
  metaLabel,
  metaValue,
}: {
  primary: string;
  brandName: string;
  logoUrl?: string;
  metaLabel: string;
  metaValue: string;
}) {
  return (
    <View style={[s.header, { borderBottomColor: primary }]}>
      <View style={s.brandStack}>
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoUrl} style={s.logo} />
            <Text style={[s.brandSuffix, { color: primary }]}>Germany</Text>
          </>
        ) : (
          <Text style={[s.brandName, { color: primary }]}>
            {brandName.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={s.pageMeta}>
        <Text style={s.pageMetaLabel}>{metaLabel}</Text>
        <Text style={s.pageMetaValue}>{metaValue}</Text>
      </View>
    </View>
  );
}

function LineRow() {
  return <View style={s.line} />;
}

function MultiLineGroup({ label, lines = 4 }: { label: string; lines?: number }) {
  return (
    <View style={s.lineGroup}>
      <Text style={s.lineLabel}>{label}</Text>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <LineRow />
        </View>
      ))}
    </View>
  );
}

export function OutcomesWorksheetPdf(props: OutcomesWorksheetPdfProps) {
  const t = T[props.locale];
  const primary = props.primaryColor || C.primary;
  const brandName = props.brandName || "DBC Germany";
  const legalName = props.legalName || "DBC Germany";
  const supportEmail = props.supportEmail || "info@dbc-germany.com";

  return (
    <Document>
      {/* Page 1 — cover + decision */}
      <Page size="A4" style={s.page}>
        <Header
          primary={primary}
          brandName={brandName}
          logoUrl={props.logoUrl}
          metaLabel={t.pageMetaLabel}
          metaValue={t.pageMetaValue}
        />

        <View style={s.cover}>
          <Text style={s.coverEyebrow}>{t.eyebrow}</Text>
          <Text style={s.coverTitle}>{t.coverTitle}</Text>
          <Text style={s.coverLead}>{t.coverLead}</Text>
          <Text style={s.coverNote}>{t.coverNote}</Text>

          <View style={s.coverInstructions}>
            <Text style={s.coverInstrTitle}>{t.coverInstrTitle}</Text>
            {t.coverInstrItems.map((item, i) => (
              <Text key={i} style={s.coverInstrItem}>
                {"—  "}
                {item}
              </Text>
            ))}
          </View>
        </View>

        <Footer
          pageNumber={1}
          legalName={legalName}
          supportEmail={supportEmail}
          footerLeft={t.footerLeft}
          footerRight={t.footerRight}
        />
      </Page>

      {/* Page 2 — the one decision */}
      <Page size="A4" style={s.page}>
        <Header
          primary={primary}
          brandName={brandName}
          logoUrl={props.logoUrl}
          metaLabel={t.pageMetaLabel}
          metaValue={t.pageMetaValue}
        />

        <Text style={s.sectionEyebrow}>{t.p1Eyebrow}</Text>
        <Text style={s.sectionTitle}>{t.p1Title}</Text>
        <Text style={s.sectionHint}>{t.p1Hint}</Text>

        <MultiLineGroup label={t.p1Q1} lines={3} />
        <MultiLineGroup label={t.p1Q2} lines={3} />
        <View style={s.twoCol}>
          <View style={s.col}>
            <MultiLineGroup label={t.p1Q3} lines={4} />
          </View>
          <View style={s.col}>
            <MultiLineGroup label={t.p1Q4} lines={4} />
          </View>
        </View>

        <Footer
          pageNumber={2}
          legalName={legalName}
          supportEmail={supportEmail}
          footerLeft={t.footerLeft}
          footerRight={t.footerRight}
        />
      </Page>

      {/* Page 3 — the room you need */}
      <Page size="A4" style={s.page}>
        <Header
          primary={primary}
          brandName={brandName}
          logoUrl={props.logoUrl}
          metaLabel={t.pageMetaLabel}
          metaValue={t.pageMetaValue}
        />

        <Text style={s.sectionEyebrow}>{t.p2Eyebrow}</Text>
        <Text style={s.sectionTitle}>{t.p2Title}</Text>
        <Text style={s.sectionHint}>{t.p2Hint}</Text>

        <View style={s.threeColMatrix}>
          <View style={s.matrixCol}>
            <Text style={s.matrixHead}>{t.matrixWhoTitle}</Text>
            {[1, 2, 3].map((n) => (
              <View key={n} style={s.numberedRow}>
                <Text
                  style={[s.numberBadge, { backgroundColor: primary }]}
                >
                  {n}
                </Text>
                <View style={s.numberedLine} />
              </View>
            ))}
          </View>
          <View style={s.matrixCol}>
            <Text style={s.matrixHead}>{t.matrixWhyTitle}</Text>
            {[1, 2, 3].map((n) => (
              <View key={n} style={s.numberedRow}>
                <Text
                  style={[s.numberBadge, { backgroundColor: primary }]}
                >
                  {n}
                </Text>
                <View style={s.numberedLine} />
              </View>
            ))}
          </View>
          <View style={s.matrixCol}>
            <Text style={s.matrixHead}>{t.matrixAskTitle}</Text>
            {[1, 2, 3].map((n) => (
              <View key={n} style={s.numberedRow}>
                <Text
                  style={[s.numberBadge, { backgroundColor: primary }]}
                >
                  {n}
                </Text>
                <View style={s.numberedLine} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
        <View style={s.smallBox}>
          <Text style={s.smallBoxLabel}>{t.p2WildcardLabel}</Text>
          <View style={{ marginTop: 6 }}>
            <LineRow />
            <View style={{ height: 6 }} />
            <LineRow />
          </View>
        </View>

        <Footer
          pageNumber={3}
          legalName={legalName}
          supportEmail={supportEmail}
          footerLeft={t.footerLeft}
          footerRight={t.footerRight}
        />
      </Page>

      {/* Page 4 — during + after (signals + commitment) */}
      <Page size="A4" style={s.page}>
        <Header
          primary={primary}
          brandName={brandName}
          logoUrl={props.logoUrl}
          metaLabel={t.pageMetaLabel}
          metaValue={t.pageMetaValue}
        />

        <Text style={s.sectionEyebrow}>{t.p3Eyebrow}</Text>
        <Text style={s.sectionTitle}>{t.p3Title}</Text>
        <Text style={s.sectionHint}>{t.p3Hint}</Text>

        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={s.smallBox}>
              <Text style={s.smallBoxLabel}>{t.p3Names}</Text>
              {[1, 2, 3].map((n) => (
                <View key={n} style={s.numberedRow}>
                  <Text
                    style={[s.numberBadge, { backgroundColor: primary }]}
                  >
                    {n}
                  </Text>
                  <View style={s.numberedLine} />
                </View>
              ))}
            </View>
          </View>
          <View style={s.col}>
            <View style={s.smallBox}>
              <Text style={s.smallBoxLabel}>{t.p3Signals}</Text>
              {[1, 2, 3].map((n) => (
                <View key={n} style={s.numberedRow}>
                  <Text
                    style={[s.numberBadge, { backgroundColor: primary }]}
                  >
                    {n}
                  </Text>
                  <View style={s.numberedLine} />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.smallBox}>
          <Text style={s.smallBoxLabel}>{t.p3Reframe}</Text>
          <View style={{ marginTop: 6 }}>
            <LineRow />
            <View style={{ height: 6 }} />
            <LineRow />
          </View>
        </View>

        <View style={{ height: 14 }} />
        <Text style={s.sectionEyebrow}>{t.p4Eyebrow}</Text>
        <Text style={[s.sectionTitle, { fontSize: 16 }]}>{t.p4Title}</Text>
        <Text style={[s.sectionHint, { marginBottom: 10 }]}>{t.p4Hint}</Text>

        <View style={s.smallBox}>
          <Text style={s.smallBoxLabel}>{t.p4WriteTitle}</Text>
          <View style={{ marginTop: 6 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "flex-end",
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 4 }}>
                  <Text style={s.matrixHead}>{t.p4MilestoneLabel}</Text>
                  <LineRow />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.matrixHead}>{t.p4DateLabel}</Text>
                  <LineRow />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.smallBox}>
          <Text style={s.smallBoxLabel}>
            {t.p4AccountabilityLabel}
          </Text>
          <View style={{ marginTop: 6 }}>
            <LineRow />
          </View>
        </View>

        <Footer
          pageNumber={4}
          legalName={legalName}
          supportEmail={supportEmail}
          footerLeft={t.footerLeft}
          footerRight={t.footerRight}
        />
      </Page>
    </Document>
  );
}
