"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FUNNEL_CTA_TYPES,
  FUNNEL_STATUS_VALUES,
  type FunnelContent,
  type FunnelCtaType,
  type FunnelStatus,
} from "@dbc/types";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

function funnelPublicPaths(slug: string) {
  return [`/[locale]/f/${slug}`];
}

const BRAND_BUCKET = "brand-assets";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FUNNEL_COLUMNS =
  "id, slug, status, cta_type, cta_href, hero_image_url, content_en, content_de, content_fr, seo_title, seo_description, og_image_url, linked_event_id, created_at, updated_at, published_at" as const;

export type FunnelRow = {
  id: string;
  slug: string;
  status: FunnelStatus;
  cta_type: FunnelCtaType;
  cta_href: string | null;
  hero_image_url: string | null;
  content_en: Partial<FunnelContent>;
  content_de: Partial<FunnelContent>;
  content_fr: Partial<FunnelContent>;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  linked_event_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type FunnelListRow = FunnelRow & {
  views_7d: number;
  cta_clicks_7d: number;
};

export type FunnelInput = {
  slug: string;
  status: FunnelStatus;
  cta_type: FunnelCtaType;
  cta_href: string | null;
  hero_image_url: string | null;
  content_en: Partial<FunnelContent>;
  content_de: Partial<FunnelContent>;
  content_fr: Partial<FunnelContent>;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  linked_event_id: string | null;
};

export type FunnelEventOption = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
};

export async function listFunnelEventOptions(
  locale: string
): Promise<FunnelEventOption[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, slug, title_en, title_de, title_fr, starts_at, is_published")
    .order("starts_at", { ascending: false });
  const l = locale === "de" ? "de" : locale === "fr" ? "fr" : "en";
  return ((data ?? []) as Array<{
    id: string;
    slug: string;
    title_en: string;
    title_de: string | null;
    title_fr: string | null;
    starts_at: string;
  }>).map((e) => ({
    id: e.id,
    slug: e.slug,
    title:
      (l === "de" ? e.title_de : l === "fr" ? e.title_fr : e.title_en) ||
      e.title_en,
    starts_at: e.starts_at,
  }));
}

function assertStatus(value: string): FunnelStatus {
  if (!(FUNNEL_STATUS_VALUES as readonly string[]).includes(value)) {
    throw new Error(`Invalid funnel status: ${value}`);
  }
  return value as FunnelStatus;
}

function assertCtaType(value: string): FunnelCtaType {
  if (!(FUNNEL_CTA_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Invalid funnel cta_type: ${value}`);
  }
  return value as FunnelCtaType;
}

export async function listFunnels(): Promise<FunnelListRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("funnels")
    .select(FUNNEL_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as FunnelRow[];

  // Pull last-7-days event counts in one query so the list page can show
  // per-row Views / Clicks chips without N+1 lookups.
  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("funnel_events")
    .select("funnel_id, event_type")
    .gte("happened_at", sinceIso);

  const counts = new Map<string, { views: number; clicks: number }>();
  for (const e of (events ?? []) as {
    funnel_id: string;
    event_type: string;
  }[]) {
    const current = counts.get(e.funnel_id) ?? { views: 0, clicks: 0 };
    if (e.event_type === "view") current.views += 1;
    else if (e.event_type === "cta_click") current.clicks += 1;
    counts.set(e.funnel_id, current);
  }

  return rows.map((r) => {
    const c = counts.get(r.id) ?? { views: 0, clicks: 0 };
    return { ...r, views_7d: c.views, cta_clicks_7d: c.clicks };
  });
}

export async function getFunnel(id: string): Promise<FunnelRow> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("funnels")
    .select(FUNNEL_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as FunnelRow;
}

export async function createFunnel(input: FunnelInput) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const baseSlug = slugify(input.slug || input.content_en.hero?.title || "funnel", "funnel");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "funnels", baseSlug);

  const status = assertStatus(input.status);
  const cta_type = assertCtaType(input.cta_type);

  const record = {
    slug,
    status,
    cta_type,
    cta_href: cta_type === "external_link" ? (input.cta_href || null) : null,
    hero_image_url: input.hero_image_url || null,
    content_en: input.content_en ?? {},
    content_de: input.content_de ?? {},
    content_fr: input.content_fr ?? {},
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    og_image_url: input.og_image_url || null,
    linked_event_id: input.linked_event_id || null,
    created_by: user.userId,
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("funnels")
    .insert(record)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_funnel",
    entity_type: "funnels",
    entity_id: data.id,
    details: { slug, cta_type, status },
  });

  await pingRevalidate("site", funnelPublicPaths(slug));
  return { success: true as const, id: data.id, slug };
}

export async function updateFunnel(id: string, input: FunnelInput) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const status = assertStatus(input.status);
  const cta_type = assertCtaType(input.cta_type);

  const record: Record<string, unknown> = {
    status,
    cta_type,
    cta_href: cta_type === "external_link" ? (input.cta_href || null) : null,
    hero_image_url: input.hero_image_url || null,
    content_en: input.content_en ?? {},
    content_de: input.content_de ?? {},
    content_fr: input.content_fr ?? {},
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    og_image_url: input.og_image_url || null,
    linked_event_id: input.linked_event_id || null,
  };

  const rawSlug = (input.slug ?? "").trim();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record.slug = await uniqueSlug(supabase as any, "funnels", slugify(rawSlug, "funnel"), id);
  }

  // If transitioning to published and published_at is null, stamp it.
  if (status === "published") {
    const { data: existing } = await supabase
      .from("funnels")
      .select("published_at")
      .eq("id", id)
      .single();
    if (!existing?.published_at) {
      record.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase.from("funnels").update(record).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_funnel",
    entity_type: "funnels",
    entity_id: id,
    details: { slug: record.slug ?? null, status, cta_type },
  });

  const { data: slugRow } = await supabase
    .from("funnels")
    .select("slug")
    .eq("id", id)
    .single();
  if (slugRow?.slug) await pingRevalidate("site", funnelPublicPaths(slugRow.slug));
  return { success: true as const };
}

export async function publishFunnel(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("funnels")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "publish_funnel",
    entity_type: "funnels",
    entity_id: id,
  });
  revalidatePath(`/${locale}/funnels`);
  revalidatePath(`/${locale}/funnels/${id}`);
  const { data: row } = await supabase
    .from("funnels")
    .select("slug")
    .eq("id", id)
    .single();
  if (row?.slug) await pingRevalidate("site", funnelPublicPaths(row.slug));
  return { success: true as const };
}

export async function unpublishFunnel(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("funnels")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "unpublish_funnel",
    entity_type: "funnels",
    entity_id: id,
  });
  revalidatePath(`/${locale}/funnels`);
  revalidatePath(`/${locale}/funnels/${id}`);
  const { data: row } = await supabase
    .from("funnels")
    .select("slug")
    .eq("id", id)
    .single();
  if (row?.slug) await pingRevalidate("site", funnelPublicPaths(row.slug));
  return { success: true as const };
}

export async function archiveFunnel(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { data: row } = await supabase
    .from("funnels")
    .select("slug")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("funnels")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "archive_funnel",
    entity_type: "funnels",
    entity_id: id,
  });
  revalidatePath(`/${locale}/funnels`);
  if (row?.slug) await pingRevalidate("site", funnelPublicPaths(row.slug));
  redirect(`/${locale}/funnels`);
}

export type FunnelKpis = {
  views: number;
  cta_clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
  top_sources: { source: string; clicks: number }[];
};

export async function getFunnelKpis(
  id: string,
  windowDays: 7 | 30 | null
): Promise<FunnelKpis> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const sinceIso =
    windowDays === null
      ? new Date(0).toISOString()
      : new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("get_funnel_kpis", {
    p_funnel_id: id,
    p_since: sinceIso,
  });
  if (error) throw new Error(error.message);
  const raw = (data ?? {}) as {
    views?: number;
    cta_clicks?: number;
    conversions?: number;
    top_sources?: { source: string; clicks: number }[];
  };
  const views = raw.views ?? 0;
  const cta_clicks = raw.cta_clicks ?? 0;
  const conversions = raw.conversions ?? 0;
  return {
    views,
    cta_clicks,
    conversions,
    ctr: views > 0 ? cta_clicks / views : 0,
    conversion_rate: views > 0 ? conversions / views : 0,
    top_sources: raw.top_sources ?? [],
  };
}

export async function uploadFunnelHeroImage(formData: FormData) {
  await requireRole("manager");
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") return { error: "No file provided" };
  if (file.size > 50 * 1024 * 1024) return { error: "File larger than 50 MB" };
  if (!file.type.startsWith("image/")) return { error: "Only image files" };

  const { toWebp } = await import("@/lib/webp");
  const { buffer, contentType, extension } = await toWebp(file);
  const path = `funnels/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const service = getServiceClient();
  const { error: uploadError } = await service.storage
    .from(BRAND_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data } = service.storage.from(BRAND_BUCKET).getPublicUrl(path);
  return { success: true as const, url: data.publicUrl };
}
