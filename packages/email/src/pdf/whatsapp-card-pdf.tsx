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
  whatsapp: "#25d366",
  text: "#111111",
  textMuted: "#737373",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 42,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 12,
    borderBottomWidth: 2,
    marginBottom: 22,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 90, height: 28, objectFit: "contain" },
  brandSuffix: { fontSize: 14, fontWeight: "normal", marginLeft: 2 },
  brandName: { fontSize: 14, fontWeight: "bold", letterSpacing: 1.5 },
  meta: { alignItems: "flex-end" },
  metaLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: { fontSize: 9, marginTop: 2 },
  hero: { marginBottom: 18 },
  eyebrow: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 1.15,
    marginBottom: 10,
    maxWidth: 460,
  },
  lead: {
    fontSize: 11.5,
    lineHeight: 1.6,
    color: C.text,
    maxWidth: 460,
  },
  bigBox: {
    flexDirection: "row",
    gap: 20,
    border: `1pt solid ${C.border}`,
    borderRadius: 4,
    padding: 18,
    marginBottom: 18,
    backgroundColor: C.bgSubtle,
  },
  qrCol: { width: 200, alignItems: "center", justifyContent: "center" },
  qrImage: { width: 180, height: 180 },
  qrPending: {
    width: 180,
    height: 180,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    borderRadius: 6,
    backgroundColor: C.bg,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPendingTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.textMuted,
    textAlign: "center",
    marginBottom: 6,
  },
  qrPendingText: {
    fontSize: 9,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 1.5,
  },
  qrCaption: {
    marginTop: 8,
    fontSize: 8.5,
    color: C.textMuted,
    textAlign: "center",
  },
  qrCol2: { flex: 1, justifyContent: "center" },
  qrHeading: {
    fontSize: 13,
    fontWeight: "bold",
    color: C.text,
    marginBottom: 6,
  },
  qrSub: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.55,
    marginBottom: 10,
  },
  joinPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.whatsapp,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  rulesTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.text,
    marginBottom: 8,
    marginTop: 4,
  },
  ruleItem: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.55,
    marginBottom: 6,
  },
  ruleStrong: { fontWeight: "bold" },
  cadenceTitle: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  cadenceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  cadenceBadge: {
    width: 60,
    fontSize: 8.5,
    color: C.primary,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cadenceText: { flex: 1, fontSize: 10, color: C.text, lineHeight: 1.55 },
  twoCol: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 42,
    right: 42,
    borderTopWidth: 0.7,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.textMuted },
});

const COPY = {
  en: {
    eyebrow: "Class of 2026 · post-event access",
    title: "The conversations don't end on June 13.",
    lead:
      "Every ticket to Richesses d'Afrique Germany 2026 unlocks a 12-month membership in the Class of 2026: quarterly operator calls, deck reviews, warm intros on demand. This card explains how to plug in.",
    metaLabel: "Save this",
    metaValue: "Open on your phone",
    qrHeading: "Join the WhatsApp channel",
    qrSub:
      "Scan the code with your phone camera. The channel is private — only ticket-holders can join. Mute it on day one; the cadence is light by design.",
    qrCaption: "Or: open the URL printed below the QR code.",
    qrPendingTitle: "Link coming soon",
    qrPendingText:
      "We're sending the WhatsApp link by email 7 days before the event. If you don't see it by June 6, write to support and we'll resend.",
    pillJoin: "Join the room",
    rulesTitle: "How this room works",
    rules: [
      {
        strong: "Compare notes, don't pitch.",
        rest:
          " Open with a question or an observation. Sales pitches get muted. We mean it.",
      },
      {
        strong: "Names, not handles.",
        rest:
          " Use your real name and the one-line role from your ticket so others can find you.",
      },
      {
        strong: "Ask for warm intros directly.",
        rest:
          " A specific ask — 'who has shipped X in Lagos?' — gets warmer answers than a broad one.",
      },
      {
        strong: "Share the receipt, not the screenshot.",
        rest:
          " If you cite a deal, a doc or a number, link the source. Keeps everyone honest.",
      },
    ],
    cadenceTitle: "What lands in the channel",
    cadence: [
      {
        when: "Weekly",
        text:
          "One question or one signal from a member, posted by the DBC team. Low volume, high signal.",
      },
      {
        when: "Quarterly",
        text:
          "Class of 2026 operator call — 60 minutes, three deck reviews, three intros made live on the call.",
      },
      {
        when: "On demand",
        text:
          "Drop a 1-line ask in the #intros thread; the team brokers the connection if it lands within the room.",
      },
    ],
    footer:
      "Class of 2026 onboarding card · Richesses d'Afrique Germany 2026",
  },
  de: {
    eyebrow: "Class of 2026 · Zugang nach dem Event",
    title: "Am 13. Juni hört das Gespräch nicht auf.",
    lead:
      "Jedes Ticket für Richesses d'Afrique Germany 2026 öffnet eine zwölfmonatige Mitgliedschaft in der Class of 2026: Quartals-Operator-Calls, Deck-Reviews und warme Intros auf Anfrage. Diese Karte zeigt, wie Sie einsteigen.",
    metaLabel: "Aufheben",
    metaValue: "Aufs Handy",
    qrHeading: "Treten Sie dem WhatsApp-Kanal bei",
    qrSub:
      "Scannen Sie den Code mit der Handykamera. Der Kanal ist privat — nur Ticketinhaber:innen kommen rein. Am ersten Tag stummschalten; der Takt ist bewusst leise.",
    qrCaption: "Alternativ: öffnen Sie die URL unter dem QR-Code.",
    qrPendingTitle: "Link folgt in Kürze",
    qrPendingText:
      "Wir versenden den WhatsApp-Link per E-Mail 7 Tage vor dem Event. Falls bis 6. Juni nichts kommt, schreiben Sie an unseren Support — wir schicken ihn erneut.",
    pillJoin: "In den Raum",
    rulesTitle: "So funktioniert der Raum",
    rules: [
      {
        strong: "Notizen vergleichen, nicht pitchen.",
        rest:
          " Beginnen Sie mit einer Frage oder einer Beobachtung. Verkaufstexte werden stummgeschaltet. Wirklich.",
      },
      {
        strong: "Namen statt Handles.",
        rest:
          " Verwenden Sie Ihren echten Namen und die Rolle aus Ihrem Ticket, damit andere Sie finden.",
      },
      {
        strong: "Warme Intros direkt erbitten.",
        rest:
          " Eine konkrete Frage — „Wer hat X in Lagos schon umgesetzt?“ — bekommt wärmere Antworten als eine offene.",
      },
      {
        strong: "Quelle teilen, nicht den Screenshot.",
        rest:
          " Wenn Sie ein Deal, ein Dokument oder eine Zahl zitieren, verlinken Sie die Quelle. Hält alle ehrlich.",
      },
    ],
    cadenceTitle: "Was im Kanal landet",
    cadence: [
      {
        when: "Wöchentlich",
        text:
          "Eine Frage oder ein Signal eines Mitglieds, vom DBC-Team gepostet. Wenig Volumen, viel Signal.",
      },
      {
        when: "Quartalsweise",
        text:
          "Class-of-2026-Operator-Call — 60 Minuten, drei Deck-Reviews, drei Intros live auf dem Call.",
      },
      {
        when: "Auf Anfrage",
        text:
          "Eine 1-Zeilen-Anfrage in #intros — das Team vermittelt, wenn das Match im Raum vorhanden ist.",
      },
    ],
    footer:
      "Class-of-2026-Karte · Richesses d'Afrique Germany 2026",
  },
  fr: {
    eyebrow: "Class of 2026 · accès post-événement",
    title: "Le 13 juin, la conversation ne s'arrête pas.",
    lead:
      "Chaque billet pour Richesses d'Afrique Germany 2026 ouvre douze mois d'adhésion à la Class of 2026 : calls opérateurs trimestriels, relectures de decks et intros chaudes à la demande. Cette carte explique comment vous brancher.",
    metaLabel: "À conserver",
    metaValue: "Ouvrir sur le téléphone",
    qrHeading: "Rejoindre le canal WhatsApp",
    qrSub:
      "Scannez le code avec l'appareil photo. Le canal est privé — seuls les détenteurs de billets y entrent. Coupez les notifications dès le premier jour ; le rythme est volontairement léger.",
    qrCaption: "Sinon : ouvrez l'URL imprimée sous le QR.",
    qrPendingTitle: "Lien à venir",
    qrPendingText:
      "Nous envoyons le lien WhatsApp par e-mail 7 jours avant l'événement. Si vous ne le voyez pas avant le 6 juin, écrivez à notre support et nous le renverrons.",
    pillJoin: "Entrer dans la salle",
    rulesTitle: "Mode d'emploi de la salle",
    rules: [
      {
        strong: "Comparer les notes, ne pas pitcher.",
        rest:
          " Ouvrez avec une question ou une observation. Les pitchs sont coupés. C'est sérieux.",
      },
      {
        strong: "Vrais noms, pas de pseudos.",
        rest:
          " Utilisez votre vrai nom et le rôle d'une ligne indiqué sur votre billet, pour qu'on vous retrouve.",
      },
      {
        strong: "Demander les intros directement.",
        rest:
          " Une demande précise — « qui a livré X à Lagos ? » — obtient des réponses plus chaudes qu'une demande vague.",
      },
      {
        strong: "Partager la source, pas la capture.",
        rest:
          " Si vous citez un deal, un document ou un chiffre, mettez le lien. Cela tient tout le monde honnête.",
      },
    ],
    cadenceTitle: "Ce qui passe dans le canal",
    cadence: [
      {
        when: "Hebdo",
        text:
          "Une question ou un signal d'un·e membre, posté par l'équipe DBC. Peu de volume, beaucoup de signal.",
      },
      {
        when: "Trimestre",
        text:
          "Call opérateurs Class of 2026 — 60 minutes, trois decks relus, trois intros faites en direct.",
      },
      {
        when: "Sur demande",
        text:
          "Une demande d'une ligne dans #intros — l'équipe orchestre le match s'il est dans la salle.",
      },
    ],
    footer:
      "Carte d'accès Class of 2026 · Richesses d'Afrique Germany 2026",
  },
} as const;

export interface WhatsappCardPdfProps {
  locale: "en" | "de" | "fr";
  /**
   * The WhatsApp join URL. If omitted, the QR area renders a "link coming soon"
   * placeholder so the card stays useful before the channel is published.
   */
  whatsappUrl?: string;
  /**
   * Optional pre-rendered QR code as a data URL. The generator renders the QR
   * server-side so this PDF stays a pure renderer with no native deps.
   */
  qrDataUrl?: string;
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export function WhatsappCardPdf(props: WhatsappCardPdfProps) {
  const t = COPY[props.locale];
  const primary = props.primaryColor || C.primary;
  const brandName = props.brandName || "DBC Germany";
  const legalName = props.legalName || "DBC Germany";
  const supportEmail = props.supportEmail || "info@dbc-germany.com";
  const hasLink = Boolean(props.whatsappUrl && props.qrDataUrl);

  return (
    <Document>
      <Page size="A4" style={s.page}>
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

        <View style={s.hero}>
          <Text style={s.eyebrow}>{t.eyebrow}</Text>
          <Text style={s.title}>{t.title}</Text>
          <Text style={s.lead}>{t.lead}</Text>
        </View>

        <View style={s.bigBox}>
          <View style={s.qrCol}>
            {hasLink ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={props.qrDataUrl!} style={s.qrImage} />
                <Text style={s.qrCaption}>{props.whatsappUrl}</Text>
              </>
            ) : (
              <View style={s.qrPending}>
                <Text style={s.qrPendingTitle}>{t.qrPendingTitle}</Text>
                <Text style={s.qrPendingText}>{t.qrPendingText}</Text>
              </View>
            )}
          </View>
          <View style={s.qrCol2}>
            <Text style={s.qrHeading}>{t.qrHeading}</Text>
            <Text style={s.qrSub}>{t.qrSub}</Text>
            {hasLink && <Text style={s.joinPill}>{t.pillJoin}</Text>}
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.rulesTitle}>{t.rulesTitle}</Text>
            {t.rules.map((rule, i) => (
              <Text key={i} style={s.ruleItem}>
                {"—  "}
                <Text style={s.ruleStrong}>{rule.strong}</Text>
                {rule.rest}
              </Text>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.cadenceTitle}>{t.cadenceTitle}</Text>
            {t.cadence.map((c, i) => (
              <View key={i} style={s.cadenceRow}>
                <Text style={s.cadenceBadge}>{c.when}</Text>
                <Text style={s.cadenceText}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {t.footer} {"·"} {legalName} {"·"} {supportEmail}
          </Text>
          <Text style={s.footerText}>
            {brandName} {"·"} dbc-germany.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}
