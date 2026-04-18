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
  pending: "#737373",
  inProgress: "#d4a017",
  done: "#16a34a",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    marginBottom: 16,
  },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 30, height: 30 },
  brandName: { fontSize: 14, fontWeight: "bold", letterSpacing: 1.5 },
  brandSub: { fontSize: 7, color: C.textMuted, marginTop: 2 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.bgSubtle,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colTime: { width: 80 },
  colTitle: { flex: 3 },
  colAssignee: { flex: 2 },
  colLocation: { flex: 2 },
  colDuration: { width: 60, textAlign: "right" },
  colStatus: { width: 70, textAlign: "center" },
  thText: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: C.textMuted,
    fontWeight: "bold",
  },
  tdText: { fontSize: 9 },
  tdMuted: { fontSize: 8, color: C.textMuted, marginTop: 2 },
  statusPill: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.textMuted },
});

const T = {
  en: {
    title: "RUN SHEET",
    time: "Time",
    task: "Task",
    assignee: "Assignee",
    location: "Location",
    duration: "Duration",
    status: "Status",
    pending: "Pending",
    in_progress: "Active",
    done: "Done",
    unassigned: "—",
    min: "min",
    generatedAt: "Generated",
  },
  de: {
    title: "ABLAUFPLAN",
    time: "Zeit",
    task: "Aufgabe",
    assignee: "Zust\u00E4ndig",
    location: "Ort",
    duration: "Dauer",
    status: "Status",
    pending: "Offen",
    in_progress: "Aktiv",
    done: "Erledigt",
    unassigned: "\u2014",
    min: "Min",
    generatedAt: "Erstellt",
  },
  fr: {
    title: "FEUILLE DE ROUTE",
    time: "Heure",
    task: "T\u00E2che",
    assignee: "Responsable",
    location: "Lieu",
    duration: "Dur\u00E9e",
    status: "Statut",
    pending: "En attente",
    in_progress: "En cours",
    done: "Termin\u00E9",
    unassigned: "\u2014",
    min: "min",
    generatedAt: "G\u00E9n\u00E9r\u00E9",
  },
};

export interface RunsheetPdfItem {
  startsAt: string;
  endsAt: string | null;
  title: string;
  description?: string | null;
  assigneeName?: string | null;
  locationNote?: string | null;
  durationMinutes?: number | null;
  status: string;
}

export interface RunsheetPdfProps {
  eventTitle: string;
  eventDate: string;
  eventVenue?: string;
  items: RunsheetPdfItem[];
  locale: "en" | "de" | "fr";
  generatedDate: string;
  brandName: string;
  legalName: string;
  supportEmail: string;
  primaryColor?: string;
  logoUrl?: string;
}

function fmtTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status: string): string {
  if (status === "done") return C.done;
  if (status === "in_progress") return C.inProgress;
  return C.pending;
}

export function RunsheetPdf(props: RunsheetPdfProps) {
  const t = T[props.locale];
  const pc = props.primaryColor || C.primary;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
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
              {props.eventDate}
              {props.eventVenue ? ` \u00B7 ${props.eventVenue}` : ""}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colTime]}>{t.time}</Text>
            <Text style={[s.thText, s.colTitle]}>{t.task}</Text>
            <Text style={[s.thText, s.colAssignee]}>{t.assignee}</Text>
            <Text style={[s.thText, s.colLocation]}>{t.location}</Text>
            <Text style={[s.thText, s.colDuration]}>{t.duration}</Text>
            <Text style={[s.thText, s.colStatus]}>{t.status}</Text>
          </View>
          {props.items.map((item, i) => {
            const statusKey = item.status as keyof typeof t;
            const statusLabel = t[statusKey] ?? item.status;
            return (
              <View key={i} style={s.tableRow} wrap={false}>
                <View style={s.colTime}>
                  <Text style={s.tdText}>{fmtTime(item.startsAt, props.locale)}</Text>
                  {item.endsAt && (
                    <Text style={s.tdMuted}>
                      \u2013 {fmtTime(item.endsAt, props.locale)}
                    </Text>
                  )}
                </View>
                <View style={s.colTitle}>
                  <Text style={s.tdText}>{item.title}</Text>
                  {item.description && (
                    <Text style={s.tdMuted}>{item.description}</Text>
                  )}
                </View>
                <Text style={[s.tdText, s.colAssignee]}>
                  {item.assigneeName || t.unassigned}
                </Text>
                <Text style={[s.tdText, s.colLocation]}>
                  {item.locationNote || t.unassigned}
                </Text>
                <Text style={[s.tdText, s.colDuration]}>
                  {item.durationMinutes != null
                    ? `${item.durationMinutes} ${t.min}`
                    : "\u2014"}
                </Text>
                <View style={s.colStatus}>
                  <Text
                    style={[s.statusPill, { backgroundColor: statusColor(item.status) }]}
                  >
                    {String(statusLabel).toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {props.legalName} {"\u00B7"} {props.supportEmail}
          </Text>
          <Text style={s.footerText}>
            {t.generatedAt}: {props.generatedDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
