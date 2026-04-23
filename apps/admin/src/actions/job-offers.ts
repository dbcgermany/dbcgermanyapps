"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pingRevalidate } from "@/lib/revalidate";

function jobPublicPaths(id?: string | null) {
  const paths = ["/[locale]/careers"];
  if (id) paths.push(`/[locale]/careers/${id}`);
  return paths;
}

const JOB_COLUMNS =
  "id, title_en, title_de, title_fr, description_en, description_de, description_fr, requirements_en, requirements_de, requirements_fr, location, employment_type, department, is_published, sort_order, created_at, updated_at" as const;

export async function getJobOffers() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select(JOB_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getJobOffer(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("job_offers")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createJobOffer(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const titleEn = (formData.get("title_en") as string).trim();

  const record = {
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    description_en: (formData.get("description_en") as string) || "",
    description_de:
      (formData.get("description_de") as string) ||
      (formData.get("description_en") as string) ||
      "",
    description_fr:
      (formData.get("description_fr") as string) ||
      (formData.get("description_en") as string) ||
      "",
    requirements_en: (formData.get("requirements_en") as string) || null,
    requirements_de: (formData.get("requirements_de") as string) || null,
    requirements_fr: (formData.get("requirements_fr") as string) || null,
    location: ((formData.get("location") as string) || "").trim() || null,
    employment_type:
      ((formData.get("employment_type") as string) || "").trim() || null,
    department:
      ((formData.get("department") as string) || "").trim() || null,
    is_published: false,
  };

  const { data, error } = await supabase
    .from("job_offers")
    .insert(record)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_job_offer",
    entity_type: "job_offers",
    entity_id: data.id,
    details: { title: titleEn },
  });

  revalidatePath(`/${locale}/job-offers`);
  await pingRevalidate("site", jobPublicPaths(data.id));
  redirect(`/${locale}/job-offers/${data.id}`);
}

export async function updateJobOffer(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const record = {
    title_en: formData.get("title_en") as string,
    title_de: formData.get("title_de") as string,
    title_fr: formData.get("title_fr") as string,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    requirements_en: (formData.get("requirements_en") as string) || null,
    requirements_de: (formData.get("requirements_de") as string) || null,
    requirements_fr: (formData.get("requirements_fr") as string) || null,
    location: ((formData.get("location") as string) || "").trim() || null,
    employment_type:
      ((formData.get("employment_type") as string) || "").trim() || null,
    department:
      ((formData.get("department") as string) || "").trim() || null,
  };

  const { error } = await supabase
    .from("job_offers")
    .update(record)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_job_offer",
    entity_type: "job_offers",
    entity_id: id,
    details: { title: record.title_en },
  });

  revalidatePath(`/${locale}/job-offers`);
  revalidatePath(`/${locale}/job-offers/${id}`);
  await pingRevalidate("site", jobPublicPaths(id));
  return { success: true };
}

export async function toggleJobOfferPublished(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: job } = await supabase
    .from("job_offers")
    .select("is_published, title_en")
    .eq("id", id)
    .single();
  if (!job) return { error: "Job offer not found" };

  const newPublished = !job.is_published;
  const { error } = await supabase
    .from("job_offers")
    .update({ is_published: newPublished })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: newPublished ? "publish_job_offer" : "unpublish_job_offer",
    entity_type: "job_offers",
    entity_id: id,
    details: { title: job.title_en },
  });

  revalidatePath(`/${locale}/job-offers`);
  await pingRevalidate("site", jobPublicPaths(id));
  return { success: true };
}

export async function deleteJobOffer(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  // Check for existing applications
  const { count } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_offer_id", id);

  if (count && count > 0) {
    return { error: "Cannot delete a job offer that has applications." };
  }

  const { data: job } = await supabase
    .from("job_offers")
    .select("title_en")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("job_offers").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_job_offer",
    entity_type: "job_offers",
    entity_id: id,
    details: { title: job?.title_en },
  });

  revalidatePath(`/${locale}/job-offers`);
  await pingRevalidate("site", jobPublicPaths(id));
  redirect(`/${locale}/job-offers`);
}
