import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, LinkButton } from "@dbc/ui";
import { getJobOffers, toggleJobOfferPublished } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";

export default async function JobOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.jobOffers.list" });
  const jobs = await getJobOffers();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={
          <LinkButton href={`/${locale}/job-offers/new`}>
            {t("newJob")}
          </LinkButton>
        }
      />

      <div className="mt-8">
        <DataTable
          columns={[
            t("colTitle"),
            t("location"),
            t("type"),
            t("status"),
            { label: t("actions"), align: "right" },
          ]}
          empty={
            <EmptyState
              message={t("empty")}
              cta={{ label: t("create"), href: `/${locale}/job-offers/new` }}
            />
          }
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
                  <form
                    action={async () => {
                      "use server";
                      await toggleJobOfferPublished(job.id, locale);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {job.is_published ? t("unpublish") : t("publish")}
                    </button>
                  </form>
                </div>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
