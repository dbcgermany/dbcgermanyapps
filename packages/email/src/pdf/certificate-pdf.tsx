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
  ink: "#111111",
  inkMuted: "#737373",
  inkSubtle: "#a3a3a3",
  border: "#e5e5e5",
  paper: "#ffffff",
  parchment: "#fdfcf9",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.parchment,
    padding: 0,
    fontFamily: "Helvetica",
    color: C.ink,
  },
  // Outer decorative frame
  frameOuter: {
    margin: 28,
    padding: 0,
    borderWidth: 2,
    borderColor: C.primary,
    flex: 1,
  },
  frameInner: {
    margin: 6,
    padding: 36,
    borderWidth: 0.5,
    borderColor: C.primary,
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Header band
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, objectFit: "contain" },
  brandName: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
    color: C.primary,
  },
  brandSub: {
    fontSize: 7,
    color: C.inkMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end" },
  certIdLabel: {
    fontSize: 6.5,
    color: C.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  certIdValue: {
    fontSize: 9,
    fontFamily: "Courier",
    color: C.ink,
    marginTop: 2,
  },
  // Body
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: C.primary,
    marginBottom: 14,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: C.inkMuted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 36,
  },
  presentedTo: {
    fontSize: 11,
    color: C.inkMuted,
    marginBottom: 8,
    fontStyle: "italic",
  },
  recipient: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
    color: C.ink,
  },
  recipientUnderline: {
    width: 320,
    height: 1,
    backgroundColor: C.primary,
    marginBottom: 22,
  },
  attended: {
    fontSize: 11,
    color: C.ink,
    textAlign: "center",
    maxWidth: 540,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
    color: C.ink,
  },
  eventMeta: {
    fontSize: 10,
    color: C.inkMuted,
    marginTop: 6,
    textAlign: "center",
  },
  // Signatures
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
  },
  sigBlock: { alignItems: "center", flex: 1 },
  sigLine: {
    width: 180,
    height: 1,
    backgroundColor: C.ink,
    marginBottom: 6,
  },
  sigName: { fontSize: 10, fontWeight: "bold" },
  sigTitle: {
    fontSize: 8,
    color: C.inkMuted,
    marginTop: 2,
    textAlign: "center",
  },
  // Footer note
  footerNote: {
    fontSize: 7,
    color: C.inkSubtle,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 540,
    lineHeight: 1.5,
  },
});

const T = {
  en: {
    brandSub: "Certificate of Participation",
    eyebrow: "Certificate of Participation",
    title: "Issued on attendance.",
    subtitle: "Richesses d'Afrique Germany",
    presentedTo: "This certifies that",
    attendedPrefix: "attended in person",
    attendedAt: "at",
    issuedOn: "Issued",
    sig1Name: "Dr. Jean-Clément Diambilay",
    sig1Title: "Founder, DBC Group",
    sig2Name: "Ruth Bambi",
    sig2Title: "CEO, DBC Germany",
    certIdLabel: "Certificate ID",
    footerNote:
      "Certificate of Participation only. Issued automatically to attendees who checked in at the door. Verification on request to sales@dbc-germany.com.",
  },
  de: {
    brandSub: "Teilnahmebescheinigung",
    eyebrow: "Teilnahmebescheinigung",
    title: "Ausgestellt bei Teilnahme.",
    subtitle: "Richesses d'Afrique Germany",
    presentedTo: "Hiermit wird bestätigt, dass",
    attendedPrefix: "persönlich teilgenommen hat",
    attendedAt: "in",
    issuedOn: "Ausgestellt",
    sig1Name: "Dr. Jean-Clément Diambilay",
    sig1Title: "Gründer, DBC Group",
    sig2Name: "Ruth Bambi",
    sig2Title: "Geschäftsführerin, DBC Germany",
    certIdLabel: "Zertifikat-ID",
    footerNote:
      "Reine Teilnahmebescheinigung. Wird automatisch an Teilnehmer:innen ausgestellt, die am Eingang eingecheckt haben. Verifizierung auf Anfrage an sales@dbc-germany.com.",
  },
  fr: {
    brandSub: "Attestation de participation",
    eyebrow: "Attestation de participation",
    title: "Délivrée à la participation.",
    subtitle: "Richesses d'Afrique Germany",
    presentedTo: "Atteste que",
    attendedPrefix: "a participé en personne",
    attendedAt: "à",
    issuedOn: "Délivré le",
    sig1Name: "Dr. Jean-Clément Diambilay",
    sig1Title: "Fondateur, DBC Group",
    sig2Name: "Ruth Bambi",
    sig2Title: "CEO, DBC Germany",
    certIdLabel: "ID d'attestation",
    footerNote:
      "Attestation de participation uniquement. Délivrée automatiquement aux participant·e·s qui se sont enregistré·e·s à l'entrée. Vérification sur demande à sales@dbc-germany.com.",
  },
};

export interface CertificatePdfProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string; // pre-formatted in correct locale
  venueCity: string;
  certificateId: string; // short visible ID, e.g. ticket_token first 8 chars
  issuedDate: string; // pre-formatted in correct locale
  locale: "en" | "de" | "fr";
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export function CertificatePdf(props: CertificatePdfProps) {
  const t = T[props.locale];
  const brand = props.brandName || "DBC Germany";
  const pc = props.primaryColor || C.primary;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={[s.frameOuter, { borderColor: pc }]}>
          <View style={[s.frameInner, { borderColor: pc }]}>
            {/* Header */}
            <View style={s.header}>
              <View style={s.brandStack}>
                {props.logoUrl && (
                  <Image src={props.logoUrl} style={s.logo} />
                )}
                <View>
                  <Text style={[s.brandName, { color: pc }]}>
                    {brand.toUpperCase()}
                  </Text>
                  <Text style={s.brandSub}>{t.brandSub}</Text>
                </View>
              </View>
              <View style={s.headerRight}>
                <Text style={s.certIdLabel}>{t.certIdLabel}</Text>
                <Text style={s.certIdValue}>
                  {props.certificateId.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Body */}
            <View style={s.body}>
              <Text style={[s.eyebrow, { color: pc }]}>{t.eyebrow}</Text>
              <Text style={s.title}>{t.title}</Text>
              <Text style={s.subtitle}>{t.subtitle}</Text>

              <Text style={s.presentedTo}>{t.presentedTo}</Text>
              <Text style={s.recipient}>{props.attendeeName}</Text>
              <View style={[s.recipientUnderline, { backgroundColor: pc }]} />

              <Text style={s.attended}>
                {t.attendedPrefix}
              </Text>
              <Text style={s.eventTitle}>{props.eventTitle}</Text>
              <Text style={s.eventMeta}>
                {props.eventDate} · {t.attendedAt} {props.venueCity}
              </Text>
            </View>

            {/* Signatures */}
            <View style={s.sigRow}>
              <View style={s.sigBlock}>
                <View style={s.sigLine} />
                <Text style={s.sigName}>{t.sig1Name}</Text>
                <Text style={s.sigTitle}>{t.sig1Title}</Text>
              </View>
              <View style={s.sigBlock}>
                <View style={s.sigLine} />
                <Text style={s.sigName}>{t.sig2Name}</Text>
                <Text style={s.sigTitle}>{t.sig2Title}</Text>
              </View>
            </View>

            <Text style={s.footerNote}>
              {t.footerNote} {"·"} {t.issuedOn}: {props.issuedDate}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
