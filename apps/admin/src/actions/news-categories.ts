"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

// Category writes affect the public /news index, every category landing page,
// and the sitemap. Revalidate the index + the touched category path(s).
const categoryPaths = (slug?: string) =>
  slug ? ["/[locale]/news", `/[locale]/news/category/${slug}`] : ["/[locale]/news"];

// NOTE: not exported — a non-async export in a "use server" file passes local
// tsc but breaks the Vercel/Turbopack build. Keep module-local.
const NEWS_CATEGORY_COLUMNS =
  "id, slug, name_en, name_de, name_fr, description_en, description_de, description_fr, seo_title_en, seo_title_de, seo_title_fr, seo_description_en, seo_description_de, seo_description_fr, color, image_url, sort_order, created_at";

export async function getNewsCategories() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news_categories")
    .select(NEWS_CATEGORY_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

function readCategoryForm(formData: FormData) {
  const nameEn = (formData.get("name_en") as string).trim();
  return {
    nameEn,
    record: {
      name_en: nameEn,
      name_de: (formData.get("name_de") as string)?.trim() || null,
      name_fr: (formData.get("name_fr") as string)?.trim() || null,
      description_en: (formData.get("description_en") as string)?.trim() || null,
      description_de: (formData.get("description_de") as string)?.trim() || null,
      description_fr: (formData.get("description_fr") as string)?.trim() || null,
      seo_title_en: (formData.get("seo_title_en") as string)?.trim() || null,
      seo_title_de: (formData.get("seo_title_de") as string)?.trim() || null,
      seo_title_fr: (formData.get("seo_title_fr") as string)?.trim() || null,
      seo_description_en: (formData.get("seo_description_en") as string)?.trim() || null,
      seo_description_de: (formData.get("seo_description_de") as string)?.trim() || null,
      seo_description_fr: (formData.get("seo_description_fr") as string)?.trim() || null,
      color: (formData.get("color") as string)?.trim() || null,
      image_url: (formData.get("image_url") as string)?.trim() || null,
    },
  };
}

export async function createNewsCategory(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { nameEn, record } = readCategoryForm(formData);
  if (!nameEn) return { error: "Name (EN) is required." };

  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "news_categories", manualSlug || slugify(nameEn, "category"));

  const { error } = await supabase
    .from("news_categories")
    .insert({ ...record, slug });
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_news_category",
    entity_type: "news_categories",
    entity_id: slug,
    details: { name: nameEn },
  });
  await pingRevalidate("site", categoryPaths(slug));
  return { success: true };
}

export async function updateNewsCategory(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { nameEn, record } = readCategoryForm(formData);
  if (!nameEn) return { error: "Name (EN) is required." };

  const patch: Record<string, unknown> = { ...record };
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patch.slug = await uniqueSlug(supabase as any, "news_categories", slugify(rawSlug, "category"), id);
  }

  const { data: before } = await supabase
    .from("news_categories").select("slug").eq("id", id).single();
  const { error } = await supabase.from("news_categories").update(patch).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_news_category",
    entity_type: "news_categories",
    entity_id: id,
    details: { name: nameEn },
  });
  // Revalidate both old + new slug pages.
  const slugs = new Set([before?.slug, (patch.slug as string) ?? before?.slug].filter(Boolean) as string[]);
  await pingRevalidate("site", ["/[locale]/news", ...[...slugs].map((s) => `/[locale]/news/category/${s}`)]);
  return { success: true };
}

export async function deleteNewsCategory(id: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { data: cat } = await supabase
    .from("news_categories").select("slug, name_en").eq("id", id).single();
  const { error } = await supabase.from("news_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_news_category",
    entity_type: "news_categories",
    entity_id: id,
    details: { name: cat?.name_en },
  });
  await pingRevalidate("site", categoryPaths(cat?.slug));
  return { success: true };
}

export async function reorderNewsCategories(orderedIds: string[]) {
  await requireRole("manager");
  const supabase = await createServerClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("news_categories").update({ sort_order: (i + 1) * 10 }).eq("id", id)
    )
  );
  await pingRevalidate("site", ["/[locale]/news"]);
  return { success: true };
}
