import {
  getJobOffer,
  toggleJobOfferPublished,
  deleteJobOffer,
} from "@/actions/job-offers";
import { createServerClient } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EditJobOfferForm } from "./edit-form";

export default async function EditJobOfferPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
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
        title="Edit job offer"
        cta={
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server";
                await toggleJobOfferPublished(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {job.is_published ? "Unpublish" : "Publish"}
              </button>
            </form>
            {!hasApplications && (
              <form
                action={async () => {
                  "use server";
                  await deleteJobOffer(id, locale);
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </form>
            )}
          </div>
        }
      />

      <EditJobOfferForm locale={locale} job={job} />
    </div>
  );
}
