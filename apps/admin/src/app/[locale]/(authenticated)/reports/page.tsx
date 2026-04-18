import {
  getOrdersReport,
  getAttendeesReport,
  getRevenueByEventReport,
  getReportsEvents,
  getCouponPerformanceReport,
  getEventFinancialSummary,
} from "@/actions/reports";
import { PageHeader } from "@/components/page-header";
import { ReportsClient } from "./reports-client";
import { EventPdfPanel } from "./event-pdf-panel";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    event?: string;
    status?: string;
    checked_in?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const checkedIn =
    sp.checked_in === "yes" || sp.checked_in === "no" ? sp.checked_in : "";

  // Convert YYYY-MM-DD to ISO with day boundaries (inclusive).
  const fromDate = sp.from ? `${sp.from}T00:00:00.000Z` : undefined;
  const toDate = sp.to ? `${sp.to}T23:59:59.999Z` : undefined;

  const [orders, attendees, revenueByEvent, events, coupons] = await Promise.all([
    getOrdersReport({
      locale,
      eventId: sp.event,
      status: sp.status,
      fromDate,
      toDate,
    }),
    getAttendeesReport({
      locale,
      eventId: sp.event,
      checkedIn,
      fromDate,
      toDate,
    }),
    getRevenueByEventReport({ locale, fromDate, toDate }),
    getReportsEvents(),
    getCouponPerformanceReport(sp.event),
  ]);

  // Financial summary only when a specific event is selected
  const financial = sp.event
    ? await getEventFinancialSummary(sp.event)
    : null;

  return (
    <div>
      <PageHeader
        title={locale === "de"
          ? "Berichte"
          : locale === "fr"
            ? "Rapports"
            : "Reports"}
      />

      <ReportsClient
        locale={locale}
        orders={orders}
        attendees={attendees}
        revenueByEvent={revenueByEvent}
        coupons={coupons}
        financial={financial}
        events={events.map((e) => ({
          id: e.id,
          title:
            (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
        }))}
        currentEventFilter={sp.event ?? ""}
        currentStatusFilter={sp.status ?? ""}
        currentCheckedInFilter={checkedIn}
        currentFromFilter={sp.from ?? ""}
        currentToFilter={sp.to ?? ""}
      />

      {sp.event &&
        (() => {
          const selected = events.find((e) => e.id === sp.event);
          if (!selected) return null;
          const title =
            (selected[`title_${locale}` as keyof typeof selected] as string) ||
            selected.title_en;
          return (
            <EventPdfPanel
              locale={locale}
              eventId={selected.id}
              eventTitle={title}
            />
          );
        })()}
    </div>
  );
}
