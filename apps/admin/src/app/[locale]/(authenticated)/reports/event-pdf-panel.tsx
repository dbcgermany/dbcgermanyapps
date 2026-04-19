"use client";

import { useMemo, useState } from "react";

const T = {
  en: {
    title: "Event PDF report",
    desc: "Selected event:",
    descTail: "Tick only the sections you need — the report will contain just those.",
    kpis: "Summary KPIs",
    kpisHint: "Tickets sold, revenue, check-in rate, channel mix",
    tiers: "Revenue by tier",
    tiersHint: "Per-tier price, sold, capacity, revenue",
    demographics: "Demographics",
    demographicsHint: "Country, gender, occupation, source breakdowns",
    attendees: "Attendee list",
    attendeesHint: "Full name + email + tier + country + check-in",
    download: "Download PDF",
    selectAtLeast: "Select at least one section",
  },
  de: {
    title: "Event-PDF-Bericht",
    desc: "Ausgewählte Veranstaltung:",
    descTail: "Nur die benötigten Abschnitte ankreuzen — der Bericht enthält dann nur diese.",
    kpis: "Kennzahlen-Übersicht",
    kpisHint: "Verkaufte Tickets, Umsatz, Check-in-Rate, Kanalmix",
    tiers: "Umsatz nach Kategorie",
    tiersHint: "Preis, Verkauf, Kapazität und Umsatz pro Kategorie",
    demographics: "Demografie",
    demographicsHint: "Aufschlüsselung nach Land, Geschlecht, Beruf, Quelle",
    attendees: "Teilnehmerliste",
    attendeesHint: "Vollname + E-Mail + Kategorie + Land + Check-in",
    download: "PDF herunterladen",
    selectAtLeast: "Mindestens einen Abschnitt auswählen",
  },
  fr: {
    title: "Rapport PDF de l’événement",
    desc: "Événement sélectionné :",
    descTail: "Cochez uniquement les sections nécessaires — le rapport contiendra celles-ci.",
    kpis: "KPI synthèse",
    kpisHint: "Billets vendus, revenus, taux d’enregistrement, mix canal",
    tiers: "Revenus par catégorie",
    tiersHint: "Prix, vendus, capacité, revenus par catégorie",
    demographics: "Démographie",
    demographicsHint: "Répartition par pays, genre, profession, source",
    attendees: "Liste des participants",
    attendeesHint: "Nom complet + e-mail + catégorie + pays + enregistrement",
    download: "Télécharger le PDF",
    selectAtLeast: "Sélectionnez au moins une section",
  },
} as const;

export function EventPdfPanel({
  locale,
  eventId,
  eventTitle,
}: {
  locale: string;
  eventId: string;
  eventTitle: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
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
      <h2 className="font-heading text-lg font-bold">{t.title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.desc} <span className="font-medium">{eventTitle}</span>. {t.descTail}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Toggle label={t.kpis} checked={kpis} onChange={setKpis} hint={t.kpisHint} />
        <Toggle label={t.tiers} checked={tiers} onChange={setTiers} hint={t.tiersHint} />
        <Toggle label={t.demographics} checked={demographics} onChange={setDemographics} hint={t.demographicsHint} />
        <Toggle label={t.attendees} checked={attendees} onChange={setAttendees} hint={t.attendeesHint} />
      </div>
      <div className="mt-4">
        {anySelected ? (
          <a
            href={url}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t.download}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            {t.selectAtLeast}
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
