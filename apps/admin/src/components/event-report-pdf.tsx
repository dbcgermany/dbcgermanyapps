import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  EventReportData,
  EventReportSections,
} from "@/actions/event-report";

const COLORS = {
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
    fontSize: 10,
    color: COLORS.text,
  },
  header: {
    paddingBottom: 12,
    marginBottom: 18,
    borderBottom: `2pt solid #c8102e`,
  },
  brand: { fontSize: 14, fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 6 },
  subtitle: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    flexBasis: "31%",
    padding: 8,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 3,
    backgroundColor: COLORS.bgSubtle,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: { fontSize: 16, fontWeight: "bold", marginTop: 3 },
  table: { marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottom: `0.5pt solid ${COLORS.border}` },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSubtle,
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  th: {
    padding: 6,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: { padding: 6, fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5pt solid ${COLORS.border}`,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: COLORS.textMuted },
});

function formatMoney(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function EventReportPdf({
  locale,
  sections,
  data,
}: {
  locale: string;
  sections: EventReportSections;
  data: EventReportData;
}) {
  const start = new Date(data.event.startsAt);
  const dateStr = start.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={[styles.brand, { color: data.brand.primaryColor }]}>
            {data.brand.brandName.toUpperCase()}
          </Text>
          <Text style={styles.title}>{data.event.title}</Text>
          <Text style={styles.subtitle}>
            {dateStr} · {data.event.venueName}
            {data.event.city ? `, ${data.event.city}` : ""}
          </Text>
        </View>

        {sections.kpis && data.kpis && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            <View style={styles.kpiGrid}>
              <Kpi label="Tickets sold" value={String(data.kpis.ticketsSold)} />
              <Kpi
                label="Checked in"
                value={`${data.kpis.checkedInCount} (${Math.round(data.kpis.checkInRate * 100)}%)`}
              />
              <Kpi
                label="Revenue"
                value={formatMoney(data.kpis.revenueCents, data.kpis.currency)}
              />
              <Kpi label="Paid orders" value={String(data.kpis.ordersPaid)} />
              <Kpi label="Invited" value={String(data.kpis.ordersInvited)} />
              <Kpi label="Door sale" value={String(data.kpis.ordersDoorSale)} />
            </View>
          </>
        )}

        {sections.tiers && data.tiers && data.tiers.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Revenue by tier</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 3 }]}>Tier</Text>
                <Text style={[styles.th, { flex: 1 }]}>Price</Text>
                <Text style={[styles.th, { flex: 1 }]}>Sold</Text>
                <Text style={[styles.th, { flex: 1 }]}>Capacity</Text>
                <Text style={[styles.th, { flex: 1 }]}>Revenue</Text>
              </View>
              {data.tiers.map((t, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={[styles.td, { flex: 3 }]}>{t.name}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {formatMoney(t.priceCents, "EUR")}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]}>{t.quantitySold}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {t.maxQuantity ?? "—"}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {formatMoney(t.revenueCents, "EUR")}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {sections.demographics && data.demographics && (
          <>
            <Text style={styles.sectionHeading}>Demographics</Text>
            <DemographicsBlock
              title="Country"
              rows={data.demographics.byCountry.map((r) => ({
                key: r.code ?? "Unknown",
                count: r.count,
              }))}
            />
            <DemographicsBlock
              title="Gender"
              rows={data.demographics.byGender.map((r) => ({
                key: r.gender ?? "Unknown",
                count: r.count,
              }))}
            />
            <DemographicsBlock
              title="Occupation (top 10)"
              rows={data.demographics.byOccupation
                .slice(0, 10)
                .map((r) => ({ key: r.occupation ?? "Unknown", count: r.count }))}
            />
            <DemographicsBlock
              title="Source"
              rows={data.demographics.bySource.map((r) => ({
                key: r.source ?? "Unknown",
                count: r.count,
              }))}
            />
          </>
        )}

        {sections.attendees && data.attendees && data.attendees.length > 0 && (
          <>
            <Text style={styles.sectionHeading} break>
              Attendee list ({data.attendees.length})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Name</Text>
                <Text style={[styles.th, { flex: 2 }]}>Email</Text>
                <Text style={[styles.th, { flex: 1 }]}>Tier</Text>
                <Text style={[styles.th, { flex: 1 }]}>Country</Text>
                <Text style={[styles.th, { flex: 1 }]}>Check-in</Text>
              </View>
              {data.attendees.map((a, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={[styles.td, { flex: 2 }]}>{a.name}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{a.email}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{a.tier}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{a.country ?? "—"}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {a.checkedIn ? "Yes" : "No"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.brand.legalName ?? data.brand.brandName}
            {data.brand.supportEmail ? ` · ${data.brand.supportEmail}` : ""}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function DemographicsBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  if (rows.length === 0) return null;
  const max = rows[0]?.count ?? 1;
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 4 }}>
        {title}
      </Text>
      <View>
        {rows.map((r, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Text style={{ width: 120, fontSize: 9 }}>{r.key}</Text>
            <View
              style={{
                flex: 1,
                height: 8,
                backgroundColor: COLORS.bgSubtle,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${(r.count / max) * 100}%`,
                  backgroundColor: "#c8102e",
                  height: "100%",
                }}
              />
            </View>
            <Text style={{ width: 30, textAlign: "right", fontSize: 9 }}>
              {r.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
