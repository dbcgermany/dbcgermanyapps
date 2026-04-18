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

  const supabase = await createServerClient();

  const phone =
    ((formData.get("founder_phone") as string) || "").trim() || null;
  const country =
    ((formData.get("country") as string) || "").trim() || null;
  const [firstName, ...rest] = founderName.trim().split(/\s+/);
  const lastName = rest.join(" ") || null;

  // Upsert the founder into contacts + tag as "founders" so they appear in
  // the admin People hub alongside other entities. Non-fatal if the RPC
  // fails — we still insert the application.
  let contactId: string | null = null;
  try {
    const { data } = await supabase.rpc("upsert_contact_from_checkout", {
      p_email: founderEmail.toLowerCase(),
      p_first_name: firstName || null,
      p_last_name: lastName,
      p_country: country?.toUpperCase() ?? null,
      p_gender: null,
      p_occupation: null,
      p_auto_category_slug: "founders",
      p_extra_category_slugs: [] as string[],
    });
    contactId = (data as string | null) ?? null;
    if (contactId && phone) {
      await supabase
        .from("contacts")
        .update({ phone })
        .eq("id", contactId);
    }
  } catch {
    /* non-fatal */
  }

  const record = {
    founder_name: founderName,
    founder_email: founderEmail,
    founder_phone: phone,
    company_name:
      ((formData.get("company_name") as string) || "").trim() || null,
    company_stage:
      ((formData.get("company_stage") as string) || "").trim() || null,
    company_website:
      ((formData.get("company_website") as string) || "").trim() || null,
    country,
    locale,
    pitch,
    funding_needed_cents: formData.get("funding_needed_eur")
      ? Math.round(
          parseFloat(formData.get("funding_needed_eur") as string) * 100
        )
      : null,
    status: "new" as const,
    contact_id: contactId,
  };

  const { error } = await supabase
    .from("incubation_applications")
    .insert(record);

  if (error) {
    return { error: "Failed to submit. Please try again or email info@dbc-germany.com." };
  }

  return { success: true };
}
