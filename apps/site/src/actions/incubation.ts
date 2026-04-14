"use server";

import { createServerClient } from "@dbc/supabase/server";

export async function submitIncubationApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const founderName = (formData.get("founder_name") as string)?.trim() ?? "";
  const founderEmail = (formData.get("founder_email") as string)?.trim() ?? "";
  const pitch = (formData.get("pitch") as string)?.trim() ?? "";
  const locale = (formData.get("locale") as string) || "en";

  if (!founderName || !founderEmail || !pitch) {
    return {
      error:
        "Please complete all required fields (name, email, pitch).",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(founderEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (pitch.length < 80) {
    return {
      error: "Please share a bit more about your project (80 characters min).",
    };
  }

  const record = {
    founder_name: founderName,
    founder_email: founderEmail,
    founder_phone:
      ((formData.get("founder_phone") as string) || "").trim() || null,
    company_name:
      ((formData.get("company_name") as string) || "").trim() || null,
    company_stage:
      ((formData.get("company_stage") as string) || "").trim() || null,
    company_website:
      ((formData.get("company_website") as string) || "").trim() || null,
    country: ((formData.get("country") as string) || "").trim() || null,
    locale,
    pitch,
    funding_needed_cents: formData.get("funding_needed_eur")
      ? Math.round(
          parseFloat(formData.get("funding_needed_eur") as string) * 100
        )
      : null,
    status: "new" as const,
  };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("incubation_applications")
    .insert(record);

  if (error) {
    return { error: "Failed to submit. Please try again or email info@dbc-germany.com." };
  }

  return { success: true };
}
