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
  assignee?: { display_name: string | null } | null;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: string;
  description: string | null;
  default_offset_days: number;
  estimated_cost_cents: number | null;
  sort_order: number;
  is_active: boolean;
}

export async function getEventChecklist(eventId: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_checklist_items")
    .select(
      "*, assignee:profiles!event_checklist_items_assigned_to_fkey(display_name)"
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);

  const items = (data ?? []) as ChecklistItem[];

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

export async function updateChecklistItem(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const eventId = formData.get("event_id") as string;

  const patch: Record<string, unknown> = {};
  const fields = [
    "title",
    "category",
    "description",
    "due_date",
    "notes",
    "assigned_to",
  ];
  for (const f of fields) {
    const raw = formData.get(f);
    if (raw !== null) {
      const val = typeof raw === "string" ? raw.trim() : "";
      patch[f] = val === "" ? null : val;
    }
  }
  if (formData.get("estimated_cost_eur") !== null) {
    const v = (formData.get("estimated_cost_eur") as string) || "";
    patch.estimated_cost_cents = v ? Math.round(parseFloat(v) * 100) : null;
  }
  if (formData.get("actual_cost_eur") !== null) {
    const v = (formData.get("actual_cost_eur") as string) || "";
    patch.actual_cost_cents = v ? Math.round(parseFloat(v) * 100) : null;
  }

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
    details: { fields: Object.keys(patch) },
  });

  revalidatePath(`/${locale}/events/${eventId}/checklist`);
  return { success: true };
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

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_checklist_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ChecklistTemplate[];
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
