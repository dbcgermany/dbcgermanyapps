"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface AppSecret {
  key: string;
  note: string | null;
  updated_at: string;
  has_value: boolean;
  // We return a masked value (last 4 chars only) so super admins can confirm
  // which key they're looking at without exposing the whole token on screen.
  value_masked: string | null;
}

/**
 * List all application secrets. Super-admin only.
 * Values are returned masked — never send the raw value to the browser.
 */
export async function listAppSecrets(): Promise<AppSecret[]> {
  await requireRole("super_admin");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("app_secrets")
    .select("key, value, note, updated_at")
    .order("key", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    key: row.key,
    note: row.note,
    updated_at: row.updated_at,
    has_value: Boolean(row.value && row.value.length > 0),
    value_masked: row.value
      ? `\u2022\u2022\u2022\u2022${row.value.slice(-4)}`
      : null,
  }));
}

/**
 * Upsert a single secret by key. Blank value means "delete the secret".
 */
export async function upsertAppSecret(
  key: string,
  value: string,
  note?: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("super_admin");
  const supabase = await createServerClient();

  const cleanKey = key.trim();
  if (!cleanKey || !/^[A-Z][A-Z0-9_]*$/.test(cleanKey)) {
    return {
      error: "Key must be UPPER_SNAKE_CASE and start with a letter.",
    };
  }

  const cleanValue = value.trim();
  if (!cleanValue) {
    const { error } = await supabase
      .from("app_secrets")
      .delete()
      .eq("key", cleanKey);
    if (error) return { error: error.message };
    await supabase.from("audit_log").insert({
      user_id: user.userId,
      action: "delete_app_secret",
      entity_type: "app_secrets",
      entity_id: cleanKey,
      details: { key: cleanKey },
    });
    revalidatePath("/[locale]/settings", "layout");
    return { success: true };
  }

  const { error } = await supabase.from("app_secrets").upsert(
    {
      key: cleanKey,
      value: cleanValue,
      note: note?.trim() || null,
    },
    { onConflict: "key" }
  );

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "upsert_app_secret",
    entity_type: "app_secrets",
    entity_id: cleanKey,
    details: { key: cleanKey, has_note: Boolean(note) },
  });

  revalidatePath("/[locale]/settings", "layout");
  return { success: true };
}

/**
 * Read a secret value server-side. Used by @dbc/ai and other packages that
 * need to fetch API keys at runtime. NOT a user-facing action — no
 * requireRole guard here so it can be called from cron handlers that pass
 * CRON_SECRET instead of a user session. Lock this down if you expose the
 * module more widely.
 */
export async function getAppSecretValue(key: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("app_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}
