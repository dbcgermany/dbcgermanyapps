"use server";

import { createServerClient } from "@dbc/supabase/server";
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
