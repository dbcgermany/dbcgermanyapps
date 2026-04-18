"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const SPONSOR_COLUMNS =
  "id, event_id, company_name, contact_name, contact_email, contact_phone, tier, deal_value_cents, currency, status, logo_url, website_url, deliverables, notes, sort_order, created_by, created_at" as const;

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

export async function createSponsor(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const locale = formData.get("locale") as string;
  const companyName = (formData.get("company_name") as string).trim();

  const sponsorData = {
    event_id: eventId,
    company_name: companyName,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
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

  const sponsorData = {
    company_name: companyName,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
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
