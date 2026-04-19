"use server";

import { sendJobApplicationConfirm } from "@dbc/email";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import {
  GENDER_VALUES,
  TITLE_VALUES,
  impliedGenderFromTitle,
  type Gender,
  type Title,
} from "@dbc/ui";

type Locale = "en" | "de" | "fr";

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

export async function submitJobApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const firstName = ((formData.get("applicant_first_name") as string) || "").trim();
  const lastName = ((formData.get("applicant_last_name") as string) || "").trim();
  const applicantEmail = ((formData.get("applicant_email") as string) || "").trim();
  const coverLetter = ((formData.get("cover_letter") as string) || "").trim();
  const jobOfferId = (formData.get("job_offer_id") as string) ?? "";
  const locale = ((formData.get("locale") as string) || "en") as Locale;

  if (!firstName || !lastName || !applicantEmail) {
    return { error: "Please complete all required fields (first name, last name, email)." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (!coverLetter) {
    return { error: "Please include a cover letter." };
  }

  const title = sanitizeTitle((formData.get("title") as string) || null);
  const rawGender = sanitizeGender((formData.get("gender") as string) || null);
  const gender = impliedGenderFromTitle(title) ?? rawGender;
  const birthday = ((formData.get("birthday") as string) || "").trim() || null;
  const country = ((formData.get("country") as string) || "").trim() || null;
  const applicantName = [firstName, lastName].filter(Boolean).join(" ");

  const record = {
    job_offer_id: jobOfferId,
    applicant_first_name: firstName,
    applicant_last_name: lastName,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone:
      ((formData.get("applicant_phone") as string) || "").trim() || null,
    applicant_gender: gender,
    applicant_birthday: birthday,
    applicant_country: country,
    cover_letter: coverLetter,
    resume_url:
      ((formData.get("resume_url") as string) || "").trim() || null,
    linkedin_url:
      ((formData.get("linkedin_url") as string) || "").trim() || null,
    portfolio_url:
      ((formData.get("portfolio_url") as string) || "").trim() || null,
    locale,
    status: "new" as const,
  };

  const supabase = await createServerClient();
  const { error } = await supabase.from("job_applications").insert(record);

  if (error) {
    return {
      error: "Failed to submit. Please try again or email info@dbc-germany.com.",
    };
  }

  const titleCol = `title_${locale}` as const;
  const { data: jobOffer } = await supabase
    .from("job_offers")
    .select("title_en, title_de, title_fr")
    .eq("id", jobOfferId)
    .single();

  const jobTitle =
    (jobOffer as Record<string, string | null> | null)?.[titleCol] ??
    jobOffer?.title_en ??
    "the open position";

  try {
    if (process.env.RESEND_API_KEY) {
      await sendJobApplicationConfirm({
        to: applicantEmail,
        applicantName,
        jobTitle,
        locale,
      });
    }
  } catch (err) {
    console.error("[job-apply] confirmation email failed:", err);
  }

  try {
    await notifyAdmins(supabase, {
      type: "new_application",
      title: `New application: ${jobTitle}`,
      body: `${applicantName} (${applicantEmail}) applied for "${jobTitle}".`,
      data: { job_offer_id: jobOfferId, applicant_email: applicantEmail },
    });
  } catch (err) {
    console.error("[job-apply] admin notification failed:", err);
  }

  return { success: true };
}
