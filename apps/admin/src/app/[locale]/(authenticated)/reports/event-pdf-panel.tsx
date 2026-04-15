"use client";

import { useMemo, useState } from "react";

export function EventPdfPanel({
  locale,
  eventId,
  eventTitle,
}: {
  locale: string;
  eventId: string;
  eventTitle: string;
}) {
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
      <h2 className="font-heading text-lg font-bold">Event PDF report</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Selected event: <span className="font-medium">{eventTitle}</span>. Tick
        only the sections you need — the report will contain just those.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Summary KPIs"
          checked={kpis}
          onChange={setKpis}
          hint="Tickets sold, revenue, check-in rate, channel mix"
        />
        <Toggle
          label="Revenue by tier"
          checked={tiers}
          onChange={setTiers}
          hint="Per-tier price, sold, capacity, revenue"
        />
        <Toggle
          label="Demographics"
          checked={demographics}
          onChange={setDemographics}
          hint="Country, gender, occupation, source breakdowns"
        />
        <Toggle
          label="Attendee list"
          checked={attendees}
          onChange={setAttendees}
          hint="Full name + email + tier + country + check-in"
        />
      </div>
      <div className="mt-4">
        {anySelected ? (
          <a
            href={url}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Download PDF
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            Select at least one section
          </button>
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
      <input
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
