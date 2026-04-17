"use server";

import { createEmailClient } from "@dbc/email";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";

type Locale = "en" | "de" | "fr";

const CONFIRMATION_SUBJECT: Record<Locale, string> = {
  en: "Thank you for your application",
  de: "Vielen Dank f\u00FCr Ihre Bewerbung",
  fr: "Merci pour votre candidature",
};

function confirmationBody(name: string, jobTitle: string, locale: Locale): string {
  switch (locale) {
    case "de":
      return [
        `Hallo ${name},`,
        "",
        `vielen Dank f\u00FCr Ihre Bewerbung auf die Stelle "${jobTitle}".`,
        "Wir haben Ihre Unterlagen erhalten und werden sie sorgf\u00E4ltig pr\u00FCfen.",
        "Wir melden uns in K\u00FCrze bei Ihnen.",
        "",
        "Mit freundlichen Gr\u00FC\u00DFen,",
        "DBC Germany",
      ].join("\n");
    case "fr":
      return [
        `Bonjour ${name},`,
        "",
        `Merci pour votre candidature au poste de "${jobTitle}".`,
        "Nous avons bien re\u00E7u votre dossier et l\u2019examinerons attentivement.",
        "Nous reviendrons vers vous rapidement.",
        "",
        "Cordialement,",
        "DBC Germany",
      ].join("\n");
    default:
      return [
        `Hi ${name},`,
        "",
        `Thank you for applying to "${jobTitle}".`,
        "We\u2019ve received your application and will review it shortly.",
        "We\u2019ll be in touch soon.",
        "",
        "Best regards,",
        "DBC Germany",
      ].join("\n");
  }
}

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

  // --- Send confirmation email to applicant ---
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = createEmailClient();
      const from =
        process.env.RESEND_FROM_ADDRESS ??
        "DBC Germany <info@dbc-germany.com>";
      await resend.emails.send({
        from,
        to: applicantEmail,
        subject: CONFIRMATION_SUBJECT[locale],
        text: confirmationBody(applicantName, jobTitle, locale),
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
