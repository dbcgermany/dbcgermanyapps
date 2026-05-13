import { getTranslations } from "next-intl/server";
import {
  getJobOffer,
  toggleJobOfferPublished,
  deleteJobOffer,
} from "@/actions/job-offers";
import { createServerClient } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { EditJobOfferForm } from "./edit-form";

const T = {
  en: { title: "Edit job offer", publish: "Publish", unpublish: "Unpublish", delete: "Delete" },
  de: { title: "Stelle bearbeiten", publish: "Veröffentlichen", unpublish: "Zurückziehen", delete: "Löschen" },
  fr: { title: "Modifier l’offre", publish: "Publier", unpublish: "Dépublier", delete: "Supprimer" },
} as const;

export default async function EditJobOfferPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [tBack, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);
  const job = await getJobOffer(id);

  // Count applications to decide whether to show delete
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_offer_id", id);
  const hasApplications = (count ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/job-offers`, label: tBack("jobOffers") }}
        cta={
          <div className="flex items-center gap-3">
            <ActionForm
              action={async () => {
                "use server";
                return toggleJobOfferPublished(id, locale);
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
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {job.is_published ? t.unpublish : t.publish}
              </button>
            </ActionForm>
            {!hasApplications && (
              <ActionForm
                action={async () => {
                  "use server";
                  return deleteJobOffer(id, locale);
                }}
                successToast={tCommon("deletedToast")}
                errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
              >
                <button
                  type="submit"
                  className="rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  {t.delete}
                </button>
              </ActionForm>
            )}
          </div>
        }
      />

      <EditJobOfferForm locale={locale} job={job} />
    </div>
  );
}
