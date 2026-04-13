import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// DBC brand colors (light mode)
const COLORS = {
  primary: "#c8102e",
  accent: "#d4a017",
  text: "#111111",
  textMuted: "#737373",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COLORS.text,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `2pt solid ${COLORS.primary}`,
    paddingBottom: 16,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ticketLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketNumber: {
    fontSize: 11,
    fontFamily: "Courier",
    marginTop: 2,
  },
  // Event title
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
  },
  eventType: {
    fontSize: 10,
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  // Info grid
  infoGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "bold",
  },
  infoSubvalue: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Attendee section (highlighted)
  attendeeSection: {
    backgroundColor: COLORS.bgSubtle,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  // QR section
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    padding: 24,
    border: `1pt dashed ${COLORS.border}`,
    borderRadius: 4,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrInstructions: {
    marginLeft: 24,
    flex: 1,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  qrText: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: `1pt solid ${COLORS.border}`,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  accentBar: {
    height: 4,
    backgroundColor: COLORS.accent,
    marginBottom: 24,
  },
});

interface TicketPdfProps {
  // Event
  eventTitle: string;
  eventType: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  timezone: string;
  // Attendee
  attendeeName: string;
  attendeeEmail: string;
  // Tier
  tierName: string;
  // QR
  qrDataUrl: string;
  ticketToken: string;
  // Locale
  locale: "en" | "de" | "fr";
}

const TRANSLATIONS = {
  en: {
    ticket: "Ticket",
    date: "Date",
    venue: "Venue",
    attendee: "Attendee",
    tierLabel: "Ticket Type",
    scanTitle: "Present at entrance",
    scanText: "Show this QR code at the entrance for fast check-in. Each ticket is valid for one person only.",
    footer: "DBC Germany GmbH \u00B7 ticket.dbc-germany.com",
  },
  de: {
    ticket: "Ticket",
    date: "Datum",
    venue: "Veranstaltungsort",
    attendee: "Teilnehmer",
    tierLabel: "Ticketart",
    scanTitle: "Am Eingang vorzeigen",
    scanText: "Zeigen Sie diesen QR-Code am Eingang f\u00FCr einen schnellen Check-in. Jedes Ticket ist nur f\u00FCr eine Person g\u00FCltig.",
    footer: "DBC Germany GmbH \u00B7 ticket.dbc-germany.com",
  },
  fr: {
    ticket: "Billet",
    date: "Date",
    venue: "Lieu",
    attendee: "Participant",
    tierLabel: "Type de billet",
    scanTitle: "\u00C0 pr\u00E9senter \u00E0 l\u2019entr\u00E9e",
    scanText: "Montrez ce code QR \u00E0 l\u2019entr\u00E9e pour un enregistrement rapide. Chaque billet n\u2019est valable que pour une seule personne.",
    footer: "DBC Germany GmbH \u00B7 ticket.dbc-germany.com",
  },
};

export function TicketPdf(props: TicketPdfProps) {
  const t = TRANSLATIONS[props.locale];

  const dateStr = props.startsAt.toLocaleDateString(props.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = `${props.startsAt.toLocaleTimeString(props.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} \u2013 ${props.endsAt.toLocaleTimeString(props.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>DBC GERMANY</Text>
            <Text style={styles.brandTagline}>
              Africa\u2019s Top Business Group
            </Text>
          </View>
          <View>
            <Text style={styles.ticketLabel}>{t.ticket}</Text>
            <Text style={styles.ticketNumber}>
              {props.ticketToken.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Event Title */}
        <Text style={styles.eventType}>{props.eventType}</Text>
        <Text style={styles.eventTitle}>{props.eventTitle}</Text>

        <View style={styles.accentBar} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>{t.date}</Text>
            <Text style={styles.infoValue}>{dateStr}</Text>
            <Text style={styles.infoSubvalue}>
              {timeStr} ({props.timezone})
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>{t.venue}</Text>
            <Text style={styles.infoValue}>{props.venueName}</Text>
            <Text style={styles.infoSubvalue}>
              {props.venueAddress}
              {props.city ? `, ${props.city}` : ""}
            </Text>
          </View>
        </View>

        {/* Attendee */}
        <View style={styles.attendeeSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>{t.attendee}</Text>
              <Text style={styles.infoValue}>{props.attendeeName}</Text>
              <Text style={styles.infoSubvalue}>{props.attendeeEmail}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>{t.tierLabel}</Text>
              <Text style={styles.infoValue}>{props.tierName}</Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={props.qrDataUrl} style={styles.qrImage} />
          <View style={styles.qrInstructions}>
            <Text style={styles.qrTitle}>{t.scanTitle}</Text>
            <Text style={styles.qrText}>{t.scanText}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.footer}</Text>
          <Text style={styles.footerText}>
            #{props.ticketToken.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
