"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const SPONSOR_COLUMNS =
  "id, event_id, company_name, contact_name, contact_first_name, contact_last_name, contact_email, contact_phone, tier, deal_value_cents, currency, status, logo_url, website_url, deliverables, notes, sort_order, created_by, created_at" as const;

export async function getEventSponsors(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_sponsors")
    .select(SPONSOR_COLUMNS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function upsertSponsorContact(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  firstName: string | null,
  lastName: string | null,
  contactEmail: string | null,
  contactPhone: string | null
): Promise<string | null> {
  if (!contactEmail?.trim()) return null;
  const { data: contactId } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: contactEmail.trim().toLowerCase(),
      p_first_name: firstName,
      p_last_name: lastName,
      p_country: null,
      p_gender: null,
      p_occupation: null,
      p_auto_category_slug: "partners",
      p_extra_category_slugs: [] as string[],
    }
  );
  if (contactId && contactPhone) {
    await supabase
      .from("contacts")
      .update({ phone: contactPhone.trim() })
      .eq("id", contactId as string);
  }
  return (contactId as string) ?? null;
}

function readSponsorContact(formData: FormData) {
  const first = ((formData.get("contact_first_name") as string) || "").trim();
  const last = ((formData.get("contact_last_name") as string) || "").trim();
  return {
    first_name: first || null,
    last_name: last || null,
  };
}

export async function createSponsor(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const locale = formData.get("locale") as string;
  const companyName = (formData.get("company_name") as string).trim();

  const { data: maxRow } = await supabase
    .from("event_sponsors")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = ((maxRow?.sort_order as number | undefined) ?? 0) + 10;

  const contactNames = readSponsorContact(formData);
  const contactEmail = (formData.get("contact_email") as string) || null;
  const contactPhone = (formData.get("contact_phone") as string) || null;
  const contactId = await upsertSponsorContact(
    supabase,
    contactNames.first_name,
    contactNames.last_name,
    contactEmail,
    contactPhone
  );

  const sponsorData = {
    event_id: eventId,
    company_name: companyName,
    contact_first_name: contactNames.first_name,
    contact_last_name: contactNames.last_name,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    tier: formData.get("tier") as string,
    deal_value_cents: formData.get("deal_value_cents")
      ? Math.round(
          parseFloat(formData.get("deal_value_cents") as string) * 100
        )
      : null,
    currency: (formData.get("currency") as string) || "EUR",
    status: (formData.get("status") as string) || "lead",
    logo_url: (formData.get("logo_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    deliverables: (formData.get("deliverables") as string) || null,
    notes: (formData.get("notes") as string) || null,
    sort_order: nextSort,
    contact_id: contactId,
    created_by: user.userId,
  };

  const { data, error } = await supabase
    .from("event_sponsors")
    .insert(sponsorData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_sponsor",
    entity_type: "event_sponsors",
    entity_id: data.id,
    details: { company_name: companyName, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/sponsors`);
  return { success: true };
}

export async function updateSponsor(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const companyName = (formData.get("company_name") as string).trim();

  const contactNames = readSponsorContact(formData);
  const contactEmail = (formData.get("contact_email") as string) || null;
  const contactPhone = (formData.get("contact_phone") as string) || null;
  const contactId = await upsertSponsorContact(
    supabase,
    contactNames.first_name,
    contactNames.last_name,
    contactEmail,
    contactPhone
  );

  const sponsorData = {
    company_name: companyName,
    contact_first_name: contactNames.first_name,
    contact_last_name: contactNames.last_name,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    tier: formData.get("tier") as string,
    deal_value_cents: formData.get("deal_value_cents")
      ? Math.round(
          parseFloat(formData.get("deal_value_cents") as string) * 100
        )
      : null,
    currency: (formData.get("currency") as string) || "EUR",
    status: (formData.get("status") as string) || "lead",
    logo_url: (formData.get("logo_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    deliverables: (formData.get("deliverables") as string) || null,
    notes: (formData.get("notes") as string) || null,
    ...(contactId ? { contact_id: contactId } : {}),
  };

  const { error } = await supabase
    .from("event_sponsors")
    .update(sponsorData)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_sponsor",
    entity_type: "event_sponsors",
    entity_id: id,
    details: { company_name: companyName, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/sponsors`);
  return { success: true };
}

export async function deleteSponsor(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_sponsors")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_sponsor",
    entity_type: "event_sponsors",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/sponsors`);
  return { success: true };
}
