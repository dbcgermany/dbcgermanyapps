"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export async function getJobApplications() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, job_offer_id, applicant_name, applicant_email, applicant_phone, cover_letter, linkedin_url, portfolio_url, locale, status, reviewer_id, reviewer_notes, created_at, updated_at, job_offers(title_en, title_de, title_fr)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function updateJobApplicationStatus(
  id: string,
  status: "new" | "reviewing" | "shortlisted" | "rejected" | "accepted",
  reviewerNotes?: string,
  locale?: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const patch: Record<string, unknown> = { status, reviewer_id: user.userId };
  if (typeof reviewerNotes === "string") patch.reviewer_notes = reviewerNotes;

  const { error } = await supabase
    .from("job_applications")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_job_application_status",
    entity_type: "job_applications",
    entity_id: id,
    details: { status, notes: reviewerNotes },
  });

  revalidatePath(`/${locale ?? "en"}/applications`);
  return { success: true };
}
