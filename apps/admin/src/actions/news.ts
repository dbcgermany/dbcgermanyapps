"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const POST_COLUMNS =
  "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, body_en, body_de, body_fr, cover_image_url, author_name, is_published, published_at, created_at, updated_at" as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const slug = slugify(titleEn) + "-" + Date.now().toString(36);

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
  redirect(`/${locale}/news/${data.id}`);
}

export async function updateNewsPost(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const record = {
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
  return { success: true };
}

export async function toggleNewsPublish(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("news_posts")
    .select("is_published, title_en")
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
  return { success: true };
}

export async function deleteNewsPost(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { data: post } = await supabase
    .from("news_posts")
    .select("title_en")
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
  redirect(`/${locale}/news`);
}
