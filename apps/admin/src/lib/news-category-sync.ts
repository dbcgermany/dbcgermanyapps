// SSOT helper to sync a news post's category links (delete-then-insert),
// enforcing exactly one primary category. Plain module (NOT "use server")
// so it can accept the already-created Supabase client from the calling
// server action — reused by both createNewsPost and updateNewsPost.

export async function syncPostCategories(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  categoryIds: string[],
  primaryId: string | null,
  addedBy: string
): Promise<void> {
  await supabase.from("news_category_links").delete().eq("post_id", postId);
  if (categoryIds.length === 0) return;
  const primary =
    primaryId && categoryIds.includes(primaryId) ? primaryId : categoryIds[0];
  const rows = categoryIds.map((cid) => ({
    post_id: postId,
    category_id: cid,
    is_primary: cid === primary,
    added_by: addedBy,
  }));
  await supabase.from("news_category_links").insert(rows);
}
