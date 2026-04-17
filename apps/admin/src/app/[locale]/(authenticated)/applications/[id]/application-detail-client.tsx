"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/actions/applications";
import { updateJobApplicationStatus } from "@/actions/job-applications";

type Status = "new" | "reviewing" | "shortlisted" | "rejected" | "accepted";
const STATUS_OPTIONS: Status[] = [
  "new",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
];

export function ApplicationDetailClient({
  type,
  data,
  locale,
}: {
  type: "incubation" | "job";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<string>(data.reviewer_notes ?? "");

  const t = {
    en: {
      pitch: "Pitch",
      coverLetter: "Cover letter",
      companyDetails: "Company details",
      contact: "Contact",
      review: "Review",
      status: "Status",
      notes: "Reviewer notes",
      save: "Save",
      saving: "Saving...",
      stage: "Stage",
      website: "Website",
      country: "Country",
      funding: "Funding needed",
      email: "Email",
      phone: "Phone",
      linkedin: "LinkedIn",
      portfolio: "Portfolio",
      received: "Received",
      updated: "Last updated",
      reviewer: "Reviewed by",
      jobTitle: "Position",
    },
    de: {
      pitch: "Pitch",
      coverLetter: "Anschreiben",
      companyDetails: "Unternehmensdaten",
      contact: "Kontakt",
      review: "Bewertung",
      status: "Status",
      notes: "Notizen",
      save: "Speichern",
      saving: "Wird gespeichert...",
      stage: "Phase",
      website: "Website",
      country: "Land",
      funding: "Finanzierungsbedarf",
      email: "E-Mail",
      phone: "Telefon",
      linkedin: "LinkedIn",
      portfolio: "Portfolio",
      received: "Eingegangen",
      updated: "Zuletzt aktualisiert",
      reviewer: "Bewertet von",
      jobTitle: "Position",
    },
    fr: {
      pitch: "Pitch",
      coverLetter: "Lettre de motivation",
      companyDetails: "D\u00E9tails de l\u2019entreprise",
      contact: "Contact",
      review: "\u00C9valuation",
      status: "Statut",
      notes: "Notes du r\u00E9viseur",
      save: "Enregistrer",
      saving: "Enregistrement...",
      stage: "\u00C9tape",
      website: "Site web",
      country: "Pays",
      funding: "Financement recherch\u00E9",
      email: "E-mail",
      phone: "T\u00E9l\u00E9phone",
      linkedin: "LinkedIn",
      portfolio: "Portfolio",
      received: "Re\u00E7u",
      updated: "Derni\u00E8re mise \u00E0 jour",
      reviewer: "\u00C9valu\u00E9 par",
      jobTitle: "Poste",
    },
  }[locale] ?? {
    pitch: "Pitch", coverLetter: "Cover letter", companyDetails: "Company", contact: "Contact",
    review: "Review", status: "Status", notes: "Notes", save: "Save", saving: "...",
    stage: "Stage", website: "Website", country: "Country", funding: "Funding",
    email: "Email", phone: "Phone", linkedin: "LinkedIn", portfolio: "Portfolio",
    received: "Received", updated: "Updated", reviewer: "Reviewer", jobTitle: "Position",
  };

  function handleSave(newStatus: Status) {
    startTransition(async () => {
      if (type === "incubation") {
        const res = await updateApplicationStatus(data.id, newStatus, locale, notes);
        if (res.error) alert(res.error);
        else router.refresh();
      } else {
        const res = await updateJobApplicationStatus(data.id, newStatus, notes, locale);
        if (res.error) alert(res.error);
        else router.refresh();
      }
    });
  }

  if (type === "incubation") {
    return (
      <div className="mt-8 space-y-8">
        {/* Full pitch */}
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.pitch}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
            {data.pitch}
          </p>
        </section>

        {/* Company details */}
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.companyDetails}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            {data.company_name && (
              <Row label={t.companyDetails} value={data.company_name} />
            )}
            {data.company_stage && (
              <Row label={t.stage} value={data.company_stage} />
            )}
            {data.company_website && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t.website}</dt>
                <dd>
                  <a
                    href={data.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {data.company_website.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            )}
            {data.country && <Row label={t.country} value={data.country} />}
            {data.funding_needed_cents != null && (
              <Row
                label={t.funding}
                value={`\u20AC${(data.funding_needed_cents / 100).toLocaleString()}`}
              />
            )}
          </dl>
        </section>

        {/* Contact */}
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.contact}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label={t.email} value={data.founder_email} />
            {data.founder_phone && (
              <Row label={t.phone} value={data.founder_phone} />
            )}
            <Row
              label={t.received}
              value={new Date(data.created_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </dl>
        </section>

        {/* Reviewer */}
        <ReviewSection
          t={t}
          status={data.status}
          notes={notes}
          onNotesChange={setNotes}
          onSave={handleSave}
          isPending={isPending}
          reviewerName={data.reviewer?.display_name}
        />
      </div>
    );
  }

  // Job application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobOffers = data.job_offers as any;
  const jobTitle = Array.isArray(jobOffers)
    ? jobOffers[0]?.title_en ?? "—"
    : jobOffers?.title_en ?? "—";

  return (
    <div className="mt-8 space-y-8">
      {/* Full cover letter */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.coverLetter}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
          {data.cover_letter || "\u2014"}
        </p>
      </section>

      {/* Contact & links */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.contact}
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label={t.jobTitle} value={jobTitle} />
          <Row label={t.email} value={data.applicant_email} />
          {data.applicant_phone && (
            <Row label={t.phone} value={data.applicant_phone} />
          )}
          {data.linkedin_url && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.linkedin}</dt>
              <dd>
                <a
                  href={data.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  LinkedIn &rarr;
                </a>
              </dd>
            </div>
          )}
          {data.portfolio_url && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t.portfolio}</dt>
              <dd>
                <a
                  href={data.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  Portfolio &rarr;
                </a>
              </dd>
            </div>
          )}
          <Row
            label={t.received}
            value={new Date(data.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </dl>
      </section>

      {/* Reviewer */}
      <ReviewSection
        t={t}
        status={data.status}
        notes={notes}
        onNotesChange={setNotes}
        onSave={handleSave}
        isPending={isPending}
        reviewerName={data.reviewer?.display_name}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ReviewSection({
  t,
  status,
  notes,
  onNotesChange,
  onSave,
  isPending,
  reviewerName,
}: {
  t: Record<string, string>;
  status: string;
  notes: string;
  onNotesChange: (v: string) => void;
  onSave: (status: Status) => void;
  isPending: boolean;
  reviewerName?: string | null;
}) {
  const [selectedStatus, setSelectedStatus] = useState<Status>(
    status as Status
  );

  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t.review}
      </h2>
      <div className="mt-3 space-y-4">
        {reviewerName && (
          <p className="text-xs text-muted-foreground">
            {t.reviewer}: {reviewerName}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">{t.status}</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as Status)}
            className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t.notes}</label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => onSave(selectedStatus)}
          disabled={isPending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? t.saving : t.save}
        </button>
      </div>
    </section>
  );
}
