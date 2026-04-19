import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
    incubationFrom: "Incubation application from",
    unknownPosition: "Unknown position",
    applicationFor: "Application for",
  },
  de: {
    incubationFrom: "Inkubations-Bewerbung von",
    unknownPosition: "Unbekannte Stelle",
    applicationFor: "Bewerbung für",
  },
  fr: {
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
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
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
        <PageHeader
          title={data.company_name || data.founder_name}
          description={`${t.incubationFrom} ${data.founder_name}`}
          back={{ href: `/${locale}/applications`, label: tBack("applications") }}
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
      <PageHeader
        title={data.applicant_name}
        description={`${t.applicationFor} ${jobTitle}`}
        back={{ href: `/${locale}/applications?tab=jobs`, label: tBack("applications") }}
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
