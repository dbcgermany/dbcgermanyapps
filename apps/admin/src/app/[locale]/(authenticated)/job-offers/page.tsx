import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getJobOffers, toggleJobOfferPublished } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Internship",
};

export default async function JobOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const jobs = await getJobOffers();

  return (
    <div>
      <PageHeader
        title="Job Offers"
        cta={
          <Link
            href={`/${locale}/job-offers/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New job offer
          </Link>
        }
      />

      <div className="mt-8">
        <DataTable
          columns={[
            "Title",
            "Location",
            "Type",
            "Status",
            { label: "Actions", align: "right" },
          ]}
          empty={
            <EmptyState
              message="No job offers yet."
              cta={{ label: "Create job offer", href: `/${locale}/job-offers/new` }}
            />
          }
        >
          {jobs.map((job) => (
            <DataTable.Row key={job.id}>
              <DataTable.Cell>
                <p className="font-medium">{job.title_en}</p>
                {job.department && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.department}
                  </p>
                )}
              </DataTable.Cell>
              <DataTable.Cell>{job.location ?? "—"}</DataTable.Cell>
              <DataTable.Cell>
                {TYPE_LABELS[job.employment_type ?? ""] ?? job.employment_type ?? "—"}
              </DataTable.Cell>
              <DataTable.Cell>
                <Badge variant={job.is_published ? "success" : "warning"}>
                  {job.is_published ? "Published" : "Draft"}
                </Badge>
              </DataTable.Cell>
              <DataTable.Cell align="right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/${locale}/job-offers/${job.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Edit
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
                      {job.is_published ? "Unpublish" : "Publish"}
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
