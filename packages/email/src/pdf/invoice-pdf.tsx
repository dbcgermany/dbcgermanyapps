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
};

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, padding: 50, fontFamily: "Helvetica", fontSize: 10, color: C.text },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: C.primary, marginBottom: 24 },
  brandStack: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 32, height: 32 },
  brandName: { fontSize: 16, fontWeight: "bold", letterSpacing: 1.5 },
  brandSub: { fontSize: 8, color: C.textMuted, marginTop: 2 },
  invoiceTitle: { fontSize: 22, fontWeight: "bold", color: C.primary },
  metaBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaCol: { width: "48%" },
  metaLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8, color: C.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 10, marginBottom: 8 },
  table: { marginTop: 8, marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: C.bgSubtle, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6, paddingHorizontal: 8 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  thText: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: C.textMuted, fontWeight: "bold" },
  tdText: { fontSize: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  summaryLabel: { width: 120, textAlign: "right", paddingRight: 12, color: C.textMuted },
  summaryValue: { width: 80, textAlign: "right" },
  summaryBold: { fontWeight: "bold", fontSize: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 12 },
  footer: { position: "absolute", bottom: 40, left: 50, right: 50, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  footerText: { fontSize: 8, color: C.textMuted },
  note: { fontSize: 9, color: C.textMuted, fontStyle: "italic", marginTop: 16 },
});

const T = {
  en: {
    invoice: "INVOICE",
    invoiceNo: "Invoice #",
    date: "Date",
    billTo: "Bill to",
    event: "Event",
    paymentMethod: "Payment method",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    vatLabel: "VAT ({rate}%)",
    grandTotal: "Total",
    thankYou: "Thank you for your purchase.",
    bankNote: "Please transfer the amount to the bank account below:",
  },
  de: {
    invoice: "RECHNUNG",
    invoiceNo: "Rechnungsnr.",
    date: "Datum",
    billTo: "Rechnungsadresse",
    event: "Veranstaltung",
    paymentMethod: "Zahlungsweise",
    description: "Beschreibung",
    qty: "Anz.",
    unitPrice: "Einzelpreis",
    total: "Gesamt",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    vatLabel: "MwSt. ({rate}%)",
    grandTotal: "Gesamtbetrag",
    thankYou: "Vielen Dank f\u00FCr Ihren Einkauf.",
    bankNote: "Bitte \u00FCberweisen Sie den Betrag auf das folgende Konto:",
  },
  fr: {
    invoice: "FACTURE",
    invoiceNo: "Facture n\u00B0",
    date: "Date",
    billTo: "Facturer \u00E0",
    event: "\u00C9v\u00E9nement",
    paymentMethod: "Mode de paiement",
    description: "Description",
    qty: "Qt\u00E9",
    unitPrice: "Prix unit.",
    total: "Total",
    subtotal: "Sous-total",
    discount: "R\u00E9duction",
    vatLabel: "TVA ({rate}%)",
    grandTotal: "Total",
    thankYou: "Merci pour votre achat.",
    bankNote: "Veuillez transf\u00E9rer le montant sur le compte ci-dessous :",
  },
};

export interface InvoicePdfProps {
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  lineItems: { description: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  taxRatePct: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: string | null;
  locale: "en" | "de" | "fr";
  brandName: string;
  legalName: string;
  companyAddress: string;
  supportEmail: string;
  logoUrl?: string;
  primaryColor?: string;
  bankDetails?: string;
}

export function InvoicePdf(props: InvoicePdfProps) {
  const t = T[props.locale];
  const pc = props.primaryColor || C.primary;

  function fmt(cents: number) {
    return `${props.currency === "EUR" ? "\u20AC" : props.currency} ${(cents / 100).toFixed(2)}`;
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: pc }]}>
          <View style={s.brandStack}>
            {props.logoUrl && <Image src={props.logoUrl} style={s.logo} />}
            <View>
              <Text style={[s.brandName, { color: pc }]}>{props.brandName.toUpperCase()}</Text>
              <Text style={s.brandSub}>{props.legalName}</Text>
            </View>
          </View>
          <Text style={[s.invoiceTitle, { color: pc }]}>{t.invoice}</Text>
        </View>

        {/* Meta */}
        <View style={s.metaBlock}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>{t.invoiceNo}</Text>
            <Text style={s.metaValue}>{props.invoiceNumber}</Text>
            <Text style={s.metaLabel}>{t.date}</Text>
            <Text style={s.metaValue}>{props.invoiceDate}</Text>
            <Text style={s.metaLabel}>{t.paymentMethod}</Text>
            <Text style={s.metaValue}>{props.paymentMethod || "\u2014"}</Text>
          </View>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>{t.billTo}</Text>
            <Text style={s.metaValue}>{props.buyerName}</Text>
            <Text style={[s.metaValue, { color: C.textMuted }]}>{props.buyerEmail}</Text>
            <Text style={s.metaLabel}>{t.event}</Text>
            <Text style={s.metaValue}>{props.eventTitle}</Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>{t.description}</Text>
            <Text style={[s.thText, s.colQty]}>{t.qty}</Text>
            <Text style={[s.thText, s.colPrice]}>{t.unitPrice}</Text>
            <Text style={[s.thText, s.colTotal]}>{t.total}</Text>
          </View>
          {props.lineItems.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tdText, s.colDesc]}>{item.description}</Text>
              <Text style={[s.tdText, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.tdText, s.colPrice]}>{fmt(item.unitPriceCents)}</Text>
              <Text style={[s.tdText, s.colTotal]}>{fmt(item.unitPriceCents * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.divider} />
        <View style={s.summaryRow}>
          <Text style={[s.tdText, s.summaryLabel]}>{t.subtotal}</Text>
          <Text style={[s.tdText, s.summaryValue]}>{fmt(props.subtotalCents)}</Text>
        </View>
        {props.discountCents > 0 && (
          <View style={s.summaryRow}>
            <Text style={[s.tdText, s.summaryLabel]}>{t.discount}</Text>
            <Text style={[s.tdText, s.summaryValue]}>-{fmt(props.discountCents)}</Text>
          </View>
        )}
        {props.taxRatePct > 0 && (
          <View style={s.summaryRow}>
            <Text style={[s.tdText, s.summaryLabel]}>
              {t.vatLabel.replace("{rate}", String(props.taxRatePct))}
            </Text>
            <Text style={[s.tdText, s.summaryValue]}>{fmt(props.taxCents)}</Text>
          </View>
        )}
        <View style={s.divider} />
        <View style={s.summaryRow}>
          <Text style={[s.tdText, s.summaryLabel, s.summaryBold]}>{t.grandTotal}</Text>
          <Text style={[s.tdText, s.summaryValue, s.summaryBold]}>{fmt(props.totalCents)}</Text>
        </View>

        {/* Bank details for bank_transfer */}
        {props.paymentMethod === "bank_transfer" && props.bankDetails && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.note}>{t.bankNote}</Text>
            <Text style={[s.tdText, { marginTop: 6 }]}>{props.bankDetails}</Text>
          </View>
        )}

        <Text style={s.note}>{t.thankYou}</Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {props.legalName} {"\u00B7"} {props.supportEmail} {"\u00B7"} {props.companyAddress}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
