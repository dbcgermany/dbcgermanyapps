// SSOT helper to sync a post's authors (delete-then-insert) with role + order.
// Plain module (NOT "use server") so it takes the calling action's Supabase
// client. Reused by createNewsPost + updateNewsPost.

export type PostAuthorEntry = { id: string; role: string };

export async function syncPostAuthors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  entries: PostAuthorEntry[]
): Promise<void> {
  await supabase.from("post_authors").delete().eq("post_id", postId);
  if (entries.length === 0) return;
  const rows = entries.map((a, i) => ({
    post_id: postId,
    author_id: a.id,
    role: a.role || "author",
    sort_order: (i + 1) * 10,
  }));
  await supabase.from("post_authors").insert(rows);
}
