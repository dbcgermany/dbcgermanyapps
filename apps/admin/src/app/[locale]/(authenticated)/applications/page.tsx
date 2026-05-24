import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getIncubationApplications } from "@/actions/applications";
import { getJobApplications } from "@/actions/job-applications";
import { CsvExportButton } from "@/components/csv-export-button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Tabs } from "@/components/tabs";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";
import { StatusSelect } from "./status-select";
import { JobApplicationStatusSelect } from "./job-application-status-select";

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.applications.list" });
  const { tab } = await searchParams;
  const activeTab = tab === "jobs" ? "jobs" : "incubation";

  const apps = await getIncubationApplications();
  const jobApps = await getJobApplications();

  const TAB_LABELS = {
    en: { incubation: "Incubation", jobs: "Job applications" },
    de: { incubation: "Inkubation", jobs: "Stellenbewerbungen" },
    fr: { incubation: "Incubation", jobs: "Candidatures d’emploi" },
  } as const;
  const tabLabels =
    TAB_LABELS[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof TAB_LABELS];

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
        title={t("title")}
        description={t("description")}
        cta={
          activeTab === "incubation" ? (
            <CsvExportButton
              rows={csvRows}
              filename={`applications-${new Date().toISOString().slice(0, 10)}.csv`}
              headers={[
                { key: "id", label: t("csvId") },
                { key: "created_at", label: t("csvReceived") },
                { key: "founder_name", label: t("csvFounder") },
                { key: "founder_email", label: t("csvEmail") },
                { key: "founder_phone", label: t("csvPhone") },
                { key: "country", label: t("csvCountry") },
                { key: "locale", label: t("csvLocale") },
                { key: "company_name", label: t("csvCompany") },
                { key: "company_website", label: t("csvWebsite") },
                { key: "company_stage", label: t("csvStage") },
                { key: "funding_needed_eur", label: t("csvFunding") },
                { key: "status", label: t("csvStatus") },
                { key: "reviewer_notes", label: t("csvNotes") },
                { key: "pitch", label: t("csvPitch") },
              ]}
            />
          ) : undefined
        }
      />

      <Tabs
        className="mt-6"
        items={[
          {
            href: `/${locale}/applications`,
            label: tabLabels.incubation,
            active: activeTab === "incubation",
            trailing:
              apps.length > 0 ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {apps.length}
                </span>
              ) : undefined,
          },
          {
            href: `/${locale}/applications?tab=jobs`,
            label: tabLabels.jobs,
            active: activeTab === "jobs",
            trailing:
              jobApps.length > 0 ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {jobApps.length}
                </span>
              ) : undefined,
          },
        ]}
      />

      {activeTab === "incubation" ? (
        apps.length === 0 ? (
          <EmptyState message={t("emptyIncubation")} className="mt-8" />
        ) : (
          <>
            {/* Mobile */}
            <MobileList
              className="mt-6 md:hidden"
              items={apps}
              renderCell={(a) => ({
                id: a.id,
                title: a.founder_name,
                meta: (
                  <>
                    <span className="block truncate">{a.founder_email}</span>
                    <span className="mt-1 block">
                      {a.company_name ?? "—"}
                      {a.company_stage ? ` · ${a.company_stage}` : ""}
                    </span>
                  </>
                ),
                trailing: (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] uppercase">
                    {a.status}
                  </span>
                ),
                href: `/${locale}/applications/${a.id}?type=incubation`,
              })}
            />

            {/* Desktop */}
            <div className="mt-6 hidden md:block">
              <DataTable
                columns={[
                  t("founder"),
                  t("company"),
                  t("stage"),
                  t("pitch"),
                  t("received"),
                  t("status"),
                ]}
              >
                {apps.map((a) => (
                  <DataTable.Row key={a.id} className="align-top">
                    <DataTable.Cell>
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
                        {a.country ?? "—"} · {a.locale.toUpperCase()}
                      </p>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <p className="font-medium">{a.company_name ?? "—"}</p>
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
                    </DataTable.Cell>
                    <DataTable.Cell className="text-xs text-muted-foreground">
                      {a.company_stage ?? "—"}
                      {a.funding_needed_cents != null && (
                        <p className="mt-1">
                          €{(a.funding_needed_cents / 100).toLocaleString()}
                        </p>
                      )}
                    </DataTable.Cell>
                    <DataTable.Cell className="max-w-md text-xs leading-5 text-muted-foreground">
                      {a.pitch.length > 240
                        ? a.pitch.slice(0, 240) + "…"
                        : a.pitch}
                    </DataTable.Cell>
                    <DataTable.Cell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString(locale)}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <StatusSelect
                        id={a.id}
                        locale={locale}
                        current={a.status}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </div>
          </>
        )
      ) : jobApps.length === 0 ? (
        <EmptyState message={t("emptyJobs")} className="mt-8" />
      ) : (
        <>
          {/* Mobile */}
          <MobileList
            className="mt-6 md:hidden"
            items={jobApps}
            renderCell={(a) => {
              const offers = a.job_offers as
                | { title_en: string; title_de: string | null; title_fr: string | null }[]
                | null;
              const jobTitle = offers?.[0]?.title_en ?? t("unknownPosition");
              return {
                id: a.id,
                title: a.applicant_name,
                meta: (
                  <>
                    <span className="block truncate">{a.applicant_email}</span>
                    <span className="mt-1 block">{jobTitle}</span>
                  </>
                ),
                trailing: (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] uppercase">
                    {a.status}
                  </span>
                ),
                href: `/${locale}/applications/${a.id}?type=job`,
              };
            }}
          />

          {/* Desktop */}
          <div className="mt-6 hidden md:block">
            <DataTable
              columns={[
                t("applicant"),
                t("job"),
                t("coverLetter"),
                t("received"),
                t("status"),
              ]}
            >
              {jobApps.map((a) => {
                const offers = a.job_offers as
                  | { title_en: string; title_de: string | null; title_fr: string | null }[]
                  | null;
                const jobTitle = offers?.[0]?.title_en ?? t("unknownPosition");
                return (
                  <DataTable.Row key={a.id} className="align-top">
                    <DataTable.Cell>
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
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <p className="font-medium">{jobTitle}</p>
                    </DataTable.Cell>
                    <DataTable.Cell className="max-w-md text-xs leading-5 text-muted-foreground">
                      {a.cover_letter
                        ? a.cover_letter.length > 240
                          ? a.cover_letter.slice(0, 240) + "…"
                          : a.cover_letter
                        : "—"}
                    </DataTable.Cell>
                    <DataTable.Cell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString(locale)}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <JobApplicationStatusSelect
                        id={a.id}
                        locale={locale}
                        current={a.status}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
