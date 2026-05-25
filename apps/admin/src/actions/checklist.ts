"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  category: string;
  description: string | null;
  status: string;
  due_date: string | null;
  estimated_cost_cents: number | null;
  actual_cost_cents: number | null;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  /** FK to the runsheet item this prep activity serves (added 20260525000001). */
  runsheet_item_id: string | null;
  assignee?: { display_name: string | null } | null;
  /** Lightweight join of the linked runsheet row's title + time, for display only. */
  runsheet_item?: {
    id: string;
    title: string;
    starts_at: string;
    is_public: boolean;
  } | null;
}

/**
 * Compact projection of an event's runsheet rows for use in the checklist /
 * budget "Link to runsheet item" pickers. Mirrors the shape PersonListRow /
 * the existing provider_contact_id picker expects.
 */
export interface RunsheetPickerOption {
  id: string;
  title: string;
  starts_at: string;
  is_public: boolean;
}

export async function getEventChecklist(eventId: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();

  // IMPORTANT (feedback_postgrest_column_drift): keep the column list in
  // lockstep with event_checklist_items.Row in packages/types/src/database.ts.
  // The runsheet_item join is filtered to the same event_id implicitly via
  // the FK relationship — PostgREST embeds the linked row by id.
  const { data, error } = await supabase
    .from("event_checklist_items")
    .select(
      "*, assignee:profiles!event_checklist_items_assigned_to_fkey(display_name), runsheet_item:event_runsheet_items!event_checklist_items_runsheet_item_id_fkey(id, title, starts_at, is_public)"
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((row) => ({
    ...row,
    assignee: Array.isArray(row.assignee) ? row.assignee[0] ?? null : row.assignee ?? null,
    runsheet_item: Array.isArray(row.runsheet_item)
      ? row.runsheet_item[0] ?? null
      : row.runsheet_item ?? null,
  })) as ChecklistItem[];

  // Compute progress per category
  const categories = new Map<
    string,
    { total: number; done: number; overdue: number }
  >();
  const today = new Date().toISOString().slice(0, 10);

  for (const item of items) {
    const cat = categories.get(item.category) ?? {
      total: 0,
      done: 0,
      overdue: 0,
    };
    cat.total++;
    if (item.status === "done" || item.status === "skipped") cat.done++;
    if (
      item.due_date &&
      item.due_date < today &&
      item.status !== "done" &&
      item.status !== "skipped"
    )
      cat.overdue++;
    categories.set(item.category, cat);
  }

  const totalDone = items.filter(
    (i) => i.status === "done" || i.status === "skipped"
  ).length;
  const totalOverdue = items.filter(
    (i) =>
      i.due_date &&
      i.due_date < today &&
      i.status !== "done" &&
      i.status !== "skipped"
  ).length;
  const totalEstimatedCents = items.reduce(
    (sum, i) => sum + (i.estimated_cost_cents ?? 0),
    0
  );
  const totalActualCents = items.reduce(
    (sum, i) => sum + (i.actual_cost_cents ?? 0),
    0
  );

  return {
    items,
    progress: {
      total: items.length,
      done: totalDone,
      overdue: totalOverdue,
      categories: Object.fromEntries(categories),
      estimatedCostCents: totalEstimatedCents,
      actualCostCents: totalActualCents,
    },
  };
}

export async function createChecklistItem(
  eventId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return { error: "Title is required." };

  const { error } = await supabase.from("event_checklist_items").insert({
    event_id: eventId,
    title,
    category: (formData.get("category") as string) || "other",
    description:
      ((formData.get("description") as string) || "").trim() || null,
    due_date: (formData.get("due_date") as string) || null,
    estimated_cost_cents: formData.get("estimated_cost_eur")
      ? Math.round(
          parseFloat(formData.get("estimated_cost_eur") as string) * 100
        )
      : null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    notes: ((formData.get("notes") as string) || "").trim() || null,
    runsheet_item_id:
      ((formData.get("runsheet_item_id") as string) || "").trim() || null,
  });

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_checklist_item",
    entity_type: "event_checklist_items",
    entity_id: eventId,
    details: { title },
  });

  revalidatePath(`/${locale}/events/${eventId}/checklist`);
  return { success: true };
}

export async function updateChecklistItem(
  id: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const eventId = (formData.get("event_id") as string) || "";

  const patch: Record<string, unknown> = {};

  // String fields — empty string becomes NULL so admins can clear them.
  const stringFields = [
    "title",
    "category",
    "description",
    "notes",
    "due_date",
    "assigned_to",
    "runsheet_item_id",
  ];
  for (const f of stringFields) {
    const raw = formData.get(f);
    if (raw !== null) {
      const val = typeof raw === "string" ? raw.trim() : "";
      patch[f] = val === "" ? null : val;
    }
  }

  // Estimated cost: euros input → cents column.
  const estRaw = formData.get("estimated_cost_eur");
  if (estRaw !== null) {
    const num = parseFloat((estRaw as string) || "");
    patch.estimated_cost_cents = Number.isFinite(num) ? Math.round(num * 100) : null;
  }
  // Actual cost: same pattern.
  const actRaw = formData.get("actual_cost_eur");
  if (actRaw !== null) {
    const num = parseFloat((actRaw as string) || "");
    patch.actual_cost_cents = Number.isFinite(num) ? Math.round(num * 100) : null;
  }

  if (Object.keys(patch).length === 0) return { success: true };

  const { error } = await supabase
    .from("event_checklist_items")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_checklist_item",
    entity_type: "event_checklist_items",
    entity_id: id,
    details: { fields: Object.keys(patch), event_id: eventId },
  });

  if (eventId) {
    revalidatePath(`/${locale}/events/${eventId}/checklist`);
  }
  return { success: true };
}

/**
 * Compact list of an event's runsheet items for the "Link to runsheet item"
 * picker in the checklist + budget forms. Single source — used by both.
 */
export async function getRunsheetPickerOptionsForEvent(
  eventId: string
): Promise<RunsheetPickerOption[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .select("id, title, starts_at, is_public")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as RunsheetPickerOption[];
}

export async function toggleChecklistStatus(
  id: string,
  newStatus: "pending" | "in_progress" | "done" | "skipped",
  eventId: string,
  locale: string
) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const patch: Record<string, unknown> = { status: newStatus };
  if (newStatus === "done") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = user.userId;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }

  const { error } = await supabase
    .from("event_checklist_items")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${locale}/events/${eventId}/checklist`);
  revalidatePath(`/${locale}/events/${eventId}`);
  return { success: true };
}

export async function deleteChecklistItem(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_checklist_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_checklist_item",
    entity_type: "event_checklist_items",
    entity_id: id,
  });

  revalidatePath(`/${locale}/events/${eventId}/checklist`);
  return { success: true };
}

export async function populateChecklistFromTemplate(
  eventId: string,
  eventStartsAt: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: templates } = await supabase
    .from("event_checklist_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!templates || templates.length === 0)
    return { error: "No templates found." };

  const startsAt = new Date(eventStartsAt);
  const items = templates.map((t) => {
    const dueDate = new Date(startsAt);
    dueDate.setDate(dueDate.getDate() + t.default_offset_days);
    return {
      event_id: eventId,
      title: t.title,
      category: t.category,
      description: t.description,
      due_date: dueDate.toISOString().slice(0, 10),
      estimated_cost_cents: t.estimated_cost_cents,
      sort_order: t.sort_order,
      status: "pending",
    };
  });

  const { error } = await supabase
    .from("event_checklist_items")
    .insert(items);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "populate_checklist",
    entity_type: "event_checklist_items",
    entity_id: eventId,
    details: { count: items.length },
  });

  revalidatePath(`/${locale}/events/${eventId}/checklist`);
  return { success: true };
}
