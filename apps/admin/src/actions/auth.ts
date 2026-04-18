"use server";

import { createServerClient } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function loginWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = formData.get("locale") as string;
  const redirectTo = (formData.get("redirect") as string) || `/${locale}/dashboard`;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect(redirectTo);
}

export async function logout(locale: string) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

/**
 * Public password-reset request used by the login page's "Forgot?" button.
 * Does NOT require authentication. Uses service role to generate the recovery
 * link, then sends a branded email via Resend. Always returns success to avoid
 * leaking which emails are registered.
 */
export async function requestPasswordResetForEmail(
  email: string,
  locale: string
) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Please enter a valid email address." };
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
  const resetLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  try {
    const { data, error } = await service.auth.admin.generateLink({
      type: "recovery",
      email: trimmed,
      options: {
        redirectTo: `${adminUrl}/${resetLocale}/set-password`,
      },
    });

    // If the user doesn't exist, Supabase returns an error — but we return
    // success anyway to prevent email enumeration attacks.
    if (error || !data?.properties?.action_link) {
      return { success: true };
    }

    const actionLink = data.properties.action_link;

    // Try to fetch the user's display_name for personalisation
    let firstName: string | undefined;
    try {
      if (data.user?.id) {
        const { data: profile } = await service
          .from("profiles")
          .select("display_name")
          .eq("id", data.user.id)
          .maybeSingle();
        firstName = profile?.display_name?.trim().split(/\s+/)[0] || undefined;
      }
    } catch {
      /* non-fatal */
    }

    const { sendPasswordReset } = await import("@dbc/email");
    await sendPasswordReset({
      to: trimmed,
      recipientName: firstName,
      actionLink,
      locale: resetLocale,
    });
  } catch (err) {
    console.error("[requestPasswordResetForEmail] failed:", err);
    // Still return success to avoid leaking registration status
  }

  return { success: true };
}
