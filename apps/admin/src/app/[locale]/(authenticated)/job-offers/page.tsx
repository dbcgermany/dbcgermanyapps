import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getJobOffers, toggleJobOfferPublished } from "@/actions/job-offers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";

const T = {
  en: {
    title: "Job Offers", newJob: "New job offer", create: "Create job offer",
    empty: "No job offers yet.",
    colTitle: "Title", location: "Location", type: "Type",
    status: "Status", actions: "Actions",
    published: "Published", draft: "Draft",
    edit: "Edit", publish: "Publish", unpublish: "Unpublish",
    types: { full_time: "Full-time", part_time: "Part-time", freelance: "Freelance", internship: "Internship" } as Record<string, string>,
  },
  de: {
    title: "Stellenangebote", newJob: "Neue Stelle", create: "Stelle erstellen",
    empty: "Noch keine Stellenangebote.",
    colTitle: "Titel", location: "Ort", type: "Typ",
    status: "Status", actions: "Aktionen",
    published: "Veröffentlicht", draft: "Entwurf",
    edit: "Bearbeiten", publish: "Veröffentlichen", unpublish: "Zurückziehen",
    types: { full_time: "Vollzeit", part_time: "Teilzeit", freelance: "Freelance", internship: "Praktikum" } as Record<string, string>,
  },
  fr: {
    title: "Offres d’emploi", newJob: "Nouvelle offre", create: "Créer une offre",
    empty: "Aucune offre pour le moment.",
    colTitle: "Titre", location: "Lieu", type: "Type",
    status: "Statut", actions: "Actions",
    published: "Publié", draft: "Brouillon",
    edit: "Modifier", publish: "Publier", unpublish: "Dépublier",
    types: { full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance", internship: "Stage" } as Record<string, string>,
  },
} as const;

export default async function JobOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const jobs = await getJobOffers();

  return (
    <div>
      <PageHeader
        title={t.title}
        cta={
          <Link
            href={`/${locale}/job-offers/new`}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t.newJob}
          </Link>
        }
      />

      <div className="mt-8">
        <DataTable
          columns={[
            t.colTitle,
            t.location,
            t.type,
            t.status,
            { label: t.actions, align: "right" },
          ]}
          empty={
            <EmptyState
              message={t.empty}
              cta={{ label: t.create, href: `/${locale}/job-offers/new` }}
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
                {t.types[job.employment_type ?? ""] ?? job.employment_type ?? "—"}
              </DataTable.Cell>
              <DataTable.Cell>
                <Badge variant={job.is_published ? "success" : "warning"}>
                  {job.is_published ? t.published : t.draft}
                </Badge>
              </DataTable.Cell>
              <DataTable.Cell align="right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/${locale}/job-offers/${job.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {t.edit}
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
                      {job.is_published ? t.unpublish : t.publish}
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
