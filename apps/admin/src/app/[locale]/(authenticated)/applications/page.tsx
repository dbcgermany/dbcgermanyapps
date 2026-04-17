import Link from "next/link";
import { getIncubationApplications } from "@/actions/applications";
import { getJobApplications } from "@/actions/job-applications";
import { CsvExportButton } from "@/components/csv-export-button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusSelect } from "./status-select";
import { JobApplicationStatusSelect } from "./job-application-status-select";
import { ApplicationTabs } from "./application-tabs";

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "jobs" ? "jobs" : "incubation";

  const apps = await getIncubationApplications();
  const jobApps = await getJobApplications();

  const csvRows = apps.map((a) => ({
    id: a.id,
    created_at: a.created_at,
    founder_name: a.founder_name,
    founder_email: a.founder_email,
    founder_phone: a.founder_phone ?? "",
    country: a.country ?? "",
    locale: a.locale,
    company_name: a.company_name ?? "",
    company_website: a.company_website ?? "",
    company_stage: a.company_stage ?? "",
    funding_needed_eur:
      a.funding_needed_cents != null
        ? (a.funding_needed_cents / 100).toFixed(2)
        : "",
    status: a.status,
    reviewer_notes: a.reviewer_notes ?? "",
    pitch: a.pitch,
  }));

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Incubation and job applications."
        cta={
          activeTab === "incubation" ? (
            <CsvExportButton
              rows={csvRows}
              filename={`applications-${new Date().toISOString().slice(0, 10)}.csv`}
              headers={[
                { key: "id", label: "ID" },
                { key: "created_at", label: "Received" },
                { key: "founder_name", label: "Founder" },
                { key: "founder_email", label: "Email" },
                { key: "founder_phone", label: "Phone" },
                { key: "country", label: "Country" },
                { key: "locale", label: "Locale" },
                { key: "company_name", label: "Company" },
                { key: "company_website", label: "Website" },
                { key: "company_stage", label: "Stage" },
                { key: "funding_needed_eur", label: "Funding sought (EUR)" },
                { key: "status", label: "Status" },
                { key: "reviewer_notes", label: "Notes" },
                { key: "pitch", label: "Pitch" },
              ]}
            />
          ) : undefined
        }
      />

      <ApplicationTabs locale={locale} activeTab={activeTab} />

      {activeTab === "incubation" ? (
        <>
          {apps.length === 0 ? (
            <EmptyState message="No incubation applications yet." className="mt-8" />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Founder</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Pitch</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apps.map((a) => (
                    <tr key={a.id} className="align-top">
                      <td className="px-4 py-4">
                        <Link
                          href={`/${locale}/applications/${a.id}?type=incubation`}
                          className="font-medium hover:text-primary"
                        >
                          {a.founder_name}
                        </Link>
                        <a
                          href={`mailto:${a.founder_email}`}
                          className="block text-xs text-primary hover:text-primary/80"
                        >
                          {a.founder_email}
                        </a>
                        {a.founder_phone && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.founder_phone}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.country ?? "\u2014"} \u00b7 {a.locale.toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{a.company_name ?? "\u2014"}</p>
                        {a.company_website && (
                          <a
                            href={a.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary/80"
                          >
                            {a.company_website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {a.company_stage ?? "\u2014"}
                        {a.funding_needed_cents != null && (
                          <p className="mt-1">
                            \u20ac{(a.funding_needed_cents / 100).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 max-w-md text-xs leading-5 text-muted-foreground">
                        {a.pitch.length > 240
                          ? a.pitch.slice(0, 240) + "\u2026"
                          : a.pitch}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusSelect
                          id={a.id}
                          locale={locale}
                          current={a.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {jobApps.length === 0 ? (
            <EmptyState message="No job applications yet." className="mt-8" />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Cover letter</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobApps.map((a) => {
                    const offers = a.job_offers as
                      | { title_en: string; title_de: string | null; title_fr: string | null }[]
                      | null;
                    const jobTitle = offers?.[0]?.title_en ?? "Unknown position";
                    return (
                      <tr key={a.id} className="align-top">
                        <td className="px-4 py-4">
                          <Link
                            href={`/${locale}/applications/${a.id}?type=job`}
                            className="font-medium hover:text-primary"
                          >
                            {a.applicant_name}
                          </Link>
                          <a
                            href={`mailto:${a.applicant_email}`}
                            className="block text-xs text-primary hover:text-primary/80"
                          >
                            {a.applicant_email}
                          </a>
                          {a.applicant_phone && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {a.applicant_phone}
                            </p>
                          )}
                          {a.linkedin_url && (
                            <a
                              href={a.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block text-xs text-primary hover:text-primary/80"
                            >
                              LinkedIn
                            </a>
                          )}
                          {a.portfolio_url && (
                            <a
                              href={a.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block text-xs text-primary hover:text-primary/80"
                            >
                              Portfolio
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium">{jobTitle}</p>
                        </td>
                        <td className="px-4 py-4 max-w-md text-xs leading-5 text-muted-foreground">
                          {a.cover_letter
                            ? a.cover_letter.length > 240
                              ? a.cover_letter.slice(0, 240) + "\u2026"
                              : a.cover_letter
                            : "\u2014"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString(locale)}
                        </td>
                        <td className="px-4 py-4">
                          <JobApplicationStatusSelect
                            id={a.id}
                            locale={locale}
                            current={a.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
