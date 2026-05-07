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
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    marginBottom: 18,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 30, height: 30 },
  brandName: { fontSize: 14, fontWeight: "bold", letterSpacing: 1.5 },
  brandSub: { fontSize: 7, color: C.textMuted, marginTop: 2 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  speakerHeader: {
    marginTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  speakerPhoto: { width: 36, height: 36, borderRadius: 18 },
  speakerName: { fontSize: 14, fontWeight: "bold" },
  speakerRole: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  speakerCount: {
    fontSize: 8,
    color: C.textMuted,
    marginLeft: "auto",
  },
  questionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  questionMeta: {
    fontSize: 8,
    color: C.textMuted,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 11,
    lineHeight: 1.45,
    color: C.text,
  },
  emptySection: {
    paddingVertical: 12,
    fontSize: 10,
    fontStyle: "italic",
    color: C.textMuted,
  },
  pageBreakSpacer: { marginTop: 14 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.textMuted },
  toc: {
    marginBottom: 18,
    backgroundColor: C.bgSubtle,
    padding: 12,
    borderRadius: 4,
  },
  tocTitle: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  tocName: { fontSize: 10 },
  tocCount: { fontSize: 9, color: C.textMuted },
});

const T = {
  en: {
    title: "SPEAKER QUESTIONS",
    eventLabel: "Audience submissions",
    tocTitle: "Speakers in this brief",
    questionsLabel: "questions",
    questionLabelSingular: "question",
    submittedBy: "Submitted by",
    on: "on",
    noQuestions: "No questions submitted for this speaker yet.",
    generatedAt: "Generated",
    pageOf: "Page",
  },
  de: {
    title: "FRAGEN AN DIE SPEAKER",
    eventLabel: "Einreichungen aus dem Publikum",
    tocTitle: "Speaker in diesem Briefing",
    questionsLabel: "Fragen",
    questionLabelSingular: "Frage",
    submittedBy: "Eingereicht von",
    on: "am",
    noQuestions: "Für diese Speaker:in liegen noch keine Fragen vor.",
    generatedAt: "Erstellt",
    pageOf: "Seite",
  },
  fr: {
    title: "QUESTIONS POUR LES INTERVENANTS",
    eventLabel: "Soumissions du public",
    tocTitle: "Intervenants dans ce briefing",
    questionsLabel: "questions",
    questionLabelSingular: "question",
    submittedBy: "Soumise par",
    on: "le",
    noQuestions: "Aucune question soumise pour cet intervenant pour l'instant.",
    generatedAt: "Généré",
    pageOf: "Page",
  },
};

export interface SpeakerQuestionsPdfQuestion {
  question: string;
  attendeeName: string;
  createdAt: string;
}

export interface SpeakerQuestionsPdfSpeakerGroup {
  speakerId: string;
  speakerName: string;
  roleLabel: string;
  photoUrl?: string | null;
  questions: SpeakerQuestionsPdfQuestion[];
}

export interface SpeakerQuestionsPdfProps {
  eventTitle: string;
  eventDate: string;
  groups: SpeakerQuestionsPdfSpeakerGroup[];
  locale: "en" | "de" | "fr";
  generatedDate: string;
  brandName: string;
  legalName: string;
  supportEmail: string;
  primaryColor?: string;
  logoUrl?: string;
}

function fmtDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SpeakerQuestionsPdf(props: SpeakerQuestionsPdfProps) {
  const t = T[props.locale];
  const pc = props.primaryColor || C.primary;
  const totalQuestions = props.groups.reduce(
    (sum, g) => sum + g.questions.length,
    0
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: pc }]}>
          <View style={s.brandStack}>
            {props.logoUrl && <Image src={props.logoUrl} style={s.logo} />}
            <View>
              <Text style={[s.brandName, { color: pc }]}>
                {props.brandName.toUpperCase()}
              </Text>
              <Text style={s.brandSub}>{t.title}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.title}>{props.eventTitle}</Text>
            <Text style={s.subtitle}>
              {props.eventDate} · {totalQuestions} {totalQuestions === 1 ? t.questionLabelSingular : t.questionsLabel}
            </Text>
          </View>
        </View>

        {/* Table of contents — handy when handing one stack of paper to a runner */}
        <View style={s.toc}>
          <Text style={s.tocTitle}>{t.tocTitle}</Text>
          {props.groups.map((g) => (
            <View key={g.speakerId} style={s.tocRow}>
              <Text style={s.tocName}>{g.speakerName}</Text>
              <Text style={s.tocCount}>
                {g.questions.length}{" "}
                {g.questions.length === 1
                  ? t.questionLabelSingular
                  : t.questionsLabel}
              </Text>
            </View>
          ))}
        </View>

        {/* Speaker sections — each speaker starts on a new page so the
            stack can be split and handed out individually. */}
        {props.groups.map((g, gi) => (
          <View
            key={g.speakerId}
            break={gi > 0}
            style={gi > 0 ? s.pageBreakSpacer : undefined}
          >
            <View style={s.speakerHeader}>
              {g.photoUrl ? (
                <Image src={g.photoUrl} style={s.speakerPhoto} />
              ) : (
                <View
                  style={[s.speakerPhoto, { backgroundColor: C.bgSubtle }]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.speakerName}>{g.speakerName}</Text>
                {g.roleLabel ? (
                  <Text style={s.speakerRole}>{g.roleLabel}</Text>
                ) : null}
              </View>
              <Text style={s.speakerCount}>
                {g.questions.length}{" "}
                {g.questions.length === 1
                  ? t.questionLabelSingular
                  : t.questionsLabel}
              </Text>
            </View>

            {g.questions.length === 0 ? (
              <Text style={s.emptySection}>{t.noQuestions}</Text>
            ) : (
              g.questions.map((q, qi) => (
                <View key={qi} style={s.questionRow} wrap={false}>
                  <Text style={s.questionMeta}>
                    {qi + 1}. {t.submittedBy} {q.attendeeName} {t.on}{" "}
                    {fmtDate(q.createdAt, props.locale)}
                  </Text>
                  <Text style={s.questionText}>{q.question}</Text>
                </View>
              ))
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {props.legalName} · {props.supportEmail}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${t.generatedAt}: ${props.generatedDate} · ${t.pageOf} ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
