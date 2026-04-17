"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const APP_COLUMNS =
  "id, founder_name, founder_email, founder_phone, company_name, company_stage, company_website, country, locale, pitch, funding_needed_cents, status, reviewer_id, reviewer_notes, created_at, updated_at" as const;

export async function getIncubationApplications(filter?: {
  status?: string;
}) {
  await requireRole("manager");
  const supabase = await createServerClient();
  let query = supabase
    .from("incubation_applications")
    .select(APP_COLUMNS)
    .order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getIncubationApplication(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("incubation_applications")
    .select(`${APP_COLUMNS}, reviewer:profiles!incubation_applications_reviewer_id_fkey(display_name)`)
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Application not found");
  return data;
}

export async function updateApplicationStatus(
  id: string,
  status: "new" | "reviewing" | "shortlisted" | "rejected" | "accepted",
  locale: string,
  notes?: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const patch: Record<string, unknown> = { status, reviewer_id: user.userId };
  if (typeof notes === "string") patch.reviewer_notes = notes;

  const { error } = await supabase
    .from("incubation_applications")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_application_status",
    entity_type: "incubation_applications",
    entity_id: id,
    details: { status, notes },
  });

  revalidatePath(`/${locale}/applications`);
  return { success: true };
}
