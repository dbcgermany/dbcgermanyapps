import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const COLORS = {
  primary: "#c8102e",
  text: "#111111",
  textMuted: "#666666",
  textSubtle: "#999999",
  border: "#d4d4d4",
  borderSubtle: "#ececec",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

// DIN A4 = 210 x 297 mm. @react-pdf default size="A4" handles the canvas.
// Margins follow DIN 5008 (German business letter standard) loosely:
//   left  ~25mm, right ~20mm, top ~25mm, bottom ~25mm
const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    paddingTop: 56,
    paddingBottom: 80,
    paddingLeft: 71,
    paddingRight: 56,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.55,
  },
  // Letterhead — logo + brand text
  letterhead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  logoImage: {
    width: 110,
    height: 34,
    objectFit: "contain",
  },
  brandSuffix: {
    fontSize: 20,
    color: COLORS.primary,
  },
  brandTagline: {
    fontSize: 8,
    color: COLORS.textSubtle,
    letterSpacing: 0.6,
    marginTop: 2,
    marginBottom: 14,
  },
  letterheadRule: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary,
    marginBottom: 28,
  },
  // Sender hairline (very small line, "From: ..." style above recipient block)
  senderLine: {
    fontSize: 7.5,
    color: COLORS.textSubtle,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderSubtle,
  },
  // Recipient address block (positioned for window envelopes)
  recipientBlock: {
    marginBottom: 36,
  },
  recipientName: {
    fontSize: 11,
    color: COLORS.text,
  },
  recipientLine: {
    fontSize: 11,
    color: COLORS.text,
  },
  // City, date — right aligned
  dateLine: {
    textAlign: "right",
    fontSize: 10.5,
    color: COLORS.text,
    marginBottom: 28,
  },
  // Subject — bold, sets the tone
  subject: {
    fontSize: 11.5,
    fontWeight: "bold",
    marginBottom: 22,
  },
  // Salutation
  salutation: {
    fontSize: 11,
    marginBottom: 14,
  },
  // Body paragraphs
  bodyParagraph: {
    fontSize: 10.5,
    lineHeight: 1.7,
    marginBottom: 11,
    color: COLORS.text,
    textAlign: "justify",
  },
  // Event details — refined card, less "techy"
  detailsCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 14,
    paddingBottom: 14,
    marginTop: 18,
    marginBottom: 18,
  },
  detailsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  detailsEventTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    width: 85,
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.text,
  },
  // Closing
  ticketNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 12,
    marginBottom: 28,
  },
  closing: {
    fontSize: 11,
    marginBottom: 8,
  },
  signatureSpace: {
    height: 36,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  senderTitle: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  // Footer at bottom of page
  footer: {
    position: "absolute",
    bottom: 32,
    left: 71,
    right: 56,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerLeft: {
    flexDirection: "column",
    gap: 1,
  },
  footerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 1,
  },
  footerText: {
    fontSize: 7.5,
    color: COLORS.textMuted,
  },
});

const TRANSLATIONS = {
  en: {
    senderPrefix: "From",
    subjectLabel: "Subject",
    subjectPrefix: "Invitation",
    detailsTitle: "Event details",
    dateLabel: "Date",
    timeLabel: "Time",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    refLabel: "Reference",
    ticketNote:
      "Your personal admission ticket with QR code is attached as a separate PDF. Please bring it printed or on your phone.",
    tagline: "AFRICA’S TOP BUSINESS GROUP",
  },
  de: {
    senderPrefix: "Absender",
    subjectLabel: "Betreff",
    subjectPrefix: "Einladung",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    timeLabel: "Uhrzeit",
    venueLabel: "Veranstaltungsort",
    tierLabel: "Ticketart",
    refLabel: "Referenz",
    ticketNote:
      "Ihr persönliches Eintrittsticket mit QR-Code ist als separate PDF beigefügt. Bitte bringen Sie es ausgedruckt oder auf Ihrem Smartphone mit.",
    tagline: "AFRIKAS FÜHRENDE BUSINESS-GRUPPE",
  },
  fr: {
    senderPrefix: "Expéditeur",
    subjectLabel: "Objet",
    subjectPrefix: "Invitation",
    detailsTitle: "Détails de l’événement",
    dateLabel: "Date",
    timeLabel: "Heure",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    refLabel: "Référence",
    ticketNote:
      "Votre billet personnel avec code QR est joint à cette invitation en pièce séparée. Veuillez le présenter imprimé ou sur votre téléphone.",
    tagline: "PREMIER GROUPE D’AFFAIRES AFRICAIN",
  },
};

export interface InvitationLetterPdfProps {
  // Branding
  brandName: string;
  legalName: string;
  legalForm?: string;
  primaryColor: string;
  logoUrl?: string;
  // Sender (shown as hairline above recipient block + in footer)
  senderLine1?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
  senderPhone?: string;
  supportEmail: string;
  // Optional bank details — shown in the footer "Bankverbindung" block so
  // recipients (and finance teams downstream) can wire payments to the
  // right account from the same legal letter.
  accountHolder?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  // Recipient
  recipientName: string;
  recipientEmail?: string;
  // Letter content
  salutation: string;
  closing: string;
  bodyText: string;
  // Event
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  tierName: string;
  ticketShortId: string;
  // Meta
  locale: "en" | "de" | "fr";
  letterDate: string;
}

function formatSenderLine(props: InvitationLetterPdfProps): string | null {
  const parts = [
    props.senderLine1,
    [props.senderPostalCode, props.senderCity].filter(Boolean).join(" "),
    props.senderCountry,
  ]
    .filter(Boolean)
    .map((s) => (s as string).trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function formatLocationDate(props: InvitationLetterPdfProps): string {
  // "Düsseldorf, 1. Mai 2026" — city + date stacked into one line.
  return [props.senderCity, props.letterDate].filter(Boolean).join(", ");
}

export function InvitationLetterPdf(props: InvitationLetterPdfProps) {
  const t = TRANSLATIONS[props.locale];
  const paragraphs = props.bodyText.split(/\n\n+/).filter(Boolean);
  const primary = props.primaryColor || COLORS.primary;
  const senderLine = formatSenderLine(props);
  const locationDate = formatLocationDate(props);
  const subject = `${t.subjectPrefix}: ${props.eventTitle}`;

  const legalLineParts = [
    [props.legalName, props.legalForm].filter(Boolean).join(" "),
    props.senderLine1,
    [props.senderPostalCode, props.senderCity].filter(Boolean).join(" "),
  ].filter(Boolean);
  const legalLine = legalLineParts.join(" · ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          {props.logoUrl && (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image src={props.logoUrl} style={styles.logoImage} />
          )}
          <Text style={[styles.brandSuffix, { color: primary }]}>Germany</Text>
        </View>
        <Text style={styles.brandTagline}>{t.tagline}</Text>
        <View style={[styles.letterheadRule, { borderBottomColor: primary }]} />

        {/* Sender hairline + recipient block */}
        {senderLine && (
          <Text style={styles.senderLine}>
            {t.senderPrefix}: {senderLine}
          </Text>
        )}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientName}>{props.recipientName}</Text>
          {props.recipientEmail && (
            <Text style={styles.recipientLine}>{props.recipientEmail}</Text>
          )}
        </View>

        {/* City + date right-aligned */}
        {locationDate && <Text style={styles.dateLine}>{locationDate}</Text>}

        {/* Subject */}
        <Text style={styles.subject}>
          {t.subjectLabel}: {subject}
        </Text>

        {/* Salutation */}
        <Text style={styles.salutation}>{props.salutation},</Text>

        {/* Body */}
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.bodyParagraph}>
            {p}
          </Text>
        ))}

        {/* Event details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t.detailsTitle}</Text>
          <Text style={styles.detailsEventTitle}>{props.eventTitle}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.dateLabel}</Text>
            <Text style={styles.detailValue}>{props.eventDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.timeLabel}</Text>
            <Text style={styles.detailValue}>{props.eventTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.venueLabel}</Text>
            <Text style={styles.detailValue}>
              {props.venueName}
              {props.venueAddress ? `, ${props.venueAddress}` : ""}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.tierLabel}</Text>
            <Text style={styles.detailValue}>{props.tierName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.refLabel}</Text>
            <Text style={styles.detailValue}>#{props.ticketShortId}</Text>
          </View>
        </View>

        {/* Ticket attachment note */}
        <Text style={styles.ticketNote}>{t.ticketNote}</Text>

        {/* Closing + signature */}
        <Text style={styles.closing}>{props.closing}</Text>
        <View style={styles.signatureSpace} />
        <Text style={styles.senderName}>{props.brandName} Team</Text>
        <Text style={styles.senderTitle}>Event Management</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            {legalLine ? (
              <Text style={styles.footerText}>{legalLine}</Text>
            ) : null}
            <Text style={styles.footerText}>
              {props.supportEmail}
              {props.senderPhone ? ` · ${props.senderPhone}` : ""}
            </Text>
            {(props.iban || props.bic) && (
              <Text style={styles.footerText}>
                {props.accountHolder ? `${props.accountHolder} · ` : ""}
                {props.bankName ? `${props.bankName} · ` : ""}
                {props.iban ? `IBAN: ${props.iban}` : ""}
                {props.iban && props.bic ? " · " : ""}
                {props.bic ? `BIC: ${props.bic}` : ""}
              </Text>
            )}
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>
              {t.refLabel}: #{props.ticketShortId}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
