"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, LinkButton } from "@dbc/ui";

export function EventPdfPanel({
  locale,
  eventId,
  eventTitle,
}: {
  locale: string;
  eventId: string;
  eventTitle: string;
}) {
  const t = useTranslations("admin.reports.eventPdfPanel");
  const [kpis, setKpis] = useState(true);
  const [tiers, setTiers] = useState(true);
  const [demographics, setDemographics] = useState(true);
  const [attendees, setAttendees] = useState(true);

  const url = useMemo(() => {
    const parts: string[] = [];
    if (kpis) parts.push("kpis");
    if (tiers) parts.push("tiers");
    if (demographics) parts.push("demographics");
    if (attendees) parts.push("attendees");
    return `/${locale}/reports/${eventId}/pdf?sections=${parts.join(",")}`;
  }, [locale, eventId, kpis, tiers, demographics, attendees]);

  const anySelected = kpis || tiers || demographics || attendees;

  return (
    <section className="mt-8 rounded-lg border border-border p-5">
      <h2 className="font-heading text-lg font-bold">{t("title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("desc")} <span className="font-medium">{eventTitle}</span>. {t("descTail")}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle label={t("kpis")} checked={kpis} onChange={setKpis} hint={t("kpisHint")} />
        <Toggle label={t("tiers")} checked={tiers} onChange={setTiers} hint={t("tiersHint")} />
        <Toggle label={t("demographics")} checked={demographics} onChange={setDemographics} hint={t("demographicsHint")} />
        <Toggle label={t("attendees")} checked={attendees} onChange={setAttendees} hint={t("attendeesHint")} />
      </div>
      <div className="mt-4">
        {anySelected ? (
          <LinkButton href={url}>
            {t("download")}
          </LinkButton>
        ) : (
          <Button type="button"
            disabled>
            {t("selectAtLeast")}
          </Button>
        )}
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 text-sm">
      <Input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
