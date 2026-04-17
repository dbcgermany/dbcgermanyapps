"use server";

import { createServerClient } from "@dbc/supabase/server";

export async function submitJobApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const applicantName = (formData.get("applicant_name") as string)?.trim() ?? "";
  const applicantEmail = (formData.get("applicant_email") as string)?.trim() ?? "";
  const coverLetter = (formData.get("cover_letter") as string)?.trim() ?? "";
  const jobOfferId = (formData.get("job_offer_id") as string) ?? "";
  const locale = (formData.get("locale") as string) || "en";

  if (!applicantName || !applicantEmail) {
    return { error: "Please complete all required fields (name, email)." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (!coverLetter) {
    return { error: "Please include a cover letter." };
  }

  const record = {
    job_offer_id: jobOfferId,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone:
      ((formData.get("applicant_phone") as string) || "").trim() || null,
    cover_letter: coverLetter,
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

  return { success: true };
}
