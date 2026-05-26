"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Container,
  Heading,
  Eyebrow,
  Badge,
  Button,
} from "@dbc/ui";
import type { DashboardData } from "@dbc/affiliate";

type Locale = "en" | "de" | "fr";

const T = {
  en: {
    pageEyebrow: "Affiliate dashboard",
    welcomeBack: "Welcome back, {name}",
    eventSubtitle: "{event}",
    kpiTickets: "Tickets sold",
    kpiTotalEarned: "Total earned",
    kpiPending: "Pending payout",
    kpiCooldown: "In refund window",
    sharingTitle: "Your sharing link",
    sharingDesc:
      "Share this link anywhere — Instagram bio, WhatsApp, newsletters. Your audience gets the discount, you get credit.",
    copyLink: "Copy link",
    copied: "Copied",
    referralsTitle: "Recent conversions",
    referralsEmpty:
      "No conversions yet. Share your link and check back here.",
    payoutsTitle: "Payouts",
    payoutsEmpty: "No payouts yet. Payments are sent by bank transfer after the event.",
    statementDownload: "Statement",
    statusPending: "In cooldown",
    statusEligible: "Eligible",
    statusPayoutQueued: "Payout queued",
    statusPaid: "Paid",
    statusReversed: "Reversed (refunded)",
    statusUnknown: "—",
    commissionPctLabel: "{pct}% commission",
    refreshing: "Updating…",
    autoRefreshNote: "This page refreshes every 30 seconds.",
  },
  de: {
    pageEyebrow: "Affiliate-Dashboard",
    welcomeBack: "Willkommen zurück, {name}",
    eventSubtitle: "{event}",
    kpiTickets: "Verkaufte Tickets",
    kpiTotalEarned: "Bereits ausgezahlt",
    kpiPending: "Ausstehende Auszahlung",
    kpiCooldown: "In Widerrufsfrist",
    sharingTitle: "Dein Sharing-Link",
    sharingDesc:
      "Teile diesen Link überall — Instagram-Bio, WhatsApp, Newsletter. Deine Zielgruppe bekommt den Rabatt, du den Credit.",
    copyLink: "Link kopieren",
    copied: "Kopiert",
    referralsTitle: "Letzte Conversions",
    referralsEmpty:
      "Noch keine Conversions. Teile deinen Link und schau wieder rein.",
    payoutsTitle: "Auszahlungen",
    payoutsEmpty:
      "Noch keine Auszahlungen. Zahlungen erfolgen per Banküberweisung nach dem Event.",
    statementDownload: "Aufstellung",
    statusPending: "In Widerrufsfrist",
    statusEligible: "Auszahlbar",
    statusPayoutQueued: "Auszahlung in Vorbereitung",
    statusPaid: "Ausgezahlt",
    statusReversed: "Storniert (Rückerstattung)",
    statusUnknown: "—",
    commissionPctLabel: "{pct}% Provision",
    refreshing: "Aktualisiere…",
    autoRefreshNote: "Diese Seite aktualisiert sich alle 30 Sekunden.",
  },
  fr: {
    pageEyebrow: "Tableau de bord affilié",
    welcomeBack: "Bon retour, {name}",
    eventSubtitle: "{event}",
    kpiTickets: "Billets vendus",
    kpiTotalEarned: "Déjà versé",
    kpiPending: "Paiement en attente",
    kpiCooldown: "En période de remboursement",
    sharingTitle: "Votre lien de partage",
    sharingDesc:
      "Partagez ce lien partout — bio Instagram, WhatsApp, newsletters. Votre audience reçoit la réduction, vous obtenez le crédit.",
    copyLink: "Copier le lien",
    copied: "Copié",
    referralsTitle: "Conversions récentes",
    referralsEmpty:
      "Aucune conversion pour l'instant. Partagez votre lien et revenez ici.",
    payoutsTitle: "Paiements",
    payoutsEmpty:
      "Aucun paiement pour l'instant. Les paiements sont envoyés par virement après l'événement.",
    statementDownload: "Relevé",
    statusPending: "En période de remboursement",
    statusEligible: "Éligible",
    statusPayoutQueued: "Paiement en cours",
    statusPaid: "Payé",
    statusReversed: "Annulé (remboursement)",
    statusUnknown: "—",
    commissionPctLabel: "{pct}% de commission",
    refreshing: "Mise à jour…",
    autoRefreshNote: "Cette page se rafraîchit toutes les 30 secondes.",
  },
} as const;

function formatMoney(cents: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency }
  ).format(cents / 100);
}

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

function statusBadge(
  status: DashboardData["recentReferrals"][number]["status"],
  t: (typeof T)[Locale]
): { label: string; tone: "neutral" | "success" | "warning" | "error" } {
  switch (status) {
    case "paid":
      return { label: t.statusPaid, tone: "success" };
    case "eligible":
    case "payout_queued":
      return {
        label: status === "eligible" ? t.statusEligible : t.statusPayoutQueued,
        tone: "warning",
      };
    case "pending":
      return { label: t.statusPending, tone: "neutral" };
    case "reversed":
      return { label: t.statusReversed, tone: "error" };
    default:
      return { label: t.statusUnknown, tone: "neutral" };
  }
}

export function PartnerDashboard({
  data,
  locale,
}: {
  data: DashboardData;
  locale: Locale;
}) {
  const t = T[locale];
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 600);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignored
    }
  }

  const currency = "EUR";

  return (
    <Container className="my-8">
      <div className="space-y-2">
        <Eyebrow>{t.pageEyebrow}</Eyebrow>
        <Heading level={1}>
          {t.welcomeBack.replace("{name}", data.affiliate.display_name)}
        </Heading>
        <p className="text-base text-muted-foreground">
          {data.event.title} · {Number(data.eventAffiliate.commission_pct)}%
          {data.coupon ? (
            <>
              {" · "}
              <span className="font-mono">{data.coupon.code}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t.kpiTickets} value={String(data.kpis.ticketsSold)} />
        <Kpi
          label={t.kpiTotalEarned}
          value={formatMoney(data.kpis.totalEarnedCents, currency, locale)}
        />
        <Kpi
          label={t.kpiPending}
          value={formatMoney(data.kpis.pendingEligibleCents, currency, locale)}
        />
        <Kpi
          label={t.kpiCooldown}
          value={formatMoney(data.kpis.cooldownCents, currency, locale)}
        />
      </div>

      <Card className="mt-8" padding="md">
        <h2 className="text-lg font-semibold">{t.sharingTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.sharingDesc}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 break-all rounded border border-border bg-muted/20 px-3 py-2 text-xs">
            {data.referralUrl}
          </code>
          <Button onClick={copyReferral} variant="primary">
            {copied ? t.copied : t.copyLink}
          </Button>
        </div>
      </Card>

      <Card className="mt-6" padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.referralsTitle}</h2>
          {refreshing && (
            <span className="text-xs text-muted-foreground">{t.refreshing}</span>
          )}
        </div>
        {data.recentReferrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.referralsEmpty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentReferrals.map((r) => {
              const badge = statusBadge(r.status, t);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatDate(r.created_at, locale)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono">
                      {r.commission_cents
                        ? formatMoney(r.commission_cents, currency, locale)
                        : "—"}
                    </span>
                    <Badge variant={badge.tone === "neutral" ? "default" : (badge.tone as "success" | "warning" | "error")}>
                      {badge.label}
                    </Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {t.autoRefreshNote}
        </p>
      </Card>

      <Card className="mt-6" padding="md">
        <h2 className="text-lg font-semibold">{t.payoutsTitle}</h2>
        {data.payouts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.payoutsEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.payouts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {p.paid_at ? formatDate(p.paid_at, locale) : "—"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono">
                    {formatMoney(p.amount_cents, p.currency, locale)}
                  </span>
                  <Badge variant={p.status === "paid" ? "success" : "default"}>
                    {p.status}
                  </Badge>
                  {p.statement_storage_path && (
                    <a
                      href={`/api/partner/statement?path=${encodeURIComponent(
                        p.statement_storage_path
                      )}&token=${encodeURIComponent(
                        data.eventAffiliate.dashboard_token
                      )}`}
                      className="text-primary underline"
                    >
                      {t.statementDownload}
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
    </Card>
  );
}

export function PartnerEndedScreen({
  kind,
  locale,
}: {
  kind: "expired" | "revoked";
  locale: Locale;
}) {
  const copy = {
    en: {
      title: "This campaign has ended",
      body:
        kind === "revoked"
          ? "Access to this dashboard has been closed by the team. Please contact us if you have questions about your statement."
          : "The reporting window for this campaign has closed. Please contact us if you need a copy of your final statement.",
      contact: "Contact: info@dbc-germany.com",
    },
    de: {
      title: "Diese Kampagne ist beendet",
      body:
        kind === "revoked"
          ? "Der Zugriff auf dieses Dashboard wurde vom Team geschlossen. Bei Fragen zu deiner Aufstellung melde dich gerne bei uns."
          : "Das Reporting-Fenster für diese Kampagne ist geschlossen. Kontaktiere uns für eine Kopie deiner abschließenden Aufstellung.",
      contact: "Kontakt: info@dbc-germany.com",
    },
    fr: {
      title: "Cette campagne est terminée",
      body:
        kind === "revoked"
          ? "L'accès à ce tableau de bord a été fermé par l'équipe. Contactez-nous pour toute question sur votre relevé."
          : "La période de reporting de cette campagne est close. Contactez-nous pour recevoir une copie de votre relevé final.",
      contact: "Contact : info@dbc-germany.com",
    },
  } as const;
  const t = copy[locale];

  return (
    <Container className="my-12 text-center">
      <Heading level={1}>{t.title}</Heading>
      <p className="mx-auto mt-4 max-w-prose text-base text-muted-foreground">
        {t.body}
      </p>
      <p className="mt-6 text-sm text-muted-foreground">{t.contact}</p>
    </Container>
  );
}
