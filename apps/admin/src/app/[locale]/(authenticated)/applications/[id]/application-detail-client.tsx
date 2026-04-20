"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type IncubationApplicationStatus } from "@dbc/types";
import { updateApplicationStatus } from "@/actions/applications";
import { updateJobApplicationStatus } from "@/actions/job-applications";

type Status = IncubationApplicationStatus;
// Display order intentionally differs from enum order (accepted above
// rejected in the UI). Type locks values to the SSOT union.
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
        {/* Contact */}
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.contact}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label={t.email} value={data.founder_email} />
            {data.founder_phone && <Row label={t.phone} value={data.founder_phone} />}
            {data.country && <Row label={t.country} value={data.country} />}
            {data.founder_age != null && (
              <Row label="Age" value={String(data.founder_age)} />
            )}
            {data.founder_gender && (
              <Row label="Gender" value={String(data.founder_gender)} />
            )}
            {data.founder_birthday && (
              <Row label="Birthday" value={String(data.founder_birthday)} />
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

        {/* Profile */}
        {(data.profile_type || data.has_idea != null) && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Profile
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {data.profile_type && (
                <Row
                  label="Profile"
                  value={
                    data.profile_type === "other" && data.profile_type_other
                      ? data.profile_type_other
                      : humanize(data.profile_type)
                  }
                />
              )}
              {data.has_idea != null && (
                <Row label="Has idea" value={data.has_idea ? "Yes" : "No"} />
              )}
            </dl>
          </section>
        )}

        {/* Idea */}
        {data.has_idea && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Idea
            </h2>
            <div className="mt-3 space-y-4 text-sm">
              {data.idea_problem && (
                <Block label="Problem" value={data.idea_problem} />
              )}
              {data.idea_audience && (
                <Block label="Audience" value={data.idea_audience} />
              )}
              {data.idea_development_stage && (
                <Block label="Stage" value={data.idea_development_stage} />
              )}
              {data.idea_ambitions && (
                <Block label="Ambitions" value={data.idea_ambitions} />
              )}
            </div>
          </section>
        )}

        {/* Sectors */}
        {((data.industry_sectors?.length ?? 0) > 0 ||
          data.has_prior_accompaniment != null) && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sectors
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {(data.industry_sectors?.length ?? 0) > 0 && (
                <Row
                  label="Industries"
                  value={(data.industry_sectors as string[])
                    .map((s) =>
                      s === "other" && data.industry_sectors_other
                        ? data.industry_sectors_other
                        : humanize(s)
                    )
                    .join(" \u00B7 ")}
                />
              )}
              {data.has_prior_accompaniment != null && (
                <Row
                  label="Prior accompaniment"
                  value={data.has_prior_accompaniment ? "Yes" : "No"}
                />
              )}
            </dl>
          </section>
        )}

        {/* Services wanted + why */}
        {((data.services_wanted?.length ?? 0) > 0 || data.why_join) && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Expectations
            </h2>
            <div className="mt-3 space-y-4 text-sm">
              {(data.services_wanted?.length ?? 0) > 0 && (
                <Row
                  label="Services wanted"
                  value={(data.services_wanted as string[])
                    .map((s) =>
                      s === "other" && data.services_wanted_other
                        ? data.services_wanted_other
                        : humanize(s)
                    )
                    .join(" \u00B7 ")}
                />
              )}
              {data.why_join && <Block label="Why join" value={data.why_join} />}
              {data.diaspora_link != null && (
                <Row
                  label="Diaspora link"
                  value={data.diaspora_link ? "Yes" : "No"}
                />
              )}
            </div>
          </section>
        )}

        {/* Diaspora origin */}
        {data.diaspora_link && data.diaspora_origin_country && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Diaspora origin
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Country" value={data.diaspora_origin_country} />
            </dl>
          </section>
        )}

        {/* Discovery */}
        {data.heard_about_us && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Discovery
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row
                label="Heard about us"
                value={
                  data.heard_about_us === "other" && data.heard_about_us_other
                    ? data.heard_about_us_other
                    : humanize(data.heard_about_us)
                }
              />
            </dl>
          </section>
        )}

        {/* Legacy / pitch fallback — only shown if something remains */}
        {(data.pitch || data.company_name || data.company_stage) && (
          <section className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.companyDetails}
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {data.company_name && <Row label="Company" value={data.company_name} />}
              {data.company_stage && <Row label={t.stage} value={data.company_stage} />}
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
              {data.funding_needed_cents != null && (
                <Row
                  label={t.funding}
                  value={`\u20AC${(data.funding_needed_cents / 100).toLocaleString()}`}
                />
              )}
            </dl>
            {data.pitch && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.pitch}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {data.pitch}
                </p>
              </div>
            )}
          </section>
        )}

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
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</p>
    </div>
  );
}

function humanize(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
