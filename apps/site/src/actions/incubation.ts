"use server";

import { sendIncubationApplicationConfirm } from "@dbc/email";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import {
  CONTACT_CATEGORY,
  INCUBATION_DISCOVERY_CHANNELS,
  INCUBATION_INDUSTRY_SECTORS,
  INCUBATION_PROFILE_TYPES,
  INCUBATION_SERVICES,
  type IncubationDiscoveryChannel,
  type IncubationIndustrySector,
  type IncubationProfileType,
  type IncubationService,
} from "@dbc/types";
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

function sanitizeEnum<T extends readonly string[]>(
  raw: string | null,
  allowed: T
): T[number] | null {
  if (!raw) return null;
  return (allowed as readonly string[]).includes(raw)
    ? (raw as T[number])
    : null;
}

function sanitizeMulti<T extends readonly string[]>(
  raws: string[],
  allowed: T
): T[number][] {
  const set = new Set<string>(allowed);
  return raws.filter((v) => set.has(v)) as T[number][];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitIncubationApplication(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const firstName = ((formData.get("founder_first_name") as string) || "").trim();
  const lastName = ((formData.get("founder_last_name") as string) || "").trim();
  const founderEmail = ((formData.get("founder_email") as string) || "").trim();
  const locale = ((formData.get("locale") as string) || "en") as Locale;

  if (!firstName || !lastName || !founderEmail) {
    return {
      error: "Please complete all required fields (first name, last name, email).",
    };
  }
  if (!EMAIL_RE.test(founderEmail)) {
    return { error: "Please enter a valid email address." };
  }

  const phone = ((formData.get("founder_phone") as string) || "").trim() || null;
  const country = ((formData.get("country") as string) || "").trim() || null;
  const title = sanitizeTitle((formData.get("title") as string) || null);
  const rawGender = sanitizeGender((formData.get("gender") as string) || null);
  const gender = impliedGenderFromTitle(title) ?? rawGender;
  const birthday = ((formData.get("birthday") as string) || "").trim() || null;
  // Derive age from the birthday so legacy readers of the age column still
  // see something sensible without the applicant ever typing a number. The
  // wizard only asks for the date; DB `founder_age` stays populated for
  // analytics continuity.
  const founderAge: number | null = (() => {
    if (!birthday) return null;
    const d = new Date(birthday);
    if (Number.isNaN(d.getTime())) return null;
    const years = (Date.now() - d.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
    return years >= 14 && years <= 120 ? Math.floor(years) : null;
  })();
  const founderName = [firstName, lastName].filter(Boolean).join(" ");

  const profileType = sanitizeEnum(
    (formData.get("profile_type") as string) || null,
    INCUBATION_PROFILE_TYPES
  ) as IncubationProfileType | null;
  const profileTypeOther =
    ((formData.get("profile_type_other") as string) || "").trim() || null;
  const hasIdeaRaw = (formData.get("has_idea") as string) || "";
  const hasIdea =
    hasIdeaRaw === "yes" ? true : hasIdeaRaw === "no" ? false : null;

  const ideaProblem = ((formData.get("idea_problem") as string) || "").trim() || null;
  const ideaAudience = ((formData.get("idea_audience") as string) || "").trim() || null;
  const ideaStage =
    ((formData.get("idea_development_stage") as string) || "").trim() || null;
  const ideaAmbitions =
    ((formData.get("idea_ambitions") as string) || "").trim() || null;

  const sectors = sanitizeMulti(
    formData.getAll("industry_sectors").map(String),
    INCUBATION_INDUSTRY_SECTORS
  ) as IncubationIndustrySector[];
  const sectorsOther =
    ((formData.get("industry_sectors_other") as string) || "").trim() || null;
  const priorRaw = (formData.get("has_prior_accompaniment") as string) || "";
  const hasPrior =
    priorRaw === "yes" ? true : priorRaw === "no" ? false : null;

  const services = sanitizeMulti(
    formData.getAll("services_wanted").map(String),
    INCUBATION_SERVICES
  ) as IncubationService[];
  const servicesOther =
    ((formData.get("services_wanted_other") as string) || "").trim() || null;
  const whyJoin = ((formData.get("why_join") as string) || "").trim() || null;
  const diasporaRaw = (formData.get("diaspora_link") as string) || "";
  const diasporaLink =
    diasporaRaw === "yes" ? true : diasporaRaw === "no" ? false : null;
  const diasporaCountry =
    ((formData.get("diaspora_origin_country") as string) || "").trim() || null;

  const heardAbout = sanitizeEnum(
    (formData.get("heard_about_us") as string) || null,
    INCUBATION_DISCOVERY_CHANNELS
  ) as IncubationDiscoveryChannel | null;
  const heardAboutOther =
    ((formData.get("heard_about_us_other") as string) || "").trim() || null;

  // pitch is now optional for "no idea" applicants; preserve the legacy
  // field by reusing idea_problem as the summary when has_idea = true.
  const pitch = hasIdea && ideaProblem ? ideaProblem : null;

  const supabase = await createServerClient();

  let contactId: string | null = null;
  try {
    const { data } = await supabase.rpc("upsert_contact_from_checkout", {
      p_email: founderEmail.toLowerCase(),
      p_first_name: firstName,
      p_last_name: lastName,
      p_country: country?.toUpperCase() ?? null,
      p_gender: gender,
      p_occupation: null,
      p_auto_category_slug: CONTACT_CATEGORY.founders,
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
    /* non-fatal: row is still written below */
  }

  const record = {
    founder_first_name: firstName,
    founder_last_name: lastName,
    founder_name: founderName,
    founder_email: founderEmail,
    founder_phone: phone,
    founder_gender: gender,
    founder_birthday: birthday,
    founder_age: founderAge,
    country,
    locale,
    pitch,
    status: "new" as const,
    contact_id: contactId,

    profile_type: profileType,
    profile_type_other: profileTypeOther,
    has_idea: hasIdea,

    idea_problem: ideaProblem,
    idea_audience: ideaAudience,
    idea_development_stage: ideaStage,
    idea_ambitions: ideaAmbitions,

    industry_sectors: sectors,
    industry_sectors_other: sectorsOther,
    has_prior_accompaniment: hasPrior,

    services_wanted: services,
    services_wanted_other: servicesOther,
    why_join: whyJoin,
    diaspora_link: diasporaLink,

    diaspora_origin_country: diasporaCountry,

    heard_about_us: heardAbout,
    heard_about_us_other: heardAboutOther,
  };

  const { error } = await supabase
    .from("incubation_applications")
    .insert(record);

  if (error) {
    return {
      error: "Failed to submit. Please try again or email info@dbc-germany.com.",
    };
  }

  try {
    if (process.env.RESEND_API_KEY) {
      await sendIncubationApplicationConfirm({
        to: founderEmail,
        applicantName: firstName || founderName,
        locale,
      });
    }
  } catch (err) {
    console.error("[incubation] confirmation email failed:", err);
  }

  try {
    await notifyAdmins(supabase, {
      type: "new_application",
      title: `New incubation application: ${founderName}`,
      body: `${founderName} (${founderEmail}) applied via /services/incubation/apply.`,
      data: {
        founder_email: founderEmail,
        profile_type: profileType,
        services_wanted: services,
      },
    });
  } catch (err) {
    console.error("[incubation] admin notification failed:", err);
  }

  return { success: true };
}
