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
  ink: "#0f0f10",
  inkMuted: "#737373",
  inkSubtle: "#a3a3a3",
  border: "#e5e5e5",
  borderSoft: "#f0f0f0",
  paper: "#ffffff",
  parchment: "#fdfcf9",
  chipBg: "#fef2f2",
  navy: "#1a1a1f",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.45,
  },
  // Header (small, every page except cover/back)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 18,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 24, height: 24, objectFit: "contain" },
  brandName: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: C.primary,
  },
  brandSub: {
    fontSize: 6.5,
    color: C.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 1,
  },
  headerRight: {
    fontSize: 7,
    color: C.inkMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerText: { fontSize: 7, color: C.inkSubtle },
  // Cover
  coverPage: {
    backgroundColor: C.primary,
    padding: 48,
    color: "#ffffff",
    fontFamily: "Helvetica",
  },
  coverLogoStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coverLogo: { width: 36, height: 36, objectFit: "contain" },
  coverBrandName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  coverBrandSub: {
    color: "#ffffff",
    opacity: 0.7,
    fontSize: 7,
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: "uppercase",
  },
  coverEyebrow: {
    color: "#ffffff",
    opacity: 0.8,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 220,
  },
  coverTitle: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "bold",
    lineHeight: 1.05,
    marginTop: 12,
    marginBottom: 22,
  },
  coverLead: {
    color: "#ffffff",
    opacity: 0.95,
    fontSize: 11,
    lineHeight: 1.55,
    maxWidth: 460,
    marginBottom: 30,
  },
  coverMetaRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 24,
  },
  coverMetaItem: {
    color: "#ffffff",
    opacity: 0.85,
    fontSize: 9,
  },
  coverFooter: {
    position: "absolute",
    left: 48,
    bottom: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 96,
  },
  coverFooterText: {
    color: "#ffffff",
    opacity: 0.6,
    fontSize: 7,
    letterSpacing: 1,
  },
  // Section divider band (between tier groups, optional)
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  sectionRule: {
    height: 2,
    backgroundColor: C.primary,
    width: 32,
    marginBottom: 14,
  },
  // Full-page card (Title / Platinum)
  fullCard: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  fullCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 24,
  },
  fullCardLogoBox: {
    width: 160,
    height: 120,
    backgroundColor: C.parchment,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fullCardLogo: { maxWidth: 140, maxHeight: 100, objectFit: "contain" },
  fullCardInitialBox: {
    width: 160,
    height: 120,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fullCardInitialText: {
    color: "#ffffff",
    fontSize: 64,
    fontWeight: "bold",
  },
  fullCardName: {
    fontSize: 28,
    fontWeight: "bold",
    color: C.ink,
    marginBottom: 8,
    lineHeight: 1.05,
  },
  fullCardSector: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  fullCardDescription: {
    fontSize: 12,
    lineHeight: 1.6,
    color: C.ink,
    maxWidth: 540,
    marginTop: 6,
  },
  fullCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  fullCardWeb: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.ink,
  },
  fullCardWebLabel: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: C.inkMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  fullCardQrBox: { alignItems: "center" },
  fullCardQr: { width: 88, height: 88 },
  fullCardQrLabel: {
    fontSize: 7,
    color: C.inkMuted,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  // Half-card (Gold) — two per page side by side
  halfRow: {
    flexDirection: "row",
    flex: 1,
    gap: 16,
  },
  halfCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  halfCardLogoBox: {
    height: 64,
    backgroundColor: C.parchment,
    borderWidth: 1,
    borderColor: C.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    padding: 6,
  },
  halfCardLogo: { maxWidth: 130, maxHeight: 50, objectFit: "contain" },
  halfCardInitial: {
    height: 64,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  halfCardInitialText: { color: "#ffffff", fontSize: 32, fontWeight: "bold" },
  halfCardName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  halfCardSector: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  halfCardDescription: {
    fontSize: 9,
    lineHeight: 1.5,
    color: C.ink,
    marginBottom: 10,
  },
  halfCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  halfCardWeb: { fontSize: 8, fontWeight: "bold" },
  halfCardWebLabel: {
    fontSize: 6,
    letterSpacing: 1,
    color: C.inkMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  halfCardQr: { width: 56, height: 56 },
  // Third-card (Silver) — three per page stacked vertically
  thirdCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
    flex: 1,
  },
  thirdLogoBox: {
    width: 80,
    height: 64,
    backgroundColor: C.parchment,
    borderWidth: 1,
    borderColor: C.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  thirdLogo: { maxWidth: 68, maxHeight: 52, objectFit: "contain" },
  thirdInitial: {
    width: 80,
    height: 64,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  thirdInitialText: { color: "#ffffff", fontSize: 28, fontWeight: "bold" },
  thirdBody: { flex: 1 },
  thirdName: { fontSize: 13, fontWeight: "bold", marginBottom: 2 },
  thirdSector: {
    fontSize: 6.5,
    letterSpacing: 1,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  thirdDescription: { fontSize: 8, lineHeight: 1.45, color: C.ink },
  thirdQr: { width: 48, height: 48 },
  // Quarter-card (Bronze) — four per page in 2x2 grid
  quarterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    flex: 1,
  },
  quarterCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: "column",
  },
  quarterLogoBox: {
    height: 44,
    backgroundColor: C.parchment,
    borderWidth: 1,
    borderColor: C.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    padding: 4,
  },
  quarterLogo: { maxWidth: 100, maxHeight: 36, objectFit: "contain" },
  quarterInitial: {
    height: 44,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quarterInitialText: { color: "#ffffff", fontSize: 20, fontWeight: "bold" },
  quarterName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  quarterSector: {
    fontSize: 6,
    letterSpacing: 1,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  quarterBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  quarterWeb: { fontSize: 7, fontWeight: "bold" },
  quarterQr: { width: 36, height: 36 },
  // Directory listing (Partner / Media)
  dirSection: {
    flex: 1,
  },
  dirRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderSoft,
  },
  dirLogoBox: {
    width: 48,
    height: 36,
    backgroundColor: C.parchment,
    borderWidth: 1,
    borderColor: C.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  dirLogo: { maxWidth: 40, maxHeight: 28, objectFit: "contain" },
  dirInitial: {
    width: 48,
    height: 36,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dirInitialText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  dirBody: { flex: 1 },
  dirName: { fontSize: 11, fontWeight: "bold" },
  dirSector: {
    fontSize: 7,
    color: C.inkMuted,
    marginTop: 1,
  },
  dirWeb: { fontSize: 8, color: C.inkMuted },
  // Back cover (compact closing)
  backCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  backCoverTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: C.ink,
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 380,
    lineHeight: 1.2,
  },
  backCoverLead: {
    fontSize: 11,
    color: C.inkMuted,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.6,
  },
});

const T = {
  en: {
    brandSub: "Sponsors",
    headerRight: "Partners of the room",
    coverEyebrow: "Partners of the room",
    coverTitle: "The brands funding the day.",
    coverLead:
      "One day. One stage. The companies and partners who made it possible to put this room together — listed by the weight they carry in the day. Scan a QR if you want to know more.",
    coverMetaTotal: "{count} partners",
    coverMetaUpdated: "Updated {date}",
    coverFooterLeft: "Richesses d'Afrique Germany 2026",
    coverFooterRight: "tickets.dbc-germany.com",
    sectionTitle: {
      title: "Title partner",
      platinum: "Platinum partners",
      gold: "Gold partners",
      silver: "Silver partners",
      bronze: "Bronze partners",
      partner: "Strategic partners",
      media: "Media partners",
    },
    sectionEyebrow: {
      title: "Section 1",
      platinum: "Section 2",
      gold: "Section 3",
      silver: "Section 4",
      bronze: "Section 5",
      partner: "Section 6",
      media: "Section 7",
    },
    webLabel: "Website",
    qrLabel: "Scan",
    backCoverTitle: "Thank the partners.",
    backCoverLead:
      "If a brand on these pages caught your attention, walk up to their booth, scan their QR, or write to them directly. The room works because they make it work.",
  },
  de: {
    brandSub: "Partner",
    headerRight: "Partner des Raums",
    coverEyebrow: "Partner des Raums",
    coverTitle: "Die Marken, die diesen Tag tragen.",
    coverLead:
      "Ein Tag. Eine Bühne. Die Unternehmen und Partner, die diesen Raum überhaupt möglich gemacht haben — geordnet nach dem Gewicht, das sie an diesem Tag tragen. Scanne einen QR, wenn du mehr wissen willst.",
    coverMetaTotal: "{count} Partner",
    coverMetaUpdated: "Stand {date}",
    coverFooterLeft: "Richesses d'Afrique Germany 2026",
    coverFooterRight: "tickets.dbc-germany.com",
    sectionTitle: {
      title: "Title-Partner",
      platinum: "Platin-Partner",
      gold: "Gold-Partner",
      silver: "Silber-Partner",
      bronze: "Bronze-Partner",
      partner: "Strategische Partner",
      media: "Medienpartner",
    },
    sectionEyebrow: {
      title: "Abschnitt 1",
      platinum: "Abschnitt 2",
      gold: "Abschnitt 3",
      silver: "Abschnitt 4",
      bronze: "Abschnitt 5",
      partner: "Abschnitt 6",
      media: "Abschnitt 7",
    },
    webLabel: "Website",
    qrLabel: "Scan",
    backCoverTitle: "Sag den Partnern Danke.",
    backCoverLead:
      "Wenn eine Marke auf diesen Seiten dein Interesse geweckt hat, geh an ihren Stand, scanne ihren QR oder schreib ihr direkt. Der Raum funktioniert, weil sie ihn möglich machen.",
  },
  fr: {
    brandSub: "Partenaires",
    headerRight: "Partenaires de la salle",
    coverEyebrow: "Partenaires de la salle",
    coverTitle: "Les marques qui portent la journée.",
    coverLead:
      "Un jour. Une scène. Les entreprises et partenaires qui ont rendu cette salle possible — listés par le poids qu'ils portent dans la journée. Scanne un QR si tu veux en savoir plus.",
    coverMetaTotal: "{count} partenaires",
    coverMetaUpdated: "Mis à jour le {date}",
    coverFooterLeft: "Richesses d'Afrique Germany 2026",
    coverFooterRight: "tickets.dbc-germany.com",
    sectionTitle: {
      title: "Partenaire principal",
      platinum: "Partenaires Platinum",
      gold: "Partenaires Gold",
      silver: "Partenaires Silver",
      bronze: "Partenaires Bronze",
      partner: "Partenaires stratégiques",
      media: "Partenaires média",
    },
    sectionEyebrow: {
      title: "Section 1",
      platinum: "Section 2",
      gold: "Section 3",
      silver: "Section 4",
      bronze: "Section 5",
      partner: "Section 6",
      media: "Section 7",
    },
    webLabel: "Site web",
    qrLabel: "Scan",
    backCoverTitle: "Remerciez les partenaires.",
    backCoverLead:
      "Si une marque sur ces pages a attiré ton attention, va à son stand, scanne son QR ou écris-lui directement. La salle fonctionne parce qu'eux la font fonctionner.",
  },
};

export type SponsorTier =
  | "title"
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "partner"
  | "media";

export interface SponsorEntry {
  id: string;
  companyName: string;
  tier: SponsorTier;
  sector?: string | null;
  description?: string | null; // pre-localised by the generator
  logoUrl?: string | null;
  websiteUrl?: string | null;
  qrDataUrl?: string | null; // pre-rendered by the generator
}

export interface SponsorsPdfProps {
  eventTitle: string;
  eventDate: string; // pre-formatted in correct locale
  city: string;
  sponsors: SponsorEntry[];
  locale: "en" | "de" | "fr";
  generatedDate: string; // pre-formatted in correct locale
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
}

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "•";
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function StandardHeader({
  brandName,
  brandSub,
  headerRight,
  logoUrl,
  primaryColor,
}: {
  brandName: string;
  brandSub: string;
  headerRight: string;
  logoUrl?: string;
  primaryColor: string;
}) {
  return (
    <View style={s.header} fixed>
      <View style={s.brandStack}>
        {logoUrl && <Image src={logoUrl} style={s.logo} />}
        <View>
          <Text style={[s.brandName, { color: primaryColor }]}>
            {brandName.toUpperCase()}
          </Text>
          <Text style={s.brandSub}>{brandSub}</Text>
        </View>
      </View>
      <Text style={s.headerRight}>{headerRight}</Text>
    </View>
  );
}

function StandardFooter({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{left}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) =>
          `${right} · ${pageNumber}/${totalPages}`
        }
      />
    </View>
  );
}

function FullCard({
  sponsor,
  webLabel,
  qrLabel,
  primaryColor,
}: {
  sponsor: SponsorEntry;
  webLabel: string;
  qrLabel: string;
  primaryColor: string;
}) {
  return (
    <View style={s.fullCard}>
      <View style={s.fullCardTop}>
        {sponsor.logoUrl ? (
          <View style={s.fullCardLogoBox}>
            <Image src={sponsor.logoUrl} style={s.fullCardLogo} />
          </View>
        ) : (
          <View style={[s.fullCardInitialBox, { backgroundColor: primaryColor }]}>
            <Text style={s.fullCardInitialText}>
              {initial(sponsor.companyName)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.fullCardName}>{sponsor.companyName}</Text>
          {sponsor.sector && (
            <Text style={[s.fullCardSector, { color: primaryColor }]}>
              {sponsor.sector}
            </Text>
          )}
          {sponsor.description && (
            <Text style={s.fullCardDescription}>{sponsor.description}</Text>
          )}
        </View>
      </View>
      <View style={s.fullCardBottom}>
        <View>
          <Text style={s.fullCardWebLabel}>{webLabel}</Text>
          <Text style={s.fullCardWeb}>
            {sponsor.websiteUrl?.replace(/^https?:\/\//, "") ?? ""}
          </Text>
        </View>
        {sponsor.qrDataUrl && (
          <View style={s.fullCardQrBox}>
            <Image src={sponsor.qrDataUrl} style={s.fullCardQr} />
            <Text style={s.fullCardQrLabel}>{qrLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function HalfCard({
  sponsor,
  webLabel,
  primaryColor,
}: {
  sponsor: SponsorEntry;
  webLabel: string;
  primaryColor: string;
}) {
  return (
    <View style={s.halfCard}>
      <View>
        {sponsor.logoUrl ? (
          <View style={s.halfCardLogoBox}>
            <Image src={sponsor.logoUrl} style={s.halfCardLogo} />
          </View>
        ) : (
          <View
            style={[s.halfCardInitial, { backgroundColor: primaryColor }]}
          >
            <Text style={s.halfCardInitialText}>
              {initial(sponsor.companyName)}
            </Text>
          </View>
        )}
        <Text style={s.halfCardName}>{sponsor.companyName}</Text>
        {sponsor.sector && (
          <Text style={[s.halfCardSector, { color: primaryColor }]}>
            {sponsor.sector}
          </Text>
        )}
        {sponsor.description && (
          <Text style={s.halfCardDescription}>{sponsor.description}</Text>
        )}
      </View>
      <View style={s.halfCardBottom}>
        <View>
          <Text style={s.halfCardWebLabel}>{webLabel}</Text>
          <Text style={s.halfCardWeb}>
            {sponsor.websiteUrl?.replace(/^https?:\/\//, "") ?? ""}
          </Text>
        </View>
        {sponsor.qrDataUrl && (
          <Image src={sponsor.qrDataUrl} style={s.halfCardQr} />
        )}
      </View>
    </View>
  );
}

function ThirdCard({
  sponsor,
  primaryColor,
}: {
  sponsor: SponsorEntry;
  primaryColor: string;
}) {
  return (
    <View style={s.thirdCard}>
      {sponsor.logoUrl ? (
        <View style={s.thirdLogoBox}>
          <Image src={sponsor.logoUrl} style={s.thirdLogo} />
        </View>
      ) : (
        <View style={[s.thirdInitial, { backgroundColor: primaryColor }]}>
          <Text style={s.thirdInitialText}>{initial(sponsor.companyName)}</Text>
        </View>
      )}
      <View style={s.thirdBody}>
        <Text style={s.thirdName}>{sponsor.companyName}</Text>
        {sponsor.sector && (
          <Text style={[s.thirdSector, { color: primaryColor }]}>
            {sponsor.sector}
          </Text>
        )}
        {sponsor.description && (
          <Text style={s.thirdDescription}>{sponsor.description}</Text>
        )}
      </View>
      {sponsor.qrDataUrl && (
        <Image src={sponsor.qrDataUrl} style={s.thirdQr} />
      )}
    </View>
  );
}

function QuarterCard({
  sponsor,
  primaryColor,
}: {
  sponsor: SponsorEntry;
  primaryColor: string;
}) {
  return (
    <View style={s.quarterCard}>
      {sponsor.logoUrl ? (
        <View style={s.quarterLogoBox}>
          <Image src={sponsor.logoUrl} style={s.quarterLogo} />
        </View>
      ) : (
        <View style={[s.quarterInitial, { backgroundColor: primaryColor }]}>
          <Text style={s.quarterInitialText}>
            {initial(sponsor.companyName)}
          </Text>
        </View>
      )}
      <Text style={s.quarterName}>{sponsor.companyName}</Text>
      {sponsor.sector && (
        <Text style={[s.quarterSector, { color: primaryColor }]}>
          {sponsor.sector}
        </Text>
      )}
      <View style={s.quarterBottom}>
        <Text style={s.quarterWeb}>
          {sponsor.websiteUrl?.replace(/^https?:\/\//, "") ?? ""}
        </Text>
        {sponsor.qrDataUrl && (
          <Image src={sponsor.qrDataUrl} style={s.quarterQr} />
        )}
      </View>
    </View>
  );
}

function DirectoryRow({
  sponsor,
  primaryColor,
}: {
  sponsor: SponsorEntry;
  primaryColor: string;
}) {
  return (
    <View style={s.dirRow}>
      {sponsor.logoUrl ? (
        <View style={s.dirLogoBox}>
          <Image src={sponsor.logoUrl} style={s.dirLogo} />
        </View>
      ) : (
        <View style={[s.dirInitial, { backgroundColor: primaryColor }]}>
          <Text style={s.dirInitialText}>{initial(sponsor.companyName)}</Text>
        </View>
      )}
      <View style={s.dirBody}>
        <Text style={s.dirName}>{sponsor.companyName}</Text>
        {sponsor.sector && (
          <Text style={s.dirSector}>{sponsor.sector}</Text>
        )}
      </View>
      {sponsor.websiteUrl && (
        <Text style={s.dirWeb}>
          {sponsor.websiteUrl.replace(/^https?:\/\//, "")}
        </Text>
      )}
    </View>
  );
}

function SectionIntro({
  eyebrow,
  title,
  primaryColor,
}: {
  eyebrow: string;
  title: string;
  primaryColor: string;
}) {
  return (
    <View>
      <Text style={[s.sectionEyebrow, { color: primaryColor }]}>{eyebrow}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={[s.sectionRule, { backgroundColor: primaryColor }]} />
    </View>
  );
}

export function SponsorsPdf(props: SponsorsPdfProps) {
  const t = T[props.locale];
  const brand = props.brandName || "DBC Germany";
  const pc = props.primaryColor || C.primary;

  // Group sponsors by tier — order matters; rendering walks this list in order.
  const tierOrder: SponsorTier[] = [
    "title",
    "platinum",
    "gold",
    "silver",
    "bronze",
    "partner",
    "media",
  ];
  const byTier = new Map<SponsorTier, SponsorEntry[]>();
  for (const tier of tierOrder) byTier.set(tier, []);
  for (const sponsor of props.sponsors) {
    byTier.get(sponsor.tier)?.push(sponsor);
  }

  const totalConfirmed = props.sponsors.length;

  return (
    <Document>
      {/* ──── Cover ────────────────────────────────────────────────── */}
      <Page size="A4" style={[s.coverPage, { backgroundColor: pc }]}>
        <View style={s.coverLogoStack}>
          {props.logoUrl && (
            <Image src={props.logoUrl} style={s.coverLogo} />
          )}
          <View>
            <Text style={s.coverBrandName}>{brand.toUpperCase()}</Text>
            <Text style={s.coverBrandSub}>{t.brandSub}</Text>
          </View>
        </View>

        <Text style={s.coverEyebrow}>{t.coverEyebrow}</Text>
        <Text style={s.coverTitle}>{t.coverTitle}</Text>
        <Text style={s.coverLead}>{t.coverLead}</Text>

        <View style={s.coverMetaRow}>
          <Text style={s.coverMetaItem}>
            {t.coverMetaTotal.replace("{count}", String(totalConfirmed))}
          </Text>
          <Text style={s.coverMetaItem}>·</Text>
          <Text style={s.coverMetaItem}>{props.eventTitle}</Text>
          <Text style={s.coverMetaItem}>·</Text>
          <Text style={s.coverMetaItem}>
            {props.eventDate} · {props.city}
          </Text>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.coverFooterText}>{t.coverFooterLeft}</Text>
          <Text style={s.coverFooterText}>
            {t.coverMetaUpdated.replace("{date}", props.generatedDate)}
          </Text>
        </View>
      </Page>

      {/* ──── Title — 1 sponsor, full page ─────────────────────────── */}
      {(byTier.get("title") ?? []).map((sponsor) => (
        <Page key={sponsor.id} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          <SectionIntro
            eyebrow={t.sectionEyebrow.title}
            title={t.sectionTitle.title}
            primaryColor={pc}
          />
          <FullCard
            sponsor={sponsor}
            webLabel={t.webLabel}
            qrLabel={t.qrLabel}
            primaryColor={pc}
          />
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Platinum — full page each ────────────────────────────── */}
      {(byTier.get("platinum") ?? []).map((sponsor, i) => (
        <Page key={sponsor.id} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.platinum}
              title={t.sectionTitle.platinum}
              primaryColor={pc}
            />
          )}
          <FullCard
            sponsor={sponsor}
            webLabel={t.webLabel}
            qrLabel={t.qrLabel}
            primaryColor={pc}
          />
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Gold — 2 per page (half-cards) ───────────────────────── */}
      {chunk(byTier.get("gold") ?? [], 2).map((pageSponsors, i) => (
        <Page key={`gold-${i}`} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.gold}
              title={t.sectionTitle.gold}
              primaryColor={pc}
            />
          )}
          <View style={s.halfRow}>
            {pageSponsors.map((sponsor) => (
              <HalfCard
                key={sponsor.id}
                sponsor={sponsor}
                webLabel={t.webLabel}
                primaryColor={pc}
              />
            ))}
          </View>
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Silver — 3 per page (third-cards) ────────────────────── */}
      {chunk(byTier.get("silver") ?? [], 3).map((pageSponsors, i) => (
        <Page key={`silver-${i}`} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.silver}
              title={t.sectionTitle.silver}
              primaryColor={pc}
            />
          )}
          {pageSponsors.map((sponsor) => (
            <ThirdCard
              key={sponsor.id}
              sponsor={sponsor}
              primaryColor={pc}
            />
          ))}
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Bronze — 4 per page (2x2 quarter-cards) ──────────────── */}
      {chunk(byTier.get("bronze") ?? [], 4).map((pageSponsors, i) => (
        <Page key={`bronze-${i}`} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.bronze}
              title={t.sectionTitle.bronze}
              primaryColor={pc}
            />
          )}
          <View style={s.quarterGrid}>
            {pageSponsors.map((sponsor) => (
              <QuarterCard
                key={sponsor.id}
                sponsor={sponsor}
                primaryColor={pc}
              />
            ))}
          </View>
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Partner — directory listing, 8/page ──────────────────── */}
      {chunk(byTier.get("partner") ?? [], 8).map((pageSponsors, i) => (
        <Page key={`partner-${i}`} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.partner}
              title={t.sectionTitle.partner}
              primaryColor={pc}
            />
          )}
          <View style={s.dirSection}>
            {pageSponsors.map((sponsor) => (
              <DirectoryRow
                key={sponsor.id}
                sponsor={sponsor}
                primaryColor={pc}
              />
            ))}
          </View>
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Media — directory listing, 8/page ────────────────────── */}
      {chunk(byTier.get("media") ?? [], 8).map((pageSponsors, i) => (
        <Page key={`media-${i}`} size="A4" style={s.page}>
          <StandardHeader
            brandName={brand}
            brandSub={t.brandSub}
            headerRight={t.headerRight}
            logoUrl={props.logoUrl}
            primaryColor={pc}
          />
          {i === 0 && (
            <SectionIntro
              eyebrow={t.sectionEyebrow.media}
              title={t.sectionTitle.media}
              primaryColor={pc}
            />
          )}
          <View style={s.dirSection}>
            {pageSponsors.map((sponsor) => (
              <DirectoryRow
                key={sponsor.id}
                sponsor={sponsor}
                primaryColor={pc}
              />
            ))}
          </View>
          <StandardFooter
            left={t.coverFooterLeft}
            right={t.coverFooterRight}
          />
        </Page>
      ))}

      {/* ──── Back cover ───────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <StandardHeader
          brandName={brand}
          brandSub={t.brandSub}
          headerRight={t.headerRight}
          logoUrl={props.logoUrl}
          primaryColor={pc}
        />
        <View style={s.backCover}>
          <Text style={s.backCoverTitle}>{t.backCoverTitle}</Text>
          <Text style={s.backCoverLead}>{t.backCoverLead}</Text>
        </View>
        <StandardFooter
          left={t.coverFooterLeft}
          right={t.coverFooterRight}
        />
      </Page>
    </Document>
  );
}
