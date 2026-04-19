"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export type DashboardAd = {
  id: string;
  title_en: string;
  title_de: string | null;
  title_fr: string | null;
  subtitle_en: string | null;
  subtitle_de: string | null;
  subtitle_fr: string | null;
  cta_label_en: string | null;
  cta_label_de: string | null;
  cta_label_fr: string | null;
  cta_url: string | null;
  image_url: string;
  accent_color: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, title_en, title_de, title_fr, subtitle_en, subtitle_de, subtitle_fr, cta_label_en, cta_label_de, cta_label_fr, cta_url, image_url, accent_color, is_active, sort_order, starts_at, ends_at, created_by, created_at, updated_at" as const;

/** Super-admin only — list every ad including drafts / expired, for the admin UI. */
export async function listDashboardAds(): Promise<DashboardAd[]> {
  await requireRole("super_admin");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("dashboard_ads")
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DashboardAd[]) ?? [];
}

/**
 * Any authenticated staff — fetch the live rotator feed. RLS already filters
 * to active + in-window rows; this action merely exposes a typed reader.
 */
export async function getActiveDashboardAds(): Promise<DashboardAd[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("dashboard_ads")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as DashboardAd[]) ?? [];
}

function parseRecord(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k);
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length ? t : null;
  };
  const bool = (k: string) => {
    const v = formData.get(k);
    return v === "on" || v === "true";
  };
  const num = (k: string, fallback: number) => {
    const v = formData.get(k);
    if (typeof v !== "string" || !v.trim()) return fallback;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    title_en: (str("title_en") ?? "").trim(),
    title_de: str("title_de"),
    title_fr: str("title_fr"),
    subtitle_en: str("subtitle_en"),
    subtitle_de: str("subtitle_de"),
    subtitle_fr: str("subtitle_fr"),
    cta_label_en: str("cta_label_en"),
    cta_label_de: str("cta_label_de"),
    cta_label_fr: str("cta_label_fr"),
    cta_url: str("cta_url"),
    image_url: (str("image_url") ?? "").trim(),
    accent_color: str("accent_color"),
    is_active: bool("is_active"),
    sort_order: num("sort_order", 0),
    starts_at: str("starts_at"),
    ends_at: str("ends_at"),
  };
}

export async function createDashboardAd(formData: FormData) {
  const user = await requireRole("super_admin");
  const record = parseRecord(formData);

  if (!record.title_en) return { error: "Title (EN) is required." };
  if (!record.image_url) return { error: "Image URL is required." };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("dashboard_ads")
    .insert({ ...record, created_by: user.userId })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_dashboard_ad",
    entity_type: "dashboard_ads",
    entity_id: data.id,
    details: { title: record.title_en },
  });

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/ads", "page");
  return { success: true as const, id: data.id };
}

export async function updateDashboardAd(id: string, formData: FormData) {
  const user = await requireRole("super_admin");
  const record = parseRecord(formData);

  if (!record.title_en) return { error: "Title (EN) is required." };
  if (!record.image_url) return { error: "Image URL is required." };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("dashboard_ads")
    .update(record)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_dashboard_ad",
    entity_type: "dashboard_ads",
    entity_id: id,
    details: { title: record.title_en },
  });

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/ads", "page");
  return { success: true as const };
}

export async function toggleDashboardAdActive(id: string) {
  const user = await requireRole("super_admin");
  const supabase = await createServerClient();
  const { data: current } = await supabase
    .from("dashboard_ads")
    .select("is_active, title_en")
    .eq("id", id)
    .single();
  if (!current) return { error: "Ad not found." };

  const next = !current.is_active;
  const { error } = await supabase
    .from("dashboard_ads")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: next ? "activate_dashboard_ad" : "deactivate_dashboard_ad",
    entity_type: "dashboard_ads",
    entity_id: id,
    details: { title: current.title_en },
  });

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/ads", "page");
  return { success: true as const, is_active: next };
}

export async function deleteDashboardAd(id: string) {
  const user = await requireRole("super_admin");
  const supabase = await createServerClient();
  const { data: existing } = await supabase
    .from("dashboard_ads")
    .select("title_en")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("dashboard_ads").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_dashboard_ad",
    entity_type: "dashboard_ads",
    entity_id: id,
    details: { title: existing?.title_en ?? null },
  });

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/ads", "page");
  return { success: true as const };
}

export async function reorderDashboardAds(orderedIds: string[]) {
  const user = await requireRole("super_admin");
  const supabase = await createServerClient();

  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("dashboard_ads")
        .update({ sort_order: (index + 1) * 10 })
        .eq("id", id)
    )
  );
  const failed = updates.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "reorder_dashboard_ads",
    entity_type: "dashboard_ads",
    entity_id: null,
    details: { order: orderedIds },
  });

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/ads", "page");
  return { success: true as const };
}
