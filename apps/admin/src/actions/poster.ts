"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface PosterConfig {
  eyebrow_en?: string;
  eyebrow_de?: string;
  eyebrow_fr?: string;
  headline_en?: string;
  headline_de?: string;
  headline_fr?: string;
  instructions_en?: string;
  instructions_de?: string;
  instructions_fr?: string;
}

export async function getPosterConfig(
  eventId: string
): Promise<PosterConfig> {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("poster_config")
    .eq("id", eventId)
    .single();
  return (data?.poster_config as PosterConfig) ?? {};
}

export async function updatePosterConfig(
  eventId: string,
  config: PosterConfig,
  locale: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  // Strip empty strings so the poster page falls back to defaults
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    const trimmed = (v as string)?.trim();
    if (trimmed) clean[k] = trimmed;
  }

  const { error } = await supabase
    .from("events")
    .update({ poster_config: clean })
    .eq("id", eventId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_poster_config",
    entity_type: "events",
    entity_id: eventId,
    details: { fields: Object.keys(clean) },
  });

  revalidatePath(`/${locale}/events/${eventId}/poster`);
  return { success: true };
}
