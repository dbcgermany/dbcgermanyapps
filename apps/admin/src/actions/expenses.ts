"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { captureServerError } from "@/lib/observe";

// The active-locale description is mirrored into the legacy `description`
// column so other code paths that read it (CSV export, audit log details,
// older report queries) keep working.
// IMPORTANT (feedback_postgrest_column_drift): keep this list in lockstep
// with event_expenses.Row in packages/types/src/database.ts. PostgREST
// validates these strings only at runtime — a typo here = production 500.
const EXPENSE_COLUMNS =
  "id, event_id, category, description, description_en, description_de, description_fr, amount_cents, currency, vendor_name, vendor_contact, provider_contact_id, runsheet_item_id, due_date, paid_at, receipt_url, notes, created_by, created_at" as const;

type Locale = "en" | "de" | "fr";

function asLocale(value: string | null | undefined): Locale {
  return value === "de" || value === "fr" ? value : "en";
}

function pickActive(descriptions: {
  en: string | null;
  de: string | null;
  fr: string | null;
}, locale: Locale): string {
  return (
    descriptions[locale] ??
    descriptions.fr ??
    descriptions.en ??
    descriptions.de ??
    ""
  );
}

export interface ExpenseRow {
  id: string;
  event_id: string;
  category: string;
  description: string;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  amount_cents: number;
  currency: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  provider_contact_id: string | null;
  provider_name: string | null;
  /** FK to the runsheet row this spend pays for (added 20260525000001). */
  runsheet_item_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Single-row fetch for the dedicated `/events/[id]/budget/[expenseId]`
 * detail page. Same columns + RLS gate as the list query.
 */
export async function getExpense(
  expenseId: string
): Promise<ExpenseRow | null> {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    captureServerError(new Error(error.message), {
      scope: "expenses:getExpense",
      data: { id: expenseId, code: error.code },
    });
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    event_id: data.event_id,
    category: data.category,
    description: data.description,
    description_en: data.description_en,
    description_de: data.description_de,
    description_fr: data.description_fr,
    amount_cents: data.amount_cents,
    currency: data.currency,
    vendor_name: data.vendor_name,
    vendor_contact: data.vendor_contact,
    provider_contact_id: data.provider_contact_id,
    provider_name: null, // detail page joins separately if needed
    runsheet_item_id: data.runsheet_item_id,
    due_date: data.due_date,
    paid_at: data.paid_at,
    receipt_url: data.receipt_url,
    notes: data.notes,
    created_at: data.created_at,
  };
}

export async function getEventExpenses(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  // First try the join. If it fails (e.g. PostgREST can't resolve the
  // embedded FK name in the current schema cache), fall back to the
  // un-joined query so the page still renders — provider names just
  // come back null. The original exception still goes to Sentry.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any[] | null = null;
  const joined = await supabase
    .from("event_expenses")
    .select(
      `${EXPENSE_COLUMNS}, provider:contacts!event_expenses_provider_contact_id_fkey(first_name, last_name, email)`
    )
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (joined.error) {
    captureServerError(new Error(joined.error.message), {
      scope: "expenses:getEventExpenses:join",
      data: { event_id: eventId, code: joined.error.code },
    });
    const plain = await supabase
      .from("event_expenses")
      .select(EXPENSE_COLUMNS)
      .eq("event_id", eventId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (plain.error) {
      captureServerError(new Error(plain.error.message), {
        scope: "expenses:getEventExpenses:plain",
        data: { event_id: eventId, code: plain.error.code },
      });
      return {
        expenses: [] as ExpenseRow[],
        totalCents: 0,
        paidCents: 0,
        unpaidCents: 0,
        overdueCents: 0,
        count: 0,
      };
    }
    data = plain.data;
  } else {
    data = joined.data;
  }

  const expenses: ExpenseRow[] = (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rel = (row as any).provider;
    const provider = Array.isArray(rel) ? rel[0] ?? null : rel ?? null;
    const providerName = provider
      ? [provider.first_name, provider.last_name].filter(Boolean).join(" ") ||
        provider.email
      : null;
    return {
      id: row.id,
      event_id: row.event_id,
      category: row.category,
      description: row.description,
      description_en: row.description_en,
      description_de: row.description_de,
      description_fr: row.description_fr,
      amount_cents: row.amount_cents,
      currency: row.currency,
      vendor_name: row.vendor_name,
      vendor_contact: row.vendor_contact,
      provider_contact_id: row.provider_contact_id,
      provider_name: providerName,
      runsheet_item_id: row.runsheet_item_id,
      due_date: row.due_date,
      paid_at: row.paid_at,
      receipt_url: row.receipt_url,
      notes: row.notes,
      created_at: row.created_at,
    };
  });

  const totalCents = expenses.reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );
  const paidCents = expenses
    .filter((e) => e.paid_at)
    .reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
  const unpaidCents = totalCents - paidCents;
  const today = new Date().toISOString().slice(0, 10);
  const overdueCents = expenses
    .filter((e) => !e.paid_at && e.due_date && e.due_date < today)
    .reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);

  return {
    expenses,
    totalCents,
    paidCents,
    unpaidCents,
    overdueCents,
    count: expenses.length,
  };
}

export async function getProviderContactOptions() {
  try {
    await requireRole("manager");
    const supabase = await createServerClient();

    // Contacts tagged "service_providers". Fetch only the IDs and names we
    // need for the typeahead — no email volume here, this is just a picker.
    // maybeSingle (not single) so a missing category returns null instead
    // of throwing — the picker simply has no options.
    const catRes = await supabase
      .from("contact_categories")
      .select("id")
      .eq("slug", "service_providers")
      .maybeSingle();
    if (catRes.error) {
      captureServerError(new Error(catRes.error.message), {
        scope: "expenses:getProviderContactOptions:category",
        data: { code: catRes.error.code },
      });
      return [];
    }
    if (!catRes.data) return [];

    type ContactPickerRow = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    };
    type LinkRow = {
      contact: ContactPickerRow | ContactPickerRow[] | null;
    };

    const linkRes = await supabase
      .from("contact_category_links")
      .select("contact:contacts(id, first_name, last_name, email)")
      .eq("category_id", catRes.data.id)
      .limit(500);
    if (linkRes.error) {
      captureServerError(new Error(linkRes.error.message), {
        scope: "expenses:getProviderContactOptions:links",
        data: { code: linkRes.error.code },
      });
      return [];
    }

    return ((linkRes.data ?? []) as unknown as LinkRow[])
      .map((row): { id: string; label: string } | null => {
        const c = Array.isArray(row.contact) ? row.contact[0] : row.contact;
        if (!c) return null;
        const personName =
          [c.first_name, c.last_name].filter(Boolean).join(" ") ||
          c.email ||
          c.id;
        return { id: c.id, label: personName };
      })
      .filter((r): r is { id: string; label: string } => r !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    captureServerError(err, {
      scope: "expenses:getProviderContactOptions:catch",
    });
    return [];
  }
}

export async function createExpense(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const locale = asLocale(formData.get("locale") as string);
  const description_en = ((formData.get("description_en") as string) || "").trim();
  const description_de = ((formData.get("description_de") as string) || "").trim();
  const description_fr = ((formData.get("description_fr") as string) || "").trim();

  if (!description_en && !description_de && !description_fr) {
    return { error: "At least one description (EN, DE or FR) is required." };
  }

  const active = pickActive(
    {
      en: description_en || null,
      de: description_de || null,
      fr: description_fr || null,
    },
    locale
  );

  const amountRaw = parseFloat((formData.get("amount") as string) || "0");
  if (!Number.isFinite(amountRaw) || amountRaw < 0) {
    return { error: "Amount must be a positive number." };
  }

  const dueDateRaw = (formData.get("due_date") as string) || "";
  const paidAtRaw = (formData.get("paid_at") as string) || "";
  const providerIdRaw = (formData.get("provider_contact_id") as string) || "";
  const runsheetItemIdRaw = (formData.get("runsheet_item_id") as string) || "";

  const expenseData = {
    event_id: eventId,
    category: (formData.get("category") as string) || "other",
    description: active,
    description_en: description_en || null,
    description_de: description_de || null,
    description_fr: description_fr || null,
    amount_cents: Math.round(amountRaw * 100),
    currency: (formData.get("currency") as string) || "EUR",
    vendor_name: ((formData.get("vendor_name") as string) || "").trim() || null,
    vendor_contact:
      ((formData.get("vendor_contact") as string) || "").trim() || null,
    provider_contact_id: providerIdRaw || null,
    runsheet_item_id: runsheetItemIdRaw || null,
    due_date: dueDateRaw || null,
    paid_at: paidAtRaw || null,
    receipt_url:
      ((formData.get("receipt_url") as string) || "").trim() || null,
    notes: ((formData.get("notes") as string) || "").trim() || null,
    created_by: user.userId,
  };

  const { data, error } = await supabase
    .from("event_expenses")
    .insert(expenseData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_expense",
    entity_type: "event_expenses",
    entity_id: data.id,
    details: { description: active, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/budget`);
  return { success: true };
}

export async function updateExpense(
  id: string,
  eventId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const locale = asLocale(formData.get("locale") as string);
  const description_en = ((formData.get("description_en") as string) || "").trim();
  const description_de = ((formData.get("description_de") as string) || "").trim();
  const description_fr = ((formData.get("description_fr") as string) || "").trim();

  if (!description_en && !description_de && !description_fr) {
    return { error: "At least one description (EN, DE or FR) is required." };
  }

  const active = pickActive(
    {
      en: description_en || null,
      de: description_de || null,
      fr: description_fr || null,
    },
    locale
  );

  const amountRaw = parseFloat((formData.get("amount") as string) || "0");
  if (!Number.isFinite(amountRaw) || amountRaw < 0) {
    return { error: "Amount must be a positive number." };
  }

  const providerIdRaw = (formData.get("provider_contact_id") as string) || "";
  const runsheetItemIdRaw = (formData.get("runsheet_item_id") as string) || "";
  const patch = {
    category: (formData.get("category") as string) || "other",
    description: active,
    description_en: description_en || null,
    description_de: description_de || null,
    description_fr: description_fr || null,
    amount_cents: Math.round(amountRaw * 100),
    vendor_name: ((formData.get("vendor_name") as string) || "").trim() || null,
    vendor_contact:
      ((formData.get("vendor_contact") as string) || "").trim() || null,
    provider_contact_id: providerIdRaw || null,
    runsheet_item_id: runsheetItemIdRaw || null,
    due_date: ((formData.get("due_date") as string) || "") || null,
    paid_at: ((formData.get("paid_at") as string) || "") || null,
    receipt_url:
      ((formData.get("receipt_url") as string) || "").trim() || null,
    notes: ((formData.get("notes") as string) || "").trim() || null,
  };

  const { error } = await supabase
    .from("event_expenses")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_expense",
    entity_type: "event_expenses",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/budget`);
  return { success: true };
}

export async function markExpensePaid(
  id: string,
  eventId: string,
  locale: string,
  paidAt?: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const paid_at = paidAt && paidAt.length > 0 ? paidAt : new Date().toISOString();

  const { error } = await supabase
    .from("event_expenses")
    .update({ paid_at })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "mark_expense_paid",
    entity_type: "event_expenses",
    entity_id: id,
    details: { event_id: eventId, paid_at },
  });

  revalidatePath(`/${asLocale(locale)}/events/${eventId}/budget`);
  return { success: true };
}

export async function markExpenseUnpaid(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_expenses")
    .update({ paid_at: null })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "mark_expense_unpaid",
    entity_type: "event_expenses",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${asLocale(locale)}/events/${eventId}/budget`);
  return { success: true };
}

export async function deleteExpense(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_expenses")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_expense",
    entity_type: "event_expenses",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${asLocale(locale)}/events/${eventId}/budget`);
  return { success: true };
}
