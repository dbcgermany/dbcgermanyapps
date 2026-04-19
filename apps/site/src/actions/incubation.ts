"use server";

import { createServerClient } from "@dbc/supabase/server";
import {
  GENDER_VALUES,
  TITLE_VALUES,
  impliedGenderFromTitle,
  type Gender,
  type Title,
} from "@dbc/ui";

function sanitizeGender(raw: string | null): Gender | null {
  if (!raw) return null;
  return (GENDER_VALUES as readonly string[]).includes(raw)
    ? (raw as Gender)
    : null;
}

function sanitizeTitle(raw: string | null): Title | null {
  if (!raw) return null;
  return (TITLE_VALUES as readonly string[]).includes(raw)
    ? (raw as Title)
    : null;
}

export async function submitIncubationApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const firstName =
    ((formData.get("founder_first_name") as string) || "").trim();
  const lastName =
    ((formData.get("founder_last_name") as string) || "").trim();
  const founderEmail =
    ((formData.get("founder_email") as string) || "").trim();
  const pitch = ((formData.get("pitch") as string) || "").trim();
  const locale = (formData.get("locale") as string) || "en";

  if (!firstName || !lastName || !founderEmail || !pitch) {
    return {
      error:
        "Please complete all required fields (first name, last name, email, pitch).",
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
  const title = sanitizeTitle((formData.get("title") as string) || null);
  const rawGender = sanitizeGender((formData.get("gender") as string) || null);
  const gender = impliedGenderFromTitle(title) ?? rawGender;
  const birthday =
    ((formData.get("birthday") as string) || "").trim() || null;
  const founderName = [firstName, lastName].filter(Boolean).join(" ");

  let contactId: string | null = null;
  try {
    const { data } = await supabase.rpc("upsert_contact_from_checkout", {
      p_email: founderEmail.toLowerCase(),
      p_first_name: firstName || null,
      p_last_name: lastName || null,
      p_country: country?.toUpperCase() ?? null,
      p_gender: gender,
      p_occupation: null,
      p_auto_category_slug: "founders",
      p_extra_category_slugs: [] as string[],
    });
    contactId = (data as string | null) ?? null;
    if (contactId) {
      const patch: Record<string, unknown> = {};
      if (phone) patch.phone = phone;
      if (title) patch.title = title;
      if (birthday) patch.birthday = birthday;
      if (Object.keys(patch).length > 0) {
        await supabase.from("contacts").update(patch).eq("id", contactId);
      }
    }
  } catch {
    /* non-fatal */
  }

  const record = {
    founder_first_name: firstName,
    founder_last_name: lastName,
    founder_name: founderName,
    founder_email: founderEmail,
    founder_phone: phone,
    founder_gender: gender,
    founder_birthday: birthday,
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
