"use server";

import { sendJobApplicationConfirm } from "@dbc/email";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";

type Locale = "en" | "de" | "fr";

export async function submitJobApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const applicantName = (formData.get("applicant_name") as string)?.trim() ?? "";
  const applicantEmail = (formData.get("applicant_email") as string)?.trim() ?? "";
  const coverLetter = (formData.get("cover_letter") as string)?.trim() ?? "";
  const jobOfferId = (formData.get("job_offer_id") as string) ?? "";
  const locale = ((formData.get("locale") as string) || "en") as Locale;

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

  // --- Fetch job title for emails / notifications ---
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

  // --- Send branded confirmation email to applicant ---
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
    // Non-blocking: log but don't fail the submission
    console.error("[job-apply] confirmation email failed:", err);
  }

  // --- Notify admin dashboard ---
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
