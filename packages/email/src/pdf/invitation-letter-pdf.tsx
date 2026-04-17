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
  textMuted: "#737373",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  // Letterhead
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: 30,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  brandSubtext: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Date line
  dateLine: {
    textAlign: "right",
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  // Salutation + body
  salutation: {
    fontSize: 11,
    marginBottom: 16,
  },
  bodyParagraph: {
    fontSize: 10.5,
    lineHeight: 1.7,
    marginBottom: 10,
    color: "#333333",
  },
  // Event details card
  detailsCard: {
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    width: 100,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 10.5,
  },
  // Ticket note
  ticketNote: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginBottom: 24,
  },
  // Closing
  closing: {
    fontSize: 11,
    marginBottom: 6,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 16,
  },
  senderTitle: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  // Reference
  refLine: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
});

const TRANSLATIONS = {
  en: {
    detailsTitle: "Event details",
    dateLabel: "Date",
    timeLabel: "Time",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    refLabel: "Reference",
    ticketNote:
      "Your personal ticket with QR code is attached to this email as a separate PDF.",
  },
  de: {
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    timeLabel: "Uhrzeit",
    venueLabel: "Veranstaltungsort",
    tierLabel: "Ticketart",
    refLabel: "Referenz",
    ticketNote:
      "Ihr pers\u00F6nliches Ticket mit QR-Code liegt dieser E-Mail als separate PDF-Datei bei.",
  },
  fr: {
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    timeLabel: "Heure",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    refLabel: "R\u00E9f\u00E9rence",
    ticketNote:
      "Votre billet personnel avec code QR est joint \u00E0 cet e-mail en pi\u00E8ce jointe PDF s\u00E9par\u00E9e.",
  },
};

export interface InvitationLetterPdfProps {
  // Branding
  brandName: string;
  legalName: string;
  companyAddress: string;
  supportEmail: string;
  primaryColor: string;
  logoUrl?: string;
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

export function InvitationLetterPdf(props: InvitationLetterPdfProps) {
  const t = TRANSLATIONS[props.locale];
  const paragraphs = props.bodyText.split(/\n\n+/).filter(Boolean);
  const primary = props.primaryColor || COLORS.primary;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={[styles.header, { borderBottomColor: primary }]}>
          {props.logoUrl && (
            <Image src={props.logoUrl} style={styles.logo} />
          )}
          <View>
            <Text style={[styles.brandName, { color: primary }]}>
              {props.brandName.toUpperCase()}
            </Text>
            <Text style={styles.brandSubtext}>{props.legalName}</Text>
          </View>
        </View>

        {/* Date + reference */}
        <Text style={styles.dateLine}>{props.letterDate}</Text>
        <Text style={styles.refLine}>
          {t.refLabel}: #{props.ticketShortId}
        </Text>

        {/* Salutation */}
        <Text style={styles.salutation}>{props.salutation},</Text>

        {/* Body */}
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.bodyParagraph}>
            {p}
          </Text>
        ))}

        {/* Event details card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t.detailsTitle}</Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            {props.eventTitle}
          </Text>

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
        </View>

        {/* Ticket note */}
        <Text style={styles.ticketNote}>{t.ticketNote}</Text>

        {/* Closing + signature */}
        <Text style={styles.closing}>{props.closing}</Text>
        <Text style={styles.senderName}>DBC Germany Team</Text>
        <Text style={styles.senderTitle}>Event Management</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {props.legalName} {"\u00B7"} {props.supportEmail}
          </Text>
          <Text style={styles.footerText}>
            {props.companyAddress}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
