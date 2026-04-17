import Link from "next/link";
import { notFound } from "next/navigation";
import { getIncubationApplication } from "@/actions/applications";
import { getJobApplication } from "@/actions/job-applications";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@dbc/ui";
import { ApplicationDetailClient } from "./application-detail-client";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "info" | "accent"> = {
  new: "info",
  reviewing: "warning",
  shortlisted: "accent",
  accepted: "success",
  rejected: "error",
};

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale, id } = await params;
  const { type } = await searchParams;
  const appType = type === "job" ? "job" : "incubation";

  if (appType === "incubation") {
    let data;
    try {
      data = await getIncubationApplication(id);
    } catch {
      notFound();
    }

    return (
      <div>
        <Link
          href={`/${locale}/applications`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Applications
        </Link>

        <PageHeader
          title={data.company_name || data.founder_name}
          description={`Incubation application from ${data.founder_name}`}
          cta={
            <Badge variant={STATUS_VARIANT[data.status] ?? "default"}>
              {data.status}
            </Badge>
          }
        />

        <ApplicationDetailClient
          type="incubation"
          data={data}
          locale={locale}
        />
      </div>
    );
  }

  // Job application
  let data;
  try {
    data = await getJobApplication(id);
  } catch {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobOffers = data.job_offers as any;
  const jobTitle = Array.isArray(jobOffers)
    ? jobOffers[0]?.title_en ?? "Unknown position"
    : jobOffers?.title_en ?? "Unknown position";

  return (
    <div>
      <Link
        href={`/${locale}/applications?tab=jobs`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Applications
      </Link>

      <PageHeader
        title={data.applicant_name}
        description={`Application for ${jobTitle}`}
        cta={
          <Badge variant={STATUS_VARIANT[data.status] ?? "default"}>
            {data.status}
          </Badge>
        }
      />

      <ApplicationDetailClient
        type="job"
        data={data}
        locale={locale}
      />
    </div>
  );
}
