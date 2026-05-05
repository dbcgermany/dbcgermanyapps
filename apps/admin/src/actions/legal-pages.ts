"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServerClient } from "@dbc/supabase/server";
import { captureServerError } from "@/lib/observe";
import type { LegalDocumentType } from "@dbc/legal";

interface SaveDraftInput {
  documentType: LegalDocumentType;
  locale: "en" | "de" | "fr";
  title: string;
  body_markdown: string;
}

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    !["admin", "super_admin"].includes(profile.role as string)
  ) {
    return { error: "Not authorised — admin role required" };
  }
  return { supabase, userId: user.id };
}

// Cross-app revalidation. Editing a legal page in admin must propagate to
// the public site and the tickets app within seconds. Each app exposes
// /api/revalidate that takes a tag name and rebuilds all server-component
// trees that read that tag.
async function revalidateAcrossApps(tag: string) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  const targets = [
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com",
    "https://dbc-germany.com",
  ];
  await Promise.allSettled(
    targets.map((origin) =>
      fetch(`${origin}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, secret }),
      })
    )
  );
}

export async function saveLegalDraft(input: SaveDraftInput) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  try {
    const { error } = await auth.supabase
      .from("legal_pages")
      .update({
        title: input.title,
        body_markdown: input.body_markdown,
        draft_updated_at: new Date().toISOString(),
        draft_updated_by: auth.userId,
      })
      .eq("document_type", input.documentType)
      .eq("locale", input.locale);

    if (error) return { error: error.message };

    await auth.supabase.from("audit_log").insert({
      user_id: auth.userId,
      action: "legal_pages_save_draft",
      entity_type: "legal_pages",
      entity_id: `${input.documentType}:${input.locale}`,
      details: {
        title_length: input.title.length,
        body_length: input.body_markdown.length,
      },
    });

    revalidatePath("/[locale]/legal-pages", "page");
    return { success: true };
  } catch (err) {
    captureServerError(err, {
      scope: "legal_pages_save_draft",
      data: {
        document_type: input.documentType,
        locale: input.locale,
      },
    });
    return { error: err instanceof Error ? err.message : "save failed" };
  }
}

export async function publishLegalPage(input: {
  documentType: LegalDocumentType;
  locale: "en" | "de" | "fr";
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  try {
    const { data: row, error: readErr } = await auth.supabase
      .from("legal_pages")
      .select("title, body_markdown")
      .eq("document_type", input.documentType)
      .eq("locale", input.locale)
      .single();
    if (readErr || !row) {
      return { error: "Legal page not found" };
    }

    const { error } = await auth.supabase
      .from("legal_pages")
      .update({
        published_title: row.title,
        published_body_markdown: row.body_markdown,
        published_at: new Date().toISOString(),
        published_by: auth.userId,
      })
      .eq("document_type", input.documentType)
      .eq("locale", input.locale);

    if (error) return { error: error.message };

    await auth.supabase.from("audit_log").insert({
      user_id: auth.userId,
      action: "legal_pages_publish",
      entity_type: "legal_pages",
      entity_id: `${input.documentType}:${input.locale}`,
      details: { body_length: (row.body_markdown ?? "").length },
    });

    // Bust the in-memory cache for the public render path.
    revalidateTag("legal-content", "layout");
    // Bust ISR caches across the public site + tickets so the new
    // version goes live within seconds rather than waiting for the
    // 5-minute revalidate window.
    await revalidateAcrossApps("legal-content");
    revalidatePath("/[locale]/legal-pages", "page");

    return { success: true };
  } catch (err) {
    captureServerError(err, {
      scope: "legal_pages_publish",
      data: {
        document_type: input.documentType,
        locale: input.locale,
      },
    });
    return { error: err instanceof Error ? err.message : "publish failed" };
  }
}

export async function restoreLegalDefault(input: {
  documentType: LegalDocumentType;
  locale: "en" | "de" | "fr";
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  try {
    const { error } = await auth.supabase
      .from("legal_pages")
      .update({
        title: "",
        body_markdown: "",
        published_title: null,
        published_body_markdown: null,
        published_at: null,
        published_by: null,
        draft_updated_at: new Date().toISOString(),
        draft_updated_by: auth.userId,
      })
      .eq("document_type", input.documentType)
      .eq("locale", input.locale);

    if (error) return { error: error.message };

    await auth.supabase.from("audit_log").insert({
      user_id: auth.userId,
      action: "legal_pages_restore_default",
      entity_type: "legal_pages",
      entity_id: `${input.documentType}:${input.locale}`,
      details: {},
    });

    revalidateTag("legal-content", "layout");
    await revalidateAcrossApps("legal-content");
    revalidatePath("/[locale]/legal-pages", "page");

    return { success: true };
  } catch (err) {
    captureServerError(err, {
      scope: "legal_pages_restore_default",
      data: {
        document_type: input.documentType,
        locale: input.locale,
      },
    });
    return { error: err instanceof Error ? err.message : "restore failed" };
  }
}
