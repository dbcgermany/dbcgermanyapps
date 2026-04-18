"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TeamMemberVisibility = "public" | "internal" | "hidden";

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role_en: string;
  role_de: string | null;
  role_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  sort_order: number;
  visibility: TeamMemberVisibility;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  "id, slug, name, role_en, role_de, role_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, sort_order, visibility, profile_id, created_at, updated_at" as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as TeamMember[]) ?? [];
}

export async function getTeamMember(id: string): Promise<TeamMember> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as TeamMember;
}

/**
 * Returns staff accounts for the "Linked staff account" dropdown on the team form.
 * Excludes profiles that are already linked to another team member.
 */
export async function getStaffAccountsForLinking(excludeTeamMemberId?: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const service = getServiceClient();

  const STAFF_ROLES = ["team_member", "manager", "admin", "super_admin"];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .in("role", STAFF_ROLES);

  // Fetch already-linked profile IDs (so we can exclude them)
  const { data: linked } = await supabase
    .from("team_members")
    .select("profile_id")
    .not("profile_id", "is", null);

  const linkedIds = new Set(
    (linked ?? [])
      .map((l) => l.profile_id)
      .filter((id): id is string =>
        id !== null && id !== excludeTeamMemberId
      )
  );

  // Fetch emails via service client
  const staffWithEmail = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data } = await service.auth.admin.getUserById(p.id);
      return {
        id: p.id,
        email: data.user?.email ?? "",
        displayName: p.display_name,
        role: p.role,
        alreadyLinked: linkedIds.has(p.id),
      };
    })
  );

  return staffWithEmail.filter((s) => !s.alreadyLinked);
}

export async function createTeamMember(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { error: "Name is required." };
  const slugBase = slugify(name) || "member";
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const rawProfileId = ((formData.get("profile_id") as string) || "").trim();
  const record = {
    slug,
    name,
    role_en: ((formData.get("role_en") as string) || "").trim(),
    role_de: ((formData.get("role_de") as string) || "").trim() || null,
    role_fr: ((formData.get("role_fr") as string) || "").trim() || null,
    bio_en: ((formData.get("bio_en") as string) || "").trim() || null,
    bio_de: ((formData.get("bio_de") as string) || "").trim() || null,
    bio_fr: ((formData.get("bio_fr") as string) || "").trim() || null,
    photo_url:
      ((formData.get("photo_url") as string) || "").trim() || null,
    email: ((formData.get("email") as string) || "").trim() || null,
    linkedin_url:
      ((formData.get("linkedin_url") as string) || "").trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "100", 10),
    visibility: ((formData.get("visibility") as string) ||
      "internal") as TeamMemberVisibility,
    profile_id: rawProfileId || null,
    updated_by: user.userId,
  };

  const { data, error } = await supabase
    .from("team_members")
    .insert(record)
    .select("id")
    .single();
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_team_member",
    entity_type: "team_members",
    entity_id: data.id,
    details: { name, visibility: record.visibility },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team/${data.id}`);
}

export async function updateTeamMember(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { error: "Name is required." };

  const rawProfileId = ((formData.get("profile_id") as string) || "").trim();
  const record = {
    name,
    role_en: ((formData.get("role_en") as string) || "").trim(),
    role_de: ((formData.get("role_de") as string) || "").trim() || null,
    role_fr: ((formData.get("role_fr") as string) || "").trim() || null,
    bio_en: ((formData.get("bio_en") as string) || "").trim() || null,
    bio_de: ((formData.get("bio_de") as string) || "").trim() || null,
    bio_fr: ((formData.get("bio_fr") as string) || "").trim() || null,
    photo_url:
      ((formData.get("photo_url") as string) || "").trim() || null,
    email: ((formData.get("email") as string) || "").trim() || null,
    linkedin_url:
      ((formData.get("linkedin_url") as string) || "").trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "100", 10),
    visibility: ((formData.get("visibility") as string) ||
      "internal") as TeamMemberVisibility,
    profile_id: rawProfileId || null,
    updated_by: user.userId,
  };

  const { error } = await supabase
    .from("team_members")
    .update(record)
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_team_member",
    entity_type: "team_members",
    entity_id: id,
    details: { name, visibility: record.visibility },
  });

  revalidatePath(`/${locale}/team`);
  return { success: true };
}

export async function setTeamMemberVisibility(
  id: string,
  visibility: TeamMemberVisibility,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("team_members")
    .update({ visibility, updated_by: user.userId })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "set_team_member_visibility",
    entity_type: "team_members",
    entity_id: id,
    details: { visibility },
  });

  revalidatePath(`/${locale}/team`);
  return { success: true };
}

/**
 * Upload a team member photo to the team-photos bucket and return its public
 * URL. If a member id is passed, also persists the URL onto the member row
 * so the change is live even before the full form is saved.
 */
export async function uploadTeamMemberPhoto(
  file: File,
  memberId: string | null
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { toWebp } = await import("@/lib/webp");
  const { buffer, contentType, extension } = await toWebp(file, {
    maxDim: 1200,
  });
  const folder = memberId ?? `draft/${user.userId}`;
  const path = `${folder}/photo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("team-photos")
    .upload(path, buffer, { upsert: false, contentType });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("team-photos").getPublicUrl(path);

  if (memberId) {
    const { error } = await supabase
      .from("team_members")
      .update({ photo_url: publicUrl, updated_by: user.userId })
      .eq("id", memberId);
    if (error) return { error: error.message };
    revalidatePath("/[locale]/team", "layout");
  }

  return { success: true as const, url: publicUrl };
}

export async function reorderTeamMembers(
  orderedIds: string[],
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("team_members")
      .update({ sort_order: (index + 1) * 10, updated_by: user.userId })
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "reorder_team_members",
    entity_type: "team_members",
    entity_id: null,
    details: { order: orderedIds },
  });

  revalidatePath(`/${locale}/team`);
  revalidatePath(`/team`);
  return { success: true };
}

export async function deleteTeamMember(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { data: existing } = await supabase
    .from("team_members")
    .select("name")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_team_member",
    entity_type: "team_members",
    entity_id: id,
    details: { name: existing?.name },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team`);
}
