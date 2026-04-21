"use client";

import { useState, useTransition } from "react";
import { Card } from "@dbc/ui";
import { getFunnelKpis, type FunnelKpis } from "@/actions/funnels";

type WindowKey = "7" | "30" | "all";

const T = {
  en: {
    views: "Views",
    clicks: "CTA clicks",
    conversions: "Conversions",
    ctr: "CTR",
    conversionRate: "Conversion rate",
    topSources: "Top sources",
    empty: "No traffic yet.",
    windows: { "7": "Last 7 days", "30": "Last 30 days", "all": "All time" },
  },
  de: {
    views: "Aufrufe",
    clicks: "CTA-Klicks",
    conversions: "Abschlüsse",
    ctr: "CTR",
    conversionRate: "Abschlussrate",
    topSources: "Top-Quellen",
    empty: "Noch keine Aufrufe.",
    windows: { "7": "Letzte 7 Tage", "30": "Letzte 30 Tage", "all": "Gesamtzeit" },
  },
  fr: {
    views: "Vues",
    clicks: "Clics CTA",
    conversions: "Conversions",
    ctr: "CTR",
    conversionRate: "Taux de conversion",
    topSources: "Sources principales",
    empty: "Aucun trafic pour l’instant.",
    windows: { "7": "7 derniers jours", "30": "30 derniers jours", "all": "Tout" },
  },
} as const;

function formatPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function KpiCards({
  funnelId,
  locale,
  initial7d,
}: {
  funnelId: string;
  locale: string;
  initial7d: FunnelKpis;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [windowKey, setWindowKey] = useState<WindowKey>("7");
  const [kpis, setKpis] = useState<FunnelKpis>(initial7d);
  const [pending, startTransition] = useTransition();

  function switchWindow(next: WindowKey) {
    if (next === windowKey) return;
    setWindowKey(next);
    if (next === "7") {
      setKpis(initial7d);
      return;
    }
    startTransition(async () => {
      const days = next === "30" ? 30 : null;
      const fresh = await getFunnelKpis(funnelId, days);
      setKpis(fresh);
    });
  }

  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex rounded-md border border-border bg-background p-1 text-xs">
        {(["7", "30", "all"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={windowKey === k}
            onClick={() => switchWindow(k)}
            className={`rounded-sm px-3 py-1 font-medium transition-colors ${
              windowKey === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.windows[k]}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${pending ? "opacity-60" : ""}`}
      >
        <KpiCell label={t.views} value={kpis.views.toString()} />
        <KpiCell label={t.clicks} value={kpis.cta_clicks.toString()} />
        <KpiCell label={t.conversions} value={kpis.conversions.toString()} />
        <KpiCell label={t.ctr} value={formatPct(kpis.ctr)} sub={`${t.conversionRate}: ${formatPct(kpis.conversion_rate)}`} />
      </div>

      <Card padding="md">
        <p className="text-sm font-semibold">{t.topSources}</p>
        {kpis.top_sources.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {kpis.top_sources.map((s) => (
              <li key={s.source} className="flex justify-between">
                <span className="text-muted-foreground">{s.source}</span>
                <span className="font-medium">{s.clicks}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KpiCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card padding="md">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
