"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

const NEWS_PUBLIC_PATHS = (slug: string) => ["/[locale]/news", `/[locale]/news/${slug}`];

const POST_COLUMNS =
  "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, body_en, body_de, body_fr, cover_image_url, author_name, is_published, published_at, created_at, updated_at" as const;

export async function getNewsPosts() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getNewsPost(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createNewsPost(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const titleEn = (formData.get("title_en") as string).trim();
  // Admin can pre-fill the slug; otherwise derive a clean one from the title.
  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  const base = manualSlug || slugify(titleEn, "post");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "news_posts", base);

  const record = {
    slug,
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    excerpt_en: (formData.get("excerpt_en") as string) || null,
    excerpt_de: (formData.get("excerpt_de") as string) || null,
    excerpt_fr: (formData.get("excerpt_fr") as string) || null,
    body_en: formData.get("body_en") as string,
    body_de: (formData.get("body_de") as string) || (formData.get("body_en") as string),
    body_fr: (formData.get("body_fr") as string) || (formData.get("body_en") as string),
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    author_name: (formData.get("author_name") as string) || null,
    is_published: false,
  };

  const { data, error } = await supabase
    .from("news_posts")
    .insert(record)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_news_post",
    entity_type: "news_posts",
    entity_id: data.id,
    details: { title: titleEn, slug },
  });

  revalidatePath(`/${locale}/news`);
  await pingRevalidate("site", NEWS_PUBLIC_PATHS(slug));
  redirect(`/${locale}/news/${data.id}`);
}

export async function updateNewsPost(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const record: Record<string, unknown> = {
    title_en: formData.get("title_en") as string,
    title_de: formData.get("title_de") as string,
    title_fr: formData.get("title_fr") as string,
    excerpt_en: (formData.get("excerpt_en") as string) || null,
    excerpt_de: (formData.get("excerpt_de") as string) || null,
    excerpt_fr: (formData.get("excerpt_fr") as string) || null,
    body_en: formData.get("body_en") as string,
    body_de: formData.get("body_de") as string,
    body_fr: formData.get("body_fr") as string,
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    author_name: (formData.get("author_name") as string) || null,
  };

  // Optional: admin can rename the slug. If provided, sanitise + ensure uniqueness.
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record.slug = await uniqueSlug(supabase as any, "news_posts", slugify(rawSlug, "post"), id);
  }

  const { error } = await supabase
    .from("news_posts")
    .update(record)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: record.title_en },
  });

  revalidatePath(`/${locale}/news`);
  revalidatePath(`/${locale}/news/${id}`);
  // Best-effort: fetch the current slug so we revalidate the public /news/[slug]
  const { data: slugRow } = await supabase
    .from("news_posts")
    .select("slug")
    .eq("id", id)
    .single();
  if (slugRow?.slug) await pingRevalidate("site", NEWS_PUBLIC_PATHS(slugRow.slug));
  return { success: true };
}

export async function toggleNewsPublish(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("news_posts")
    .select("is_published, title_en, slug")
    .eq("id", id)
    .single();
  if (!post) return { error: "Post not found" };

  const newPublished = !post.is_published;
  const { error } = await supabase
    .from("news_posts")
    .update({
      is_published: newPublished,
      published_at: newPublished ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: newPublished ? "publish_news_post" : "unpublish_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: post.title_en },
  });

  revalidatePath(`/${locale}/news`);
  await pingRevalidate("site", NEWS_PUBLIC_PATHS(post.slug));
  return { success: true };
}

export async function deleteNewsPost(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { data: post } = await supabase
    .from("news_posts")
    .select("title_en, slug")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: post?.title_en },
  });
  revalidatePath(`/${locale}/news`);
  if (post?.slug) await pingRevalidate("site", NEWS_PUBLIC_PATHS(post.slug));
  redirect(`/${locale}/news`);
}
