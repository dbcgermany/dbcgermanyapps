import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const C = {
  primary: "#c8102e",
  text: "#111111",
  textMuted: "#737373",
  border: "#e5e5e5",
  bg: "#ffffff",
  bgSubtle: "#fafafa",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    marginBottom: 24,
  },
  brandName: { fontSize: 16, fontWeight: "bold", letterSpacing: 1.5 },
  brandSub: { fontSize: 8, color: C.textMuted, marginTop: 2 },
  title: { fontSize: 22, fontWeight: "bold", color: C.primary },
  metaBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaCol: { width: "48%" },
  metaLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.textMuted,
    marginBottom: 2,
  },
  metaValue: { fontSize: 10, marginBottom: 8 },
  table: { marginTop: 8, marginBottom: 20 },
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
  colDate: { flex: 2 },
  colDesc: { flex: 4 },
  colAmount: { flex: 2, textAlign: "right" },
  thText: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: C.textMuted,
    fontWeight: "bold",
  },
  tdText: { fontSize: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  summaryLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 12,
    color: C.textMuted,
  },
  summaryValue: { width: 80, textAlign: "right" },
  summaryBold: { fontWeight: "bold", fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  footerText: { fontSize: 8, color: C.textMuted },
  note: {
    fontSize: 9,
    color: C.textMuted,
    fontStyle: "italic",
    marginTop: 16,
  },
});

const T = {
  en: {
    statement: "AFFILIATE STATEMENT",
    statementNo: "Statement #",
    date: "Date",
    payee: "Payee",
    period: "Period",
    bankReference: "Bank reference",
    paymentDate: "Payment date",
    eventColumn: "Event",
    dateColumn: "Date",
    amountColumn: "Amount",
    description: "Description",
    total: "Total",
    note: "Payment is by bank transfer. Any questions, contact us at the address below.",
    footer: "DBC Germany UG (haftungsbeschränkt) · Affiliate Statement",
  },
  de: {
    statement: "AFFILIATE-AUSTELLUNG",
    statementNo: "Aufstellungs-Nr.",
    date: "Datum",
    payee: "Empfänger",
    period: "Zeitraum",
    bankReference: "Bankreferenz",
    paymentDate: "Zahlungsdatum",
    eventColumn: "Veranstaltung",
    dateColumn: "Datum",
    amountColumn: "Betrag",
    description: "Beschreibung",
    total: "Gesamt",
    note: "Zahlung per Banküberweisung. Bei Fragen kontaktiere uns unter der unten genannten Adresse.",
    footer: "DBC Germany UG (haftungsbeschränkt) · Affiliate-Aufstellung",
  },
  fr: {
    statement: "RELEVÉ D'AFFILIATION",
    statementNo: "Relevé n°",
    date: "Date",
    payee: "Bénéficiaire",
    period: "Période",
    bankReference: "Référence bancaire",
    paymentDate: "Date de paiement",
    eventColumn: "Événement",
    dateColumn: "Date",
    amountColumn: "Montant",
    description: "Description",
    total: "Total",
    note: "Paiement par virement bancaire. Pour toute question, contactez-nous à l'adresse ci-dessous.",
    footer: "DBC Germany UG (haftungsbeschränkt) · Relevé d'affiliation",
  },
} as const;

export interface StatementLineItem {
  date: string;
  description: string;
  amount_formatted: string;
}

export interface StatementPdfProps {
  locale: "en" | "de" | "fr";
  statementNumber: string;
  payeeName: string;
  payeeEmail: string;
  periodLabel: string;
  totalFormatted: string;
  paymentReference: string | null;
  paymentDate: string | null;
  lineItems: StatementLineItem[];
}

export function StatementPdf(props: StatementPdfProps) {
  const t = T[props.locale];
  const today = new Date().toLocaleDateString(
    props.locale === "de" ? "de-DE" : props.locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>DBC GERMANY</Text>
            <Text style={s.brandSub}>Affiliate Program</Text>
          </View>
          <Text style={s.title}>{t.statement}</Text>
        </View>

        <View style={s.metaBlock}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>{t.payee}</Text>
            <Text style={s.metaValue}>{props.payeeName}</Text>
            <Text style={s.metaValue}>{props.payeeEmail}</Text>
          </View>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>{t.statementNo}</Text>
            <Text style={s.metaValue}>{props.statementNumber}</Text>
            <Text style={s.metaLabel}>{t.date}</Text>
            <Text style={s.metaValue}>{today}</Text>
            <Text style={s.metaLabel}>{t.period}</Text>
            <Text style={s.metaValue}>{props.periodLabel}</Text>
            {props.paymentReference && (
              <>
                <Text style={s.metaLabel}>{t.bankReference}</Text>
                <Text style={s.metaValue}>{props.paymentReference}</Text>
              </>
            )}
            {props.paymentDate && (
              <>
                <Text style={s.metaLabel}>{t.paymentDate}</Text>
                <Text style={s.metaValue}>{props.paymentDate}</Text>
              </>
            )}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDate]}>{t.dateColumn}</Text>
            <Text style={[s.thText, s.colDesc]}>{t.description}</Text>
            <Text style={[s.thText, s.colAmount]}>{t.amountColumn}</Text>
          </View>
          {props.lineItems.map((li, idx) => (
            <View key={idx} style={s.tableRow}>
              <Text style={[s.tdText, s.colDate]}>{li.date}</Text>
              <Text style={[s.tdText, s.colDesc]}>{li.description}</Text>
              <Text style={[s.tdText, s.colAmount]}>{li.amount_formatted}</Text>
            </View>
          ))}
        </View>

        <View style={s.summaryRow}>
          <Text style={[s.summaryLabel, s.summaryBold]}>{t.total}</Text>
          <Text style={[s.summaryValue, s.summaryBold]}>
            {props.totalFormatted}
          </Text>
        </View>

        <Text style={s.note}>{t.note}</Text>

        <View style={s.footer}>
          <Text style={s.footerText}>{t.footer}</Text>
        </View>
      </Page>
    </Document>
  );
}
