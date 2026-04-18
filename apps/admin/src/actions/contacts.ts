"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

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
  limit?: number;
} = {}): Promise<ContactListRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

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
