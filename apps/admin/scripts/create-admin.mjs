#!/usr/bin/env node
// Bootstrap a super_admin account with a temporary password and a one-time
// "must change password" flag in user_metadata. The middleware redirects the
// user to /set-password on next request; the set-password page clears the flag.
//
// Usage (from monorepo root):
//   node --env-file=.vercel/.env.production.local apps/admin/scripts/create-admin.mjs
//
// Or pass env vars inline:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node apps/admin/scripts/create-admin.mjs
//
// You can override email / display name / locale with CLI flags:
//   node ... create-admin.mjs --email=foo@bar.com --name="Foo Bar" --locale=en

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const EMAIL = arg("email", "realjaynka@gmail.com").trim().toLowerCase();
const DISPLAY_NAME = arg("name", "Jay N Kalala");
const LOCALE = arg("locale", "en");
const ROLE = arg("role", "super_admin");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run with: node --env-file=.vercel/.env.production.local apps/admin/scripts/create-admin.mjs"
  );
  process.exit(1);
}

function generateTempPassword() {
  // 18 random base64 chars + a fixed suffix to guarantee symbol/number/case variety.
  const raw = randomBytes(14).toString("base64").replace(/[+/=]/g, "");
  return `${raw}-A1!`;
}

const tempPassword = generateTempPassword();
const service = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // listUsers is paginated; scan until found or exhausted.
  let page = 1;
  // 1000 is the max per page.
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email
    );
    if (match) return match;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function main() {
  const existing = await findUserByEmail(EMAIL);

  let userId;
  if (existing) {
    console.log(`User ${EMAIL} already exists (${existing.id}); resetting password + flag.`);
    const { error } = await service.auth.admin.updateUserById(existing.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        display_name: DISPLAY_NAME,
        locale: LOCALE,
        must_change_password: true,
      },
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await service.auth.admin.createUser({
      email: EMAIL,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: DISPLAY_NAME,
        locale: LOCALE,
        must_change_password: true,
      },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user ${EMAIL} (${userId}).`);
  }

  // The DB trigger inserts a profile row (role=buyer) on auth.users insert.
  // Upsert to guarantee the row exists and set the intended role.
  const { error: profileError } = await service
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: ROLE,
        display_name: DISPLAY_NAME,
        locale: LOCALE,
      },
      { onConflict: "id" }
    );
  if (profileError) throw profileError;

  console.log("\n==============================================");
  console.log(` Email:             ${EMAIL}`);
  console.log(` Role:              ${ROLE}`);
  console.log(` Temporary password: ${tempPassword}`);
  console.log("==============================================");
  console.log(
    "Sign in at the admin app; you'll be redirected to /set-password to choose a new one."
  );
}

main().catch((err) => {
  console.error("Failed:", err.message ?? err);
  process.exit(1);
});
