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
  paid: "#16a34a",
  overdue: "#dc2626",
  dueSoon: "#d97706",
  scheduled: "#6b7280",
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
  summary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 10,
    backgroundColor: C.bgSubtle,
  },
  summaryLabel: {
    fontSize: 7,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
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
  colDesc: { flex: 4 },
  colVendor: { flex: 2 },
  colDue: { width: 70 },
  colStatus: { width: 70 },
  colAmount: { width: 70, textAlign: "right" },
  thText: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: C.textMuted,
    fontWeight: "bold",
  },
  tdText: { fontSize: 9 },
  tdMuted: { fontSize: 8, color: C.textMuted },
  statusPill: {
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subtotalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: C.bgSubtle,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  subtotalLabel: { flex: 1, fontSize: 9, fontWeight: "bold" },
  subtotalAmount: { width: 70, fontSize: 9, fontWeight: "bold", textAlign: "right" },
  grandTotal: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: C.primary,
    marginTop: 12,
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  grandTotalAmount: {
    width: 100,
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
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
    title: "BUDGET PLAN",
    description: "Description",
    vendor: "Vendor",
    due: "Due",
    status: "Status",
    amount: "Amount",
    subtotal: "Subtotal",
    grandTotal: "Total",
    paid: "Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    s_paid: "Paid",
    s_overdue: "Overdue",
    s_due_soon: "Due soon",
    s_scheduled: "Scheduled",
    generatedAt: "Generated",
    noVendor: "—",
    cat_venue: "Venue",
    cat_catering: "Catering",
    cat_av: "AV",
    cat_marketing: "Marketing",
    cat_staffing: "Staffing",
    cat_decoration: "Decoration",
    cat_logistics: "Logistics",
    cat_other: "Other",
  },
  de: {
    title: "BUDGETPLAN",
    description: "Beschreibung",
    vendor: "Lieferant",
    due: "Fällig",
    status: "Status",
    amount: "Betrag",
    subtotal: "Zwischensumme",
    grandTotal: "Gesamt",
    paid: "Bezahlt",
    unpaid: "Offen",
    overdue: "Überfällig",
    s_paid: "Bezahlt",
    s_overdue: "Überfällig",
    s_due_soon: "Bald fällig",
    s_scheduled: "Geplant",
    generatedAt: "Erstellt",
    noVendor: "—",
    cat_venue: "Veranstaltungsort",
    cat_catering: "Catering",
    cat_av: "Technik",
    cat_marketing: "Marketing",
    cat_staffing: "Personal",
    cat_decoration: "Dekoration",
    cat_logistics: "Logistik",
    cat_other: "Sonstiges",
  },
  fr: {
    title: "PLAN BUDGÉTAIRE",
    description: "Description",
    vendor: "Fournisseur",
    due: "Échéance",
    status: "Statut",
    amount: "Montant",
    subtotal: "Sous-total",
    grandTotal: "Total",
    paid: "Payé",
    unpaid: "À payer",
    overdue: "En retard",
    s_paid: "Payé",
    s_overdue: "En retard",
    s_due_soon: "Bientôt",
    s_scheduled: "Programmé",
    generatedAt: "Généré",
    noVendor: "—",
    cat_venue: "Lieu",
    cat_catering: "Restauration",
    cat_av: "Audiovisuel",
    cat_marketing: "Marketing",
    cat_staffing: "Personnel",
    cat_decoration: "Décoration",
    cat_logistics: "Logistique",
    cat_other: "Autres",
  },
} as const;

// NEVER add `notes` (internal staff-only) to this shape or render it
// below. event_expenses.notes is for team-internal follow-ups and is
// deliberately excluded from the exported PDF.
export interface BudgetPdfItem {
  description: string;
  category: string;
  amountCents: number;
  vendor: string | null;
  dueDate: string | null;
  paidAt: string | null;
}

export interface BudgetPdfProps {
  eventTitle: string;
  eventDate: string;
  totalCents: number;
  paidCents: number;
  unpaidCents: number;
  overdueCents: number;
  items: BudgetPdfItem[];
  locale: "en" | "de" | "fr";
  generatedDate: string;
  brandName: string;
  legalName: string;
  supportEmail: string;
  primaryColor?: string;
  logoUrl?: string;
}

type Status = "paid" | "overdue" | "due_soon" | "scheduled";

function statusFor(item: BudgetPdfItem, todayIso: string): Status {
  if (item.paidAt) return "paid";
  if (!item.dueDate) return "scheduled";
  if (item.dueDate < todayIso) return "overdue";
  const soon = new Date(todayIso);
  soon.setUTCDate(soon.getUTCDate() + 7);
  if (item.dueDate <= soon.toISOString().slice(0, 10)) return "due_soon";
  return "scheduled";
}

function statusColor(s: Status): string {
  if (s === "paid") return C.paid;
  if (s === "overdue") return C.overdue;
  if (s === "due_soon") return C.dueSoon;
  return C.scheduled;
}

function fmtEur(cents: number, locale: string): string {
  return (cents / 100).toLocaleString(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function categoryLabel(category: string, t: (typeof T)[keyof typeof T]): string {
  const key = `cat_${category}` as keyof typeof t;
  return t[key] ?? category;
}

export function BudgetPdf(props: BudgetPdfProps) {
  const t = T[props.locale];
  const pc = props.primaryColor || C.primary;
  const todayIso = new Date().toISOString().slice(0, 10);

  // Group by category preserving insertion order from the input list.
  const groups = new Map<string, BudgetPdfItem[]>();
  for (const item of props.items) {
    const arr = groups.get(item.category) ?? [];
    arr.push(item);
    groups.set(item.category, arr);
  }
  const orderedCategories = Array.from(groups.keys()).sort((a, b) => {
    const sumA = groups.get(a)!.reduce((s, x) => s + x.amountCents, 0);
    const sumB = groups.get(b)!.reduce((s, x) => s + x.amountCents, 0);
    return sumB - sumA;
  });

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
            <Text style={s.subtitle}>{props.eventDate}</Text>
          </View>
        </View>

        {/* Summary cards */}
        <View style={s.summary}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>{t.grandTotal}</Text>
            <Text style={s.summaryValue}>
              {fmtEur(props.totalCents, props.locale)}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>{t.paid}</Text>
            <Text style={[s.summaryValue, { color: C.paid }]}>
              {fmtEur(props.paidCents, props.locale)}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>{t.unpaid}</Text>
            <Text style={s.summaryValue}>
              {fmtEur(props.unpaidCents, props.locale)}
            </Text>
          </View>
          <View
            style={
              props.overdueCents > 0
                ? [s.summaryCard, { borderColor: C.overdue, borderWidth: 2 }]
                : s.summaryCard
            }
          >
            <Text style={s.summaryLabel}>{t.overdue}</Text>
            <Text
              style={
                props.overdueCents > 0
                  ? [s.summaryValue, { color: C.overdue }]
                  : s.summaryValue
              }
            >
              {fmtEur(props.overdueCents, props.locale)}
            </Text>
          </View>
        </View>

        {/* Per-category sections */}
        {orderedCategories.map((cat) => {
          const items = groups.get(cat) ?? [];
          const subtotal = items.reduce((sum, x) => sum + x.amountCents, 0);
          return (
            <View key={cat}>
              <Text style={s.sectionTitle}>{categoryLabel(cat, t)}</Text>
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.thText, s.colDesc]}>{t.description}</Text>
                  <Text style={[s.thText, s.colVendor]}>{t.vendor}</Text>
                  <Text style={[s.thText, s.colDue]}>{t.due}</Text>
                  <Text style={[s.thText, s.colStatus]}>{t.status}</Text>
                  <Text style={[s.thText, s.colAmount]}>{t.amount}</Text>
                </View>
                {items.map((item, i) => {
                  const st = statusFor(item, todayIso);
                  const stLabel = t[`s_${st}` as keyof typeof t] ?? st;
                  return (
                    <View
                      key={`${cat}-${i}`}
                      style={s.tableRow}
                      wrap={false}
                    >
                      <Text style={[s.tdText, s.colDesc]}>
                        {item.description}
                      </Text>
                      <Text style={[s.tdMuted, s.colVendor]}>
                        {item.vendor || t.noVendor}
                      </Text>
                      <Text style={[s.tdText, s.colDue]}>
                        {fmtDate(item.paidAt ?? item.dueDate, props.locale)}
                      </Text>
                      <View style={s.colStatus}>
                        <Text
                          style={[
                            s.statusPill,
                            { backgroundColor: statusColor(st) },
                          ]}
                        >
                          {String(stLabel).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[s.tdText, s.colAmount]}>
                        {fmtEur(item.amountCents, props.locale)}
                      </Text>
                    </View>
                  );
                })}
                <View style={s.subtotalRow}>
                  <Text style={s.subtotalLabel}>{t.subtotal}</Text>
                  <Text style={s.subtotalAmount}>
                    {fmtEur(subtotal, props.locale)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Grand total */}
        <View style={[s.grandTotal, { backgroundColor: pc }]}>
          <Text style={s.grandTotalLabel}>{t.grandTotal}</Text>
          <Text style={s.grandTotalAmount}>
            {fmtEur(props.totalCents, props.locale)}
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {props.legalName} {"·"} {props.supportEmail}
          </Text>
          <Text style={s.footerText}>
            {t.generatedAt}: {props.generatedDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
