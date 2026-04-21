"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  GENDER_VALUES,
  TITLE_VALUES,
  impliedGenderFromTitle,
  type Gender,
  type Title,
} from "@dbc/ui";
import { revalidatePath } from "next/cache";
import {
  INVOLVEMENT_ROLES,
  type InvolvementRole,
  type InvolvementRow,
} from "@/lib/involvements";

export interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  birthday: string | null;
  gender: string | null;
  occupation: string | null;
  phone: string | null;
  marketing_consent: boolean;
  marketing_consent_confirmed_at: string | null;
  marketing_consent_source: string | null;
  unsubscribed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactCategory {
  id: string;
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
}

export interface ContactListRow extends Contact {
  categories: Array<Pick<ContactCategory, "slug" | "name_en" | "color">>;
  orders_count: number;
  tickets_count: number;
}

export async function listContacts(filters: {
  search?: string;
  categorySlug?: string;
  marketingOnly?: boolean;
  eventId?: string;
  role?: InvolvementRole;
  limit?: number;
} = {}): Promise<ContactListRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

  // If filtering by event (and optionally role), resolve matching contact IDs first.
  let involvementContactIds: string[] | null = null;
  if (filters.eventId) {
    let invQuery = supabase
      .from("contact_event_involvements")
      .select("contact_id")
      .eq("event_id", filters.eventId);
    if (filters.role) invQuery = invQuery.eq("role", filters.role);
    const { data: involvements } = await invQuery;
    involvementContactIds = Array.from(
      new Set((involvements ?? []).map((i) => i.contact_id as string))
    );
    if (involvementContactIds.length === 0) return [];
  }

  let query = supabase
    .from("contacts")
    .select(
      `id, email, first_name, last_name, country, birthday, gender, occupation,
       phone, marketing_consent, marketing_consent_confirmed_at,
       marketing_consent_source, unsubscribed_at, admin_notes, created_at, updated_at,
       links:contact_category_links(
         category:contact_categories(slug, name_en, color)
       ),
       orders(count),
       tickets(count)`
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (involvementContactIds) {
    query = query.in("id", involvementContactIds);
  }
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    query = query.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`
    );
  }
  if (filters.marketingOnly) {
    query = query.eq("marketing_consent", true).is("unsubscribed_at", null);
  }

  const { data } = await query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).map((c) => ({
    ...c,
    categories: (c.links ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => l.category)
      .filter(Boolean),
    orders_count: c.orders?.[0]?.count ?? 0,
    tickets_count: c.tickets?.[0]?.count ?? 0,
  }));

  if (filters.categorySlug) {
    return rows.filter((r) =>
      r.categories.some(
        (cat: { slug: string }) => cat.slug === filters.categorySlug
      )
    );
  }
  return rows;
}

/**
 * Used to populate the event filter dropdown on the contacts list page.
 * Returns events sorted by start date descending (most recent / upcoming first).
 */
export async function listEventsForContactFilter(): Promise<
  Array<{ id: string; title_en: string; starts_at: string }>
> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, title_en, starts_at")
    .order("starts_at", { ascending: false })
    .limit(200);
  return (data as Array<{ id: string; title_en: string; starts_at: string }>) ?? [];
}

/**
 * Add a contact <-> event involvement (sponsor / partner / contractor / …).
 * Safe to call from anywhere — deduped by the (contact_id, event_id, role)
 * UNIQUE constraint via upsert.
 */
export async function addInvolvement(params: {
  contactId: string;
  eventId: string;
  role: InvolvementRole;
  notes?: string | null;
}) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("contact_event_involvements")
    .upsert(
      {
        contact_id: params.contactId,
        event_id: params.eventId,
        role: params.role,
        notes: params.notes ?? null,
        added_by: user.userId,
      },
      { onConflict: "contact_id,event_id,role", ignoreDuplicates: false }
    );
  if (error) return { error: error.message };
  revalidatePath(`/[locale]/contacts/${params.contactId}`, "layout");
  revalidatePath(`/[locale]/contacts`, "layout");
  return { success: true as const };
}

export async function removeInvolvement(id: string, contactId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("contact_event_involvements")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/[locale]/contacts/${contactId}`, "layout");
  revalidatePath(`/[locale]/contacts`, "layout");
  return { success: true as const };
}

export async function listContactInvolvements(
  contactId: string
): Promise<InvolvementRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("contact_event_involvements")
    .select(
      "id, contact_id, event_id, role, notes, created_at, event:events(id, title_en, starts_at)"
    )
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]) as InvolvementRow[];
}

/**
 * Manually create a contact from the admin "New contact" form.
 * Dedupes by email: if a contact already exists with that email, updates
 * first/last/country/phone/etc. and reuses the row. Optionally adds an
 * event involvement at the same time.
 */
export async function createContact(formData: FormData): Promise<
  { success: true; id: string } | { error: string }
> {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const firstName = ((formData.get("first_name") as string) || "").trim();
  const lastName = ((formData.get("last_name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const country = ((formData.get("country") as string) || "").trim() || null;
  const occupation =
    ((formData.get("occupation") as string) || "").trim() || null;
  const notes = ((formData.get("admin_notes") as string) || "").trim() || null;
  const categorySlug =
    ((formData.get("category_slug") as string) || "").trim() || null;
  const eventId =
    ((formData.get("event_id") as string) || "").trim() || null;
  const roleRaw = ((formData.get("role") as string) || "").trim();
  const role = (INVOLVEMENT_ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as InvolvementRole)
    : null;

  // New SSOT person fields — mirror the incubation action's sanitization.
  const titleRaw = ((formData.get("title") as string) || "").trim();
  const title = (TITLE_VALUES as readonly string[]).includes(titleRaw)
    ? (titleRaw as Title)
    : null;
  const genderRaw = ((formData.get("gender") as string) || "").trim();
  const rawGender = (GENDER_VALUES as readonly string[]).includes(genderRaw)
    ? (genderRaw as Gender)
    : null;
  const gender = impliedGenderFromTitle(title) ?? rawGender;
  const birthday =
    ((formData.get("birthday") as string) || "").trim() || null;
  const organization =
    ((formData.get("organization") as string) || "").trim() || null;
  const linkedinUrl =
    ((formData.get("linkedin_url") as string) || "").trim() || null;
  const addressLine1 =
    ((formData.get("address_line_1") as string) || "").trim() || null;
  const addressLine2 =
    ((formData.get("address_line_2") as string) || "").trim() || null;
  const postalCode =
    ((formData.get("postal_code") as string) || "").trim() || null;
  const city = ((formData.get("city") as string) || "").trim() || null;
  const stateRegion =
    ((formData.get("state_region") as string) || "").trim() || null;

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email is required." };
  }

  const { data: upsertedId, error: rpcError } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_country: country?.toUpperCase() ?? null,
      p_gender: gender,
      p_occupation: occupation,
      p_auto_category_slug: categorySlug,
      p_extra_category_slugs: [] as string[],
    }
  );
  if (rpcError || !upsertedId) {
    return { error: rpcError?.message ?? "Failed to create contact." };
  }
  const contactId = upsertedId as string;

  // Persist every field the RPC doesn't accept. All columns are nullable,
  // so we only set keys that have a value and leave the rest untouched.
  const patch: Record<string, unknown> = {};
  if (phone) patch.phone = phone;
  if (notes) patch.admin_notes = notes;
  if (title) patch.title = title;
  if (birthday) patch.birthday = birthday;
  if (organization) patch.organization = organization;
  if (linkedinUrl) patch.linkedin_url = linkedinUrl;
  if (addressLine1) patch.address_line_1 = addressLine1;
  if (addressLine2) patch.address_line_2 = addressLine2;
  if (postalCode) patch.postal_code = postalCode;
  if (city) patch.city = city;
  if (stateRegion) patch.state_region = stateRegion;
  if (Object.keys(patch).length > 0) {
    await supabase.from("contacts").update(patch).eq("id", contactId);
  }

  if (eventId && role) {
    await supabase
      .from("contact_event_involvements")
      .upsert(
        {
          contact_id: contactId,
          event_id: eventId,
          role,
          added_by: user.userId,
        },
        { onConflict: "contact_id,event_id,role", ignoreDuplicates: false }
      );
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_contact_manual",
    entity_type: "contacts",
    entity_id: contactId,
    details: { email, eventId, role },
  });

  revalidatePath(`/[locale]/contacts`, "layout");
  return { success: true as const, id: contactId };
}

export async function getContact(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();
  if (!contact) throw new Error("Contact not found.");

  const [
    { data: categories },
    { data: allCategories },
    { data: orders },
    { data: tickets },
    { data: sponsorships },
    { data: applications },
    involvements,
    eventsList,
  ] = await Promise.all([
    supabase
      .from("contact_category_links")
      .select("category:contact_categories(id, slug, name_en, color, is_system)")
      .eq("contact_id", id),
    supabase
      .from("contact_categories")
      .select("id, slug, name_en, color, is_system, sort_order")
      .order("sort_order"),
    supabase
      .from("orders")
      .select(
        "id, status, acquisition_type, payment_method, total_cents, currency, created_at, event:events(id, title_en, starts_at)"
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tickets")
      .select(
        `id, ticket_token, attendee_name, attendee_email, checked_in_at, created_at,
         event:events(id, title_en, starts_at),
         tier:ticket_tiers(name_en),
         order:orders(acquisition_type, status),
         checked_in_by_profile:profiles!tickets_checked_in_by_fkey(display_name)`
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_sponsors")
      .select(
        "id, company_name, tier, status, deal_value_cents, currency, created_at, event:events(id, title_en, starts_at)"
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("incubation_applications")
      .select(
        "id, founder_name, company_name, company_stage, status, created_at, pitch, funding_needed_cents"
      )
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    listContactInvolvements(id),
    listEventsForContactFilter(),
  ]);

  return {
    contact: contact as Contact,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linkedCategories: ((categories ?? []) as any[]).map((l) => l.category).filter(Boolean),
    allCategories: (allCategories ?? []) as ContactCategory[],
    orders: orders ?? [],
    tickets: tickets ?? [],
    sponsorships: sponsorships ?? [],
    applications: applications ?? [],
    involvements,
    eventsList,
  };
}

export async function updateContactProfile(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const patch: Record<string, string | null> = {};
  const fields = [
    "first_name",
    "last_name",
    "country",
    "birthday",
    "gender",
    "occupation",
    "phone",
    "admin_notes",
  ];
  for (const f of fields) {
    const raw = formData.get(f);
    const val = typeof raw === "string" ? raw.trim() : "";
    patch[f] = val === "" ? null : val;
  }

  const { error } = await supabase.from("contacts").update(patch).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_contact",
    entity_type: "contacts",
    entity_id: id,
    details: { fields: Object.keys(patch) },
  });

  revalidatePath(`/[locale]/contacts/${id}`, "layout");
  return { success: true };
}

export async function toggleContactCategory(
  contactId: string,
  categoryId: string,
  linked: boolean
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  if (linked) {
    const { error } = await supabase
      .from("contact_category_links")
      .delete()
      .eq("contact_id", contactId)
      .eq("category_id", categoryId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("contact_category_links")
      .insert({ contact_id: contactId, category_id: categoryId, added_by: user.userId });
    if (error) return { error: error.message };
  }

  revalidatePath(`/[locale]/contacts/${contactId}`, "layout");
  return { success: true };
}

export async function deleteContact(id: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_contact",
    entity_type: "contacts",
    entity_id: id,
  });

  revalidatePath("/[locale]/contacts", "layout");
  return { success: true };
}
