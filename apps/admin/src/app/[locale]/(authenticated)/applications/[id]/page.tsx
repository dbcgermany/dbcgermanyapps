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

const T = {
  en: {
    back: "← Applications",
    incubationFrom: "Incubation application from",
    unknownPosition: "Unknown position",
    applicationFor: "Application for",
  },
  de: {
    back: "← Bewerbungen",
    incubationFrom: "Inkubations-Bewerbung von",
    unknownPosition: "Unbekannte Stelle",
    applicationFor: "Bewerbung für",
  },
  fr: {
    back: "← Candidatures",
    incubationFrom: "Candidature incubation de",
    unknownPosition: "Poste inconnu",
    applicationFor: "Candidature pour",
  },
} as const;

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
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
          {t.back}
        </Link>

        <PageHeader
          title={data.company_name || data.founder_name}
          description={`${t.incubationFrom} ${data.founder_name}`}
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
    ? jobOffers[0]?.title_en ?? t.unknownPosition
    : jobOffers?.title_en ?? t.unknownPosition;

  return (
    <div>
      <Link
        href={`/${locale}/applications?tab=jobs`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {t.back}
      </Link>

      <PageHeader
        title={data.applicant_name}
        description={`${t.applicationFor} ${jobTitle}`}
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
