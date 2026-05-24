import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@dbc/ui";
import { getJobOffers, toggleJobOfferPublished } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { MobileList } from "@/components/mobile-list";
import { ActionForm } from "@/components/action-form";
import { AddButton } from "@/components/add-button";

export default async function JobOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.jobOffers.list" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);
  const jobs = await getJobOffers();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={
          <AddButton href={`/${locale}/job-offers/new`} label={t("newJob")} />
        }
      />

      {jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            message={t("empty")}
            cta={{ label: t("create"), href: `/${locale}/job-offers/new` }}
          />
        </div>
      ) : (
        <>
          {/* Mobile: shared MobileList */}
          <MobileList
            className="mt-8 md:hidden"
            items={jobs}
            renderCell={(job) => ({
              id: job.id,
              title: job.title_en,
              meta: (
                <span>
                  {job.location && <span>{job.location}</span>}
                  {job.location && job.employment_type && " · "}
                  {job.employment_type && (
                    <span>{t(`types.${job.employment_type}`)}</span>
                  )}
                </span>
              ),
              trailing: (
                <Badge variant={job.is_published ? "success" : "warning"}>
                  {job.is_published ? t("published") : t("draft")}
                </Badge>
              ),
              href: `/${locale}/job-offers/${job.id}`,
            })}
          />

          {/* Desktop: shared DataTable */}
          <div className="mt-8 hidden md:block">
            <DataTable
              columns={[
                t("colTitle"),
                t("location"),
                t("type"),
                t("status"),
                { label: t("actions"), align: "right" },
              ]}
            >
          {jobs.map((job) => (
            <DataTable.Row key={job.id}>
              <DataTable.Cell>
                <Link href={`/${locale}/job-offers/${job.id}`} className="font-medium hover:text-primary">{job.title_en}</Link>
                {job.department && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.department}
                  </p>
                )}
              </DataTable.Cell>
              <DataTable.Cell>{job.location ?? "—"}</DataTable.Cell>
              <DataTable.Cell>
                {job.employment_type ? t(`types.${job.employment_type}`) : "—"}
              </DataTable.Cell>
              <DataTable.Cell>
                <Badge variant={job.is_published ? "success" : "warning"}>
                  {job.is_published ? t("published") : t("draft")}
                </Badge>
              </DataTable.Cell>
              <DataTable.Cell align="right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/${locale}/job-offers/${job.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {t("edit")}
                  </Link>
                  <ActionForm
                    action={async () => {
                      "use server";
                      return toggleJobOfferPublished(job.id, locale);
                    }}
                    successToast={
                      job.is_published
                        ? tCommon("unpublishedToast")
                        : tCommon("publishedToast")
                    }
                    errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
                  >
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {job.is_published ? t("unpublish") : t("publish")}
                    </button>
                  </ActionForm>
                </div>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
