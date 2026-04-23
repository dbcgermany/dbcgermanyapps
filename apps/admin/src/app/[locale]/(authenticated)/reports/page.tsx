import {
  getOrdersReport,
  getAttendeesReport,
  getRevenueByEventReport,
  getReportsEvents,
  getCouponPerformanceReport,
  getEventFinancialSummary,
  getFinanceSummary,
  type FinanceChannel,
} from "@/actions/reports";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@dbc/supabase/server";
import { ReportsClient } from "./reports-client";
import { EventPdfPanel } from "./event-pdf-panel";
import { FinanceTab } from "./finance-tab";
import { ReportsTabs } from "./reports-tabs";

type TabKey =
  | "finance"
  | "marketing"
  | "operations"
  | "visitors"
  | "hr"
  | "it"
  | "general";

function parseTab(v: string | undefined): TabKey {
  const allowed: TabKey[] = [
    "finance",
    "marketing",
    "operations",
    "visitors",
    "hr",
    "it",
    "general",
  ];
  return (allowed as string[]).includes(v ?? "")
    ? ((v ?? "finance") as TabKey)
    : "finance";
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: string;
    event?: string;
    status?: string;
    checked_in?: string;
    channel?: string;
    from?: string;
    to?: string;
  }>;
}) {
  // Reports are admin-gated — finance data is sensitive enough to warrant
  // blocking manager-level access entirely (they see the dashboard channel
  // split but not the raw order list / refund ledger).
  await requireRole("admin");

  const { locale } = await params;
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  const pageTitle =
    locale === "de" ? "Berichte" : locale === "fr" ? "Rapports" : "Reports";

  const events = await getReportsEvents();
  const eventOptions = events.map((e) => ({
    id: e.id,
    title:
      (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
  }));

  return (
    <div>
      <PageHeader title={pageTitle} />
      <ReportsTabs locale={locale} current={tab} />

      {tab === "finance" && (
        <FinanceTabContent
          locale={locale}
          sp={sp}
          events={eventOptions}
        />
      )}

      {tab === "general" && (
        <GeneralTabContent locale={locale} sp={sp} events={events} />
      )}

      {tab !== "finance" && tab !== "general" && (
        <ComingSoonTab locale={locale} tab={tab} />
      )}
    </div>
  );
}

async function FinanceTabContent({
  locale,
  sp,
  events,
}: {
  locale: string;
  sp: { channel?: string; event?: string; from?: string; to?: string };
  events: { id: string; title: string }[];
}) {
  const channel = (
    ["online", "door", "comped"].includes(sp.channel ?? "")
      ? sp.channel
      : ""
  ) as FinanceChannel | "";

  const from = sp.from ? `${sp.from}T00:00:00.000Z` : undefined;
  const to = sp.to ? `${sp.to}T23:59:59.999Z` : undefined;

  const summary = await getFinanceSummary({
    from,
    to,
    channel: (channel || undefined) as FinanceChannel | undefined,
    eventId: sp.event || undefined,
  });

  return (
    <FinanceTab
      locale={locale}
      summary={summary}
      events={events}
      filters={{
        from: sp.from ?? "",
        to: sp.to ?? "",
        channel,
        eventId: sp.event ?? "",
      }}
    />
  );
}

// Keeps the existing per-topic reports UI accessible while the per-
// department tabs fill in. Deletion follows once every department has its
// own tab (Ship 2+).
async function GeneralTabContent({
  locale,
  sp,
  events,
}: {
  locale: string;
  sp: {
    event?: string;
    status?: string;
    checked_in?: string;
    from?: string;
    to?: string;
  };
  events: { id: string; title_en: string; title_de: string; title_fr: string }[];
}) {
  const checkedIn =
    sp.checked_in === "yes" || sp.checked_in === "no" ? sp.checked_in : "";
  const fromDate = sp.from ? `${sp.from}T00:00:00.000Z` : undefined;
  const toDate = sp.to ? `${sp.to}T23:59:59.999Z` : undefined;

  const [orders, attendees, revenueByEvent, coupons] = await Promise.all([
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
    getCouponPerformanceReport(sp.event),
  ]);

  const financial = sp.event ? await getEventFinancialSummary(sp.event) : null;

  return (
    <>
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
    </>
  );
}

function ComingSoonTab({ locale, tab }: { locale: string; tab: TabKey }) {
  const SCOPE: Record<
    Exclude<TabKey, "finance" | "general">,
    { en: string[]; de: string[]; fr: string[] }
  > = {
    marketing: {
      en: [
        "Funnel performance grid — views / clicks / submits / conversions",
        "Top UTM sources leaderboard",
        "Campaign → paid-order attribution",
        "Newsletter growth & confirmed opt-in rate",
        "Contact-form lead quality",
      ],
      de: [
        "Funnel-Performance — Aufrufe / Klicks / Absendungen / Conversions",
        "Top UTM-Quellen",
        "Kampagne → bezahlte Bestellung",
        "Newsletter-Wachstum & Double-Opt-in-Rate",
        "Kontakt-Leads Qualität",
      ],
      fr: [
        "Performance des tunnels — vues / clics / soumissions / conversions",
        "Top sources UTM",
        "Campagne → commande payée",
        "Croissance newsletter & double opt-in",
        "Qualité des leads (formulaire de contact)",
      ],
    },
    operations: {
      en: [
        "Active events panel — capacity, sold, sell-through, check-ins",
        "Low-inventory watchlist",
        "Waitlist health per event",
        "Vendor / sponsor status",
        "Runsheet & checklist snapshot",
      ],
      de: [
        "Aktive Events — Kapazität, Verkauft, Auslastung, Check-ins",
        "Niedriger Bestand",
        "Warteliste pro Event",
        "Lieferanten-/Sponsoren-Status",
        "Ablaufplan & Checkliste",
      ],
      fr: [
        "Événements actifs — capacité, ventes, taux, enregistrements",
        "Surveillance stocks faibles",
        "Liste d’attente par événement",
        "Statut fournisseurs / sponsors",
        "Déroulé & checklist",
      ],
    },
    visitors: {
      en: [
        "Attendee list per event with filters",
        "Demographic rollup (country, gender, occupation)",
        "Cross-event retention & returning attendees",
        "Contact segmentation (category, consent)",
      ],
      de: [
        "Teilnehmerliste pro Event mit Filtern",
        "Demografische Übersicht (Land, Geschlecht, Beruf)",
        "Wiederkehrende Teilnehmer",
        "Kontakt-Segmentierung (Kategorie, Einwilligung)",
      ],
      fr: [
        "Liste des participants par événement avec filtres",
        "Démographie (pays, genre, profession)",
        "Participants récurrents",
        "Segmentation des contacts (catégorie, consentement)",
      ],
    },
    hr: {
      en: [
        "Staff directory",
        "Job applications funnel",
        "Staff activity summary (audit log)",
        "Upcoming anniversaries & birthdays",
      ],
      de: [
        "Mitarbeiterverzeichnis",
        "Bewerbungen-Funnel",
        "Mitarbeiter-Aktivität (Audit-Log)",
        "Jubiläen & Geburtstage",
      ],
      fr: [
        "Annuaire de l’équipe",
        "Tunnel des candidatures",
        "Activité du personnel (audit log)",
        "Anniversaires à venir",
      ],
    },
    it: {
      en: [
        "Failed webhook deliveries (Stripe)",
        "Notification delivery health",
        "Audit-log volume & top actions",
        "Security events (logins, MFA, resets)",
        "Deploy / release log (Vercel)",
        "Resend email delivery stats",
      ],
      de: [
        "Fehlgeschlagene Webhooks (Stripe)",
        "Benachrichtigungs-Zustellung",
        "Audit-Log-Volumen & Top-Aktionen",
        "Sicherheitsereignisse (Login, MFA, Reset)",
        "Deploys / Releases (Vercel)",
        "Resend-E-Mail-Zustellung",
      ],
      fr: [
        "Webhooks Stripe en échec",
        "Santé des notifications",
        "Volume audit-log & actions top",
        "Événements de sécurité (login, MFA, reset)",
        "Déploiements (Vercel)",
        "Livraison Resend",
      ],
    },
  };

  const items =
    tab in SCOPE
      ? SCOPE[tab as keyof typeof SCOPE][locale as "en" | "de" | "fr"] ??
        SCOPE[tab as keyof typeof SCOPE].en
      : [];

  const comingSoon =
    locale === "de"
      ? "Bald verfügbar"
      : locale === "fr"
        ? "Bientôt disponible"
        : "Coming soon";
  const plannedIntro =
    locale === "de"
      ? "Geplanter Umfang:"
      : locale === "fr"
        ? "Portée prévue :"
        : "Planned scope:";

  return (
    <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/20 p-8">
      <p className="font-heading text-lg font-semibold">{comingSoon}</p>
      <p className="mt-2 text-sm text-muted-foreground">{plannedIntro}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
