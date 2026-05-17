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
  textSubtle: "#a3a3a3",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
  accent: "#fef2f2",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    marginBottom: 22,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  brandName: { fontSize: 12, fontWeight: "bold", letterSpacing: 1.5 },
  brandSub: { fontSize: 6.5, color: C.textMuted, marginTop: 1 },
  headerMeta: { alignItems: "flex-end" },
  headerMetaText: { fontSize: 7, color: C.textMuted },

  // Cover page
  coverEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 1.15,
    marginBottom: 18,
  },
  coverLead: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 1.5,
    marginBottom: 28,
    maxWidth: 420,
  },
  coverEventCard: {
    backgroundColor: C.bgSubtle,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    padding: 16,
    marginBottom: 26,
  },
  coverEventName: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  coverEventMeta: { fontSize: 10, color: C.textMuted, marginBottom: 2 },
  coverAttendee: { fontSize: 11, fontWeight: "bold", marginTop: 10 },
  coverAttendeeLabel: {
    fontSize: 7,
    letterSpacing: 1,
    color: C.textMuted,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 4,
  },
  coverChecklistTitle: {
    fontSize: 9,
    letterSpacing: 1,
    color: C.textMuted,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverChecklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  coverChecklistNum: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.primary,
    width: 18,
  },
  coverChecklistText: { fontSize: 10, flex: 1 },

  // Section pages
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: C.primary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 14,
  },
  sectionLead: {
    fontSize: 10,
    color: C.textMuted,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  block: { marginBottom: 14 },
  blockTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  blockBody: { fontSize: 10, lineHeight: 1.5, color: C.text },
  bullet: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.45 },

  // Schedule
  scheduleRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 7,
  },
  scheduleTime: { width: 80, fontSize: 10, fontWeight: "bold" },
  scheduleBody: { flex: 1 },
  scheduleTitle: { fontSize: 10, fontWeight: "bold" },
  scheduleSpeaker: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  schedulePending: {
    fontSize: 10,
    color: C.textMuted,
    fontStyle: "italic",
    padding: 16,
    backgroundColor: C.bgSubtle,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
  },

  // Two-column grid
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 14 },
  col: { flex: 1 },

  // Glossary
  glossaryRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 4,
  },
  glossaryCol: { flex: 1, fontSize: 9, paddingRight: 6 },
  glossaryColEn: { fontWeight: "bold" },
  glossaryHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    paddingBottom: 4,
    marginBottom: 4,
  },
  glossaryHeaderCol: {
    flex: 1,
    fontSize: 7.5,
    fontWeight: "bold",
    letterSpacing: 1,
    color: C.textMuted,
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
  footerText: { fontSize: 7, color: C.textSubtle },
});

const T = {
  en: {
    brandSub: "Briefing Pack",
    coverEyebrow: "Your briefing for the day",
    coverTitle: "What you need to know before Essen.",
    coverLead:
      "A short read so the day works for you. Travel, languages, dress, what to bring, who is in the room.",
    coverAttendeeLabel: "Prepared for",
    coverChecklistTitle: "Inside",
    coverChecklist: [
      "Getting to Essen — train + airport routes",
      "The day at a glance — schedule",
      "Rooms, languages, dress code",
      "Glossary — 20 trilingual terms",
      "Quick reference — support + policy",
    ],

    travelEyebrow: "Section 1",
    travelTitle: "Getting to Essen.",
    travelLead:
      "Essen sits in the middle of the Ruhr, well connected by rail and an hour from three international airports. Plan to arrive the evening before or by 09:00 on the day.",
    travelTrainTitle: "By train",
    travelTrain: [
      "Paris Gare du Nord → Essen Hbf: ~3h 50min via Brussels Midi (Thalys / ICE).",
      "London St Pancras → Essen Hbf: ~5h via Brussels (Eurostar + ICE).",
      "Frankfurt Hbf → Essen Hbf: ~2h direct (ICE).",
      "Berlin Hbf → Essen Hbf: ~4h direct (ICE).",
      "Brussels Midi → Essen Hbf: ~2h 15min (ICE).",
    ],
    travelAirTitle: "By air",
    travelAir: [
      "Düsseldorf (DUS): ~30 min by S-Bahn (S1) to Essen Hbf.",
      "Köln/Bonn (CGN): ~1h by RE to Essen Hbf.",
      "Frankfurt (FRA): ~2h by ICE to Essen Hbf.",
    ],
    travelLocalTitle: "From Essen Hbf to the venue",
    travelLocal:
      "Messe Essen is 2 km south of Essen Hbf. Tram U11 from Essen Hauptbahnhof → Messe Ost / Gruga, ~10 min. Taxi ~10 min. Walking ~25 min.",

    dayEyebrow: "Section 2",
    dayTitle: "The day at a glance.",
    dayLead:
      "Doors open before the main stage. Plan a 30-minute buffer for check-in, coffee, and finding the people you came to find.",
    dayPending:
      "The detailed running order is finalised closer to the date. Ticket-holders receive the full schedule by email 30 days before the event. The outline below holds in the meantime.",
    daySkeletonTitle: "Outline",
    daySkeleton: [
      ["12:00", "Doors + check-in"],
      ["12:30", "Main stage — opening"],
      ["13:30", "Session 1"],
      ["14:30", "Networking break + catering"],
      ["15:00", "Session 2"],
      ["16:00", "Session 3 + closing"],
      ["18:00", "Doors close · dinners (VIP)"],
    ],

    roomsEyebrow: "Section 3",
    roomsTitle: "Rooms, languages, dress code.",
    mainRoomTitle: "Main room",
    mainRoom:
      "Main-stage talks and panels. Capacity 900. Reserved seating for VIP near the stage.",
    breakRoomTitle: "Break room (VIP)",
    breakRoom:
      "Smaller lounge for VIP attendees: catering, networking, and the closing dinners of 8.",
    languagesTitle: "Languages",
    languages:
      "Main stage runs in English with simultaneous interpretation to German and French. Channel numbers are printed on the headset units handed out at the door. Q&A and 1:1 conversations happen in whatever language the room prefers.",
    dressTitle: "Dress code",
    dress:
      "Smart casual. The room is operators, not bankers — show up like you would for a serious working dinner. No suits required, no trainers expected.",
    wifiTitle: "Wi-Fi",
    wifi: "Open Wi-Fi credentials are printed on the lounge wall and on the door of the main room. No login form, no captive portal.",
    bringTitle: "What to bring",
    bring: [
      "Phone with your wallet pass / PDF ticket for door scan.",
      "Photo ID (Messe Essen security may verify name on ticket).",
      "Notebook or laptop — many of the 1:1s happen at standing tables.",
      "Business cards are optional. Most introductions get made digitally.",
    ],

    glossaryEyebrow: "Section 4",
    glossaryTitle: "Glossary.",
    glossaryLead:
      "Twenty terms you will hear in the room, in the three working languages of the day.",
    glossaryHeader: ["English", "Deutsch", "Français"],

    refEyebrow: "Section 5",
    refTitle: "Quick reference.",
    refSupportTitle: "Support",
    refSupportBody:
      "Anything you cannot find in this pack: write to sales@dbc-germany.com or reply to your order email. On the day, the team wears red badges and is at the registration desk.",
    refPolicyTitle: "Refund + transfer policy",
    refPolicyBody:
      "Tickets are non-refundable. If your plans change, you can transfer your ticket to someone else through your account dashboard up to 7 days before the event. After that cutoff, the name on the ticket is final.",
    refChannelTitle: "Class of 2026",
    refChannelBody:
      "Every ticket includes year-round access to the Class of 2026 WhatsApp channel. The invite QR ships with your ticket email; the channel goes live the day before the event.",

    footerLeft: "DBC Germany · Briefing Pack",
    footerRight: "tickets.dbc-germany.com",
  },
  de: {
    brandSub: "Briefing-Mappe",
    coverEyebrow: "Deine Mappe für den Tag",
    coverTitle: "Was du vor Essen wissen musst.",
    coverLead:
      "Eine kurze Lektüre, damit der Tag für dich funktioniert. Anreise, Sprachen, Dresscode, was mitzubringen ist, wer im Raum ist.",
    coverAttendeeLabel: "Vorbereitet für",
    coverChecklistTitle: "Inhalt",
    coverChecklist: [
      "Anreise nach Essen — Bahn + Flughäfen",
      "Der Tag im Überblick — Ablauf",
      "Räume, Sprachen, Dresscode",
      "Glossar — 20 dreisprachige Begriffe",
      "Schnellreferenz — Support + Richtlinien",
    ],

    travelEyebrow: "Abschnitt 1",
    travelTitle: "Anreise nach Essen.",
    travelLead:
      "Essen liegt mitten im Ruhrgebiet, gut an die Bahn angebunden und eine Stunde von drei internationalen Flughäfen entfernt. Plane die Anreise am Vorabend oder spätestens 09:00 am Veranstaltungstag.",
    travelTrainTitle: "Mit der Bahn",
    travelTrain: [
      "Paris Gare du Nord → Essen Hbf: ~3h 50min via Brüssel Midi (Thalys / ICE).",
      "London St Pancras → Essen Hbf: ~5h via Brüssel (Eurostar + ICE).",
      "Frankfurt Hbf → Essen Hbf: ~2h direkt (ICE).",
      "Berlin Hbf → Essen Hbf: ~4h direkt (ICE).",
      "Brüssel Midi → Essen Hbf: ~2h 15min (ICE).",
    ],
    travelAirTitle: "Mit dem Flugzeug",
    travelAir: [
      "Düsseldorf (DUS): ~30 Min mit der S-Bahn (S1) zum Essen Hbf.",
      "Köln/Bonn (CGN): ~1h mit dem RE zum Essen Hbf.",
      "Frankfurt (FRA): ~2h mit dem ICE zum Essen Hbf.",
    ],
    travelLocalTitle: "Vom Essen Hbf zur Veranstaltung",
    travelLocal:
      "Die Messe Essen liegt 2 km südlich des Essen Hbf. Straßenbahn U11 vom Hauptbahnhof → Messe Ost / Gruga, ~10 Min. Taxi ~10 Min. Zu Fuß ~25 Min.",

    dayEyebrow: "Abschnitt 2",
    dayTitle: "Der Tag im Überblick.",
    dayLead:
      "Die Türen öffnen vor der Hauptbühne. Plane 30 Minuten Puffer für Check-in, Kaffee und die Menschen, wegen denen du kommst.",
    dayPending:
      "Das detaillierte Programm wird kurz vor dem Termin finalisiert. Ticketinhaber:innen erhalten den vollständigen Ablauf per E-Mail 30 Tage vorher. Der Rahmen unten gilt bis dahin.",
    daySkeletonTitle: "Rahmen",
    daySkeleton: [
      ["12:00", "Türöffnung + Check-in"],
      ["12:30", "Hauptbühne — Eröffnung"],
      ["13:30", "Session 1"],
      ["14:30", "Networking-Pause + Catering"],
      ["15:00", "Session 2"],
      ["16:00", "Session 3 + Abschluss"],
      ["18:00", "Türen schließen · Dinners (VIP)"],
    ],

    roomsEyebrow: "Abschnitt 3",
    roomsTitle: "Räume, Sprachen, Dresscode.",
    mainRoomTitle: "Hauptraum",
    mainRoom:
      "Vorträge und Panels auf der Hauptbühne. Kapazität 900. Reservierte Plätze für VIP nahe der Bühne.",
    breakRoomTitle: "Break Room (VIP)",
    breakRoom:
      "Kleinere Lounge für VIP-Gäste: Catering, Networking und die abschließenden 8er-Dinners.",
    languagesTitle: "Sprachen",
    languages:
      "Die Hauptbühne läuft auf Englisch mit simultaner Verdolmetschung ins Deutsche und Französische. Die Kanalnummern stehen auf den Kopfhörern, die am Eingang ausgegeben werden. Q&A und 1:1-Gespräche laufen in der Sprache, die der Raum bevorzugt.",
    dressTitle: "Dresscode",
    dress:
      "Smart Casual. Im Raum sind Operator:innen, keine Banker:innen — komm so, wie du zu einem ernsthaften Arbeitsdinner kommen würdest. Kein Anzug nötig, keine Sneaker erwartet.",
    wifiTitle: "WLAN",
    wifi: "Die WLAN-Zugangsdaten hängen an der Lounge-Wand und an der Tür des Hauptraums. Kein Anmeldeformular, kein Captive Portal.",
    bringTitle: "Was mitbringen",
    bring: [
      "Smartphone mit Wallet-Pass / PDF-Ticket für den Einlass-Scan.",
      "Lichtbildausweis (die Messe-Sicherheit kann den Namen auf dem Ticket prüfen).",
      "Notizbuch oder Laptop — viele 1:1s laufen an Stehtischen.",
      "Visitenkarten sind optional. Die meisten Intros laufen digital.",
    ],

    glossaryEyebrow: "Abschnitt 4",
    glossaryTitle: "Glossar.",
    glossaryLead:
      "Zwanzig Begriffe, die im Raum fallen, in den drei Arbeitssprachen des Tages.",
    glossaryHeader: ["English", "Deutsch", "Français"],

    refEyebrow: "Abschnitt 5",
    refTitle: "Schnellreferenz.",
    refSupportTitle: "Support",
    refSupportBody:
      "Was nicht in dieser Mappe steht: Schreibe an sales@dbc-germany.com oder antworte auf deine Bestell-E-Mail. Am Veranstaltungstag trägt das Team rote Badges und steht am Anmeldetresen.",
    refPolicyTitle: "Erstattungs- und Übertragungspolitik",
    refPolicyBody:
      "Tickets sind nicht erstattungsfähig. Wenn sich deine Pläne ändern, kannst du dein Ticket bis 7 Tage vor dem Event über dein Konto an jemand anderen übertragen. Danach ist der Name auf dem Ticket endgültig.",
    refChannelTitle: "Class of 2026",
    refChannelBody:
      "Jedes Ticket enthält ganzjährigen Zugang zum Class-of-2026-WhatsApp-Kanal. Der Einladungs-QR kommt mit deiner Ticket-E-Mail; der Kanal startet am Tag vor dem Event.",

    footerLeft: "DBC Germany · Briefing-Mappe",
    footerRight: "tickets.dbc-germany.com",
  },
  fr: {
    brandSub: "Dossier de briefing",
    coverEyebrow: "Ton dossier pour la journée",
    coverTitle: "Ce qu'il faut savoir avant Essen.",
    coverLead:
      "Une lecture courte pour que la journée fonctionne pour toi. Voyage, langues, dress code, ce qu'il faut emporter, qui est dans la salle.",
    coverAttendeeLabel: "Préparé pour",
    coverChecklistTitle: "Au sommaire",
    coverChecklist: [
      "Arriver à Essen — train + aéroports",
      "La journée d'un coup d'œil — programme",
      "Salles, langues, dress code",
      "Glossaire — 20 termes trilingues",
      "Référence rapide — support + politique",
    ],

    travelEyebrow: "Section 1",
    travelTitle: "Arriver à Essen.",
    travelLead:
      "Essen est au centre de la Ruhr, bien desservie par le rail et à une heure de trois aéroports internationaux. Prévois d'arriver la veille au soir ou avant 09h00 le jour J.",
    travelTrainTitle: "En train",
    travelTrain: [
      "Paris Gare du Nord → Essen Hbf : ~3h 50min via Bruxelles Midi (Thalys / ICE).",
      "London St Pancras → Essen Hbf : ~5h via Bruxelles (Eurostar + ICE).",
      "Frankfurt Hbf → Essen Hbf : ~2h direct (ICE).",
      "Berlin Hbf → Essen Hbf : ~4h direct (ICE).",
      "Bruxelles Midi → Essen Hbf : ~2h 15min (ICE).",
    ],
    travelAirTitle: "En avion",
    travelAir: [
      "Düsseldorf (DUS) : ~30 min en S-Bahn (S1) jusqu'à Essen Hbf.",
      "Cologne/Bonn (CGN) : ~1h en RE jusqu'à Essen Hbf.",
      "Frankfurt (FRA) : ~2h en ICE jusqu'à Essen Hbf.",
    ],
    travelLocalTitle: "D'Essen Hbf au lieu de l'événement",
    travelLocal:
      "Messe Essen est à 2 km au sud de la gare centrale. Tramway U11 depuis Essen Hauptbahnhof → Messe Ost / Gruga, ~10 min. Taxi ~10 min. À pied ~25 min.",

    dayEyebrow: "Section 2",
    dayTitle: "La journée d'un coup d'œil.",
    dayLead:
      "Les portes ouvrent avant la scène principale. Prévois 30 minutes de marge pour le check-in, le café et trouver les personnes pour qui tu es venu·e.",
    dayPending:
      "Le programme détaillé est finalisé peu avant la date. Les détenteurs·trices de billet reçoivent le programme complet par e-mail 30 jours avant l'événement. La trame ci-dessous tient en attendant.",
    daySkeletonTitle: "Trame",
    daySkeleton: [
      ["12:00", "Ouverture des portes + check-in"],
      ["12:30", "Scène principale — ouverture"],
      ["13:30", "Session 1"],
      ["14:30", "Pause networking + restauration"],
      ["15:00", "Session 2"],
      ["16:00", "Session 3 + clôture"],
      ["18:00", "Fermeture des portes · dîners (VIP)"],
    ],

    roomsEyebrow: "Section 3",
    roomsTitle: "Salles, langues, dress code.",
    mainRoomTitle: "Salle principale",
    mainRoom:
      "Conférences et tables rondes sur scène principale. Capacité 900. Places réservées pour les VIP près de la scène.",
    breakRoomTitle: "Break room (VIP)",
    breakRoom:
      "Salon plus petit pour les invité·e·s VIP : restauration, networking et les dîners de 8 en clôture.",
    languagesTitle: "Langues",
    languages:
      "La scène principale est en anglais avec interprétation simultanée vers l'allemand et le français. Les numéros de canaux sont imprimés sur les casques distribués à l'entrée. Q&A et échanges 1:1 se déroulent dans la langue que la salle préfère.",
    dressTitle: "Dress code",
    dress:
      "Smart casual. Dans la salle, ce sont des opérateurs·trices, pas des banquiers·ères — viens comme tu viendrais à un dîner de travail sérieux. Pas besoin de costume, pas de baskets attendues.",
    wifiTitle: "Wi-Fi",
    wifi: "Les identifiants Wi-Fi sont affichés sur le mur du salon et à la porte de la salle principale. Pas de formulaire, pas de portail captif.",
    bringTitle: "Ce qu'il faut emporter",
    bring: [
      "Téléphone avec ton billet wallet / PDF pour le scan à l'entrée.",
      "Pièce d'identité (la sécurité de Messe Essen peut vérifier le nom sur le billet).",
      "Carnet ou ordinateur — beaucoup de 1:1 se font sur des tables hautes.",
      "Cartes de visite optionnelles. La plupart des intros se font en numérique.",
    ],

    glossaryEyebrow: "Section 4",
    glossaryTitle: "Glossaire.",
    glossaryLead:
      "Vingt termes que tu entendras dans la salle, dans les trois langues de travail de la journée.",
    glossaryHeader: ["English", "Deutsch", "Français"],

    refEyebrow: "Section 5",
    refTitle: "Référence rapide.",
    refSupportTitle: "Support",
    refSupportBody:
      "Tout ce qui n'est pas dans ce dossier : écris à sales@dbc-germany.com ou réponds à ton e-mail de commande. Le jour J, l'équipe porte des badges rouges et se tient au guichet d'inscription.",
    refPolicyTitle: "Politique de remboursement et de transfert",
    refPolicyBody:
      "Les billets ne sont pas remboursables. Si tes plans changent, tu peux transférer ton billet à quelqu'un d'autre via ton compte jusqu'à 7 jours avant l'événement. Après cette date, le nom sur le billet est définitif.",
    refChannelTitle: "Class of 2026",
    refChannelBody:
      "Chaque billet inclut l'accès à l'année au canal WhatsApp Class of 2026. Le QR d'invitation arrive avec ton e-mail de billet ; le canal s'active la veille de l'événement.",

    footerLeft: "DBC Germany · Dossier de briefing",
    footerRight: "tickets.dbc-germany.com",
  },
};

// Twenty trilingual terms commonly used in the room.
const GLOSSARY: ReadonlyArray<readonly [string, string, string]> = [
  ["Africa-facing", "Afrika-bezogen", "Tourné·e vers l'Afrique"],
  ["AUM (assets under management)", "Verwaltetes Vermögen", "Actifs sous gestion"],
  ["Bootstrapped", "Eigenfinanziert", "Bootstrappé·e"],
  ["Cap table", "Kapitaltabelle", "Table de capitalisation"],
  ["Cohort", "Kohorte", "Cohorte"],
  ["Dealflow", "Dealflow", "Flux de transactions"],
  ["DFI (development finance)", "Entwicklungsfinanzierung", "Financement du développement"],
  ["Diaspora", "Diaspora", "Diaspora"],
  ["Family office", "Family Office", "Family office"],
  ["Founder", "Gründer:in", "Fondateur·trice"],
  ["GP / General Partner", "GP / Komplementär:in", "GP / Associé·e gérant·e"],
  ["LP / Limited Partner", "LP / Kommanditist:in", "LP / Commanditaire"],
  ["Mentor", "Mentor:in", "Mentor·e"],
  ["Operator", "Operator:in", "Opérateur·trice"],
  ["Pre-seed", "Pre-Seed", "Pré-seed"],
  ["Roadmap", "Fahrplan", "Feuille de route"],
  ["Runway", "Runway", "Marge de trésorerie"],
  ["Series A", "Series A", "Série A"],
  ["Term sheet", "Term Sheet", "Term sheet"],
  ["Warm intro", "Warmes Intro", "Mise en relation tiède"],
];

export interface BriefingPackPdfProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string; // Pre-formatted in correct locale
  eventTime: string; // e.g. "12:00 – 18:00"
  venueName: string;
  venueAddress: string;
  city: string;
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

function Header({
  brandName,
  brandSub,
  logoUrl,
  primaryColor,
  meta,
}: {
  brandName: string;
  brandSub: string;
  logoUrl?: string;
  primaryColor: string;
  meta?: string;
}) {
  return (
    <View style={[s.header, { borderBottomColor: primaryColor }]} fixed>
      <View style={s.brandStack}>
        {logoUrl && <Image src={logoUrl} style={s.logo} />}
        <View>
          <Text style={[s.brandName, { color: primaryColor }]}>
            {brandName.toUpperCase()}
          </Text>
          <Text style={s.brandSub}>{brandSub}</Text>
        </View>
      </View>
      {meta && (
        <View style={s.headerMeta}>
          <Text style={s.headerMetaText}>{meta}</Text>
        </View>
      )}
    </View>
  );
}

function Footer({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{left}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
        `${right} · ${pageNumber}/${totalPages}`
      } />
    </View>
  );
}

export function BriefingPackPdf(props: BriefingPackPdfProps) {
  const t = T[props.locale];
  const brand = props.brandName || "DBC Germany";
  const pc = props.primaryColor || C.primary;
  const meta = `${props.eventDate} · ${props.city}`;

  return (
    <Document>
      {/* ──── Page 1: Cover ─────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header
          brandName={brand}
          brandSub={t.brandSub}
          logoUrl={props.logoUrl}
          primaryColor={pc}
        />
        <Text style={[s.coverEyebrow, { color: pc }]}>{t.coverEyebrow}</Text>
        <Text style={s.coverTitle}>{t.coverTitle}</Text>
        <Text style={s.coverLead}>{t.coverLead}</Text>

        <View style={[s.coverEventCard, { borderLeftColor: pc }]}>
          <Text style={s.coverEventName}>{props.eventTitle}</Text>
          <Text style={s.coverEventMeta}>{props.eventDate} · {props.eventTime}</Text>
          <Text style={s.coverEventMeta}>{props.venueName} · {props.venueAddress}</Text>
          <Text style={s.coverAttendeeLabel}>{t.coverAttendeeLabel}</Text>
          <Text style={s.coverAttendee}>{props.attendeeName}</Text>
        </View>

        <Text style={s.coverChecklistTitle}>{t.coverChecklistTitle}</Text>
        {t.coverChecklist.map((item, i) => (
          <View key={i} style={s.coverChecklistItem}>
            <Text style={s.coverChecklistNum}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={s.coverChecklistText}>{item}</Text>
          </View>
        ))}

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>

      {/* ──── Page 2: Travel ────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header brandName={brand} brandSub={t.brandSub} logoUrl={props.logoUrl} primaryColor={pc} meta={meta} />
        <Text style={[s.sectionEyebrow, { color: pc }]}>{t.travelEyebrow}</Text>
        <Text style={s.sectionTitle}>{t.travelTitle}</Text>
        <Text style={s.sectionLead}>{t.travelLead}</Text>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.travelTrainTitle}</Text>
            {t.travelTrain.map((line, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>·</Text>
                <Text style={s.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.travelAirTitle}</Text>
            {t.travelAir.map((line, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>·</Text>
                <Text style={s.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.travelLocalTitle}</Text>
          <Text style={s.blockBody}>{t.travelLocal}</Text>
        </View>

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>

      {/* ──── Page 3: The day ───────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header brandName={brand} brandSub={t.brandSub} logoUrl={props.logoUrl} primaryColor={pc} meta={meta} />
        <Text style={[s.sectionEyebrow, { color: pc }]}>{t.dayEyebrow}</Text>
        <Text style={s.sectionTitle}>{t.dayTitle}</Text>
        <Text style={s.sectionLead}>{t.dayLead}</Text>

        <View style={s.block}>
          <Text style={s.schedulePending}>{t.dayPending}</Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.daySkeletonTitle}</Text>
          {t.daySkeleton.map(([time, title], i) => (
            <View key={i} style={s.scheduleRow}>
              <Text style={s.scheduleTime}>{time}</Text>
              <View style={s.scheduleBody}>
                <Text style={s.scheduleTitle}>{title}</Text>
              </View>
            </View>
          ))}
        </View>

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>

      {/* ──── Page 4: Rooms / languages / dress ─────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header brandName={brand} brandSub={t.brandSub} logoUrl={props.logoUrl} primaryColor={pc} meta={meta} />
        <Text style={[s.sectionEyebrow, { color: pc }]}>{t.roomsEyebrow}</Text>
        <Text style={s.sectionTitle}>{t.roomsTitle}</Text>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.mainRoomTitle}</Text>
            <Text style={s.blockBody}>{t.mainRoom}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.breakRoomTitle}</Text>
            <Text style={s.blockBody}>{t.breakRoom}</Text>
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.languagesTitle}</Text>
          <Text style={s.blockBody}>{t.languages}</Text>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.dressTitle}</Text>
            <Text style={s.blockBody}>{t.dress}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.blockTitle}>{t.wifiTitle}</Text>
            <Text style={s.blockBody}>{t.wifi}</Text>
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.bringTitle}</Text>
          {t.bring.map((line, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>

      {/* ──── Page 5: Glossary ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header brandName={brand} brandSub={t.brandSub} logoUrl={props.logoUrl} primaryColor={pc} meta={meta} />
        <Text style={[s.sectionEyebrow, { color: pc }]}>{t.glossaryEyebrow}</Text>
        <Text style={s.sectionTitle}>{t.glossaryTitle}</Text>
        <Text style={s.sectionLead}>{t.glossaryLead}</Text>

        <View style={s.glossaryHeader}>
          <Text style={s.glossaryHeaderCol}>{t.glossaryHeader[0]}</Text>
          <Text style={s.glossaryHeaderCol}>{t.glossaryHeader[1]}</Text>
          <Text style={s.glossaryHeaderCol}>{t.glossaryHeader[2]}</Text>
        </View>

        {GLOSSARY.map(([en, de, fr], i) => (
          <View key={i} style={s.glossaryRow}>
            <Text style={[s.glossaryCol, s.glossaryColEn]}>{en}</Text>
            <Text style={s.glossaryCol}>{de}</Text>
            <Text style={s.glossaryCol}>{fr}</Text>
          </View>
        ))}

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>

      {/* ──── Page 6: Quick reference ───────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header brandName={brand} brandSub={t.brandSub} logoUrl={props.logoUrl} primaryColor={pc} meta={meta} />
        <Text style={[s.sectionEyebrow, { color: pc }]}>{t.refEyebrow}</Text>
        <Text style={s.sectionTitle}>{t.refTitle}</Text>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.refSupportTitle}</Text>
          <Text style={s.blockBody}>{t.refSupportBody}</Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.refPolicyTitle}</Text>
          <Text style={s.blockBody}>{t.refPolicyBody}</Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>{t.refChannelTitle}</Text>
          <Text style={s.blockBody}>{t.refChannelBody}</Text>
        </View>

        <Footer left={t.footerLeft} right={t.footerRight} />
      </Page>
    </Document>
  );
}
