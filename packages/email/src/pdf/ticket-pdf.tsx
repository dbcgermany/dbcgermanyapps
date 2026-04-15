import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// DBC brand colors used as fallback when company_info values aren't provided.
const DEFAULT_COLORS = {
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
    backgroundColor: DEFAULT_COLORS.bg,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: DEFAULT_COLORS.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    marginBottom: 24,
  },
  brandStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  ticketLabel: {
    fontSize: 9,
    color: DEFAULT_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketNumber: {
    fontSize: 11,
    fontFamily: "Courier",
    marginTop: 2,
  },
  invitationBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderRadius: 3,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    color: DEFAULT_COLORS.text,
  },
  eventType: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 18,
  },
  accentBar: {
    height: 4,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  infoColumn: { flex: 1 },
  infoLabel: {
    fontSize: 8,
    color: DEFAULT_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    color: DEFAULT_COLORS.text,
    fontWeight: "bold",
  },
  infoSubvalue: {
    fontSize: 10,
    color: DEFAULT_COLORS.textMuted,
    marginTop: 2,
  },
  attendeeSection: {
    backgroundColor: DEFAULT_COLORS.bgSubtle,
    border: `1pt solid ${DEFAULT_COLORS.border}`,
    borderRadius: 4,
    padding: 18,
    marginBottom: 24,
  },
  attendeeName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    padding: 24,
    border: `1pt dashed ${DEFAULT_COLORS.border}`,
    borderRadius: 4,
  },
  qrImage: {
    width: 170,
    height: 170,
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
    color: DEFAULT_COLORS.textMuted,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: `1pt solid ${DEFAULT_COLORS.border}`,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: DEFAULT_COLORS.textMuted,
  },
});

interface TicketPdfProps {
  eventTitle: string;
  eventType: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  timezone: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  qrDataUrl: string;
  ticketToken: string;
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
  isInvitation?: boolean;
}

const TRANSLATIONS = {
  en: {
    ticket: "Ticket",
    date: "Date",
    venue: "Venue",
    attendee: "Attendee",
    tierLabel: "Ticket Type",
    scanTitle: "Present at entrance",
    scanText:
      "Show this QR code at the entrance for fast check-in. One scan only — ticket cannot be reused.",
    invitation: "Invited guest",
    support: "Support",
  },
  de: {
    ticket: "Ticket",
    date: "Datum",
    venue: "Veranstaltungsort",
    attendee: "Teilnehmer:in",
    tierLabel: "Ticketart",
    scanTitle: "Am Eingang vorzeigen",
    scanText:
      "Zeigen Sie diesen QR-Code am Eingang. Einmalige Verwendung — Ticket kann nicht wiederverwendet werden.",
    invitation: "Eingeladener Gast",
    support: "Support",
  },
  fr: {
    ticket: "Billet",
    date: "Date",
    venue: "Lieu",
    attendee: "Participant·e",
    tierLabel: "Type de billet",
    scanTitle: "À présenter à l'entrée",
    scanText:
      "Montrez ce code QR à l'entrée. Usage unique — le billet ne peut pas être réutilisé.",
    invitation: "Invité·e",
    support: "Assistance",
  },
};

export function TicketPdf(props: TicketPdfProps) {
  const t = TRANSLATIONS[props.locale];
  const primary = props.primaryColor || DEFAULT_COLORS.primary;
  const brandName = props.brandName || "DBC Germany";
  const legalName = props.legalName || "DBC Germany";
  const supportEmail = props.supportEmail || "info@dbc-germany.com";

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
        <View
          style={[
            styles.header,
            { borderBottom: `2pt solid ${primary}` },
          ]}
        >
          <View style={styles.brandStack}>
            {props.logoUrl && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={props.logoUrl} style={styles.logoImage} />
            )}
            <Text style={[styles.brandName, { color: primary }]}>
              {brandName.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.ticketLabel}>{t.ticket}</Text>
            <Text style={styles.ticketNumber}>
              {props.ticketToken.slice(0, 8).toUpperCase()}
            </Text>
            {props.isInvitation && (
              <Text
                style={[
                  styles.invitationBadge,
                  { backgroundColor: primary, color: "#ffffff" },
                ]}
              >
                {t.invitation}
              </Text>
            )}
          </View>
        </View>

        {/* Event */}
        <Text style={[styles.eventType, { color: primary }]}>
          {props.eventType}
        </Text>
        <Text style={styles.eventTitle}>{props.eventTitle}</Text>
        <View style={[styles.accentBar, { backgroundColor: primary }]} />

        {/* Info */}
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

        {/* Attendee — name prominent */}
        <View style={styles.attendeeSection}>
          <Text style={styles.infoLabel}>{t.attendee}</Text>
          <Text style={styles.attendeeName}>{props.attendeeName}</Text>
          <Text style={styles.infoSubvalue}>{props.attendeeEmail}</Text>
          <View style={{ height: 10 }} />
          <Text style={styles.infoLabel}>{t.tierLabel}</Text>
          <Text style={styles.infoValue}>{props.tierName}</Text>
        </View>

        {/* QR */}
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
          <Text style={styles.footerText}>
            {legalName} · {t.support}: {supportEmail}
          </Text>
          <Text style={styles.footerText}>
            #{props.ticketToken.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
