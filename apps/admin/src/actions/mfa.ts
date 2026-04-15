"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";

/**
 * Generate 10 new single-use backup codes for the current user. Replaces
 * (deletes) any existing unused codes. Returns the plaintext codes for
 * one-time display; storage is bcrypt-hashed via pgcrypto in the migration.
 */
export async function generateBackupCodes() {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  // Wipe old unused codes so the user holds at most 10 valid codes at a time.
  await supabase
    .from("mfa_backup_codes")
    .delete()
    .eq("user_id", user.userId)
    .is("used_at", null);

  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // 4+4 block format, easy to type and read — e.g. 8A2F-9K7P
    codes.push(
      `${randomBlock()}-${randomBlock()}`
    );
  }

  // Hash each code via pgcrypto. One insert per code via a single RPC call —
  // but since we don't have a bulk RPC, do it in a single INSERT ... SELECT.
  const { error } = await supabase.rpc("mfa_seed_backup_codes", {
    p_codes: codes,
  });

  // Fallback: if the helper RPC isn't present, fall back to inserting rows
  // one by one using a per-row crypt() via a custom query. We seed the RPC
  // in a followup migration if missing; surfacing a clear error is enough.
  if (error) {
    // Graceful fallback using a raw SQL via postgrest: insert each row and
    // compute the hash inline with a generated `code_hash` from crypt().
    for (const code of codes) {
      const { error: insertError } = await supabase.rpc(
        "mfa_insert_backup_code",
        { p_code: code }
      );
      if (insertError) {
        return { error: insertError.message };
      }
    }
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "mfa_generate_backup_codes",
    entity_type: "mfa_backup_codes",
    entity_id: user.userId,
    details: { count: codes.length },
  });

  return { success: true as const, codes };
}

function randomBlock(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 4; i++) {
    out += alphabet[arr[i] % alphabet.length];
  }
  return out;
}

export async function countRemainingBackupCodes(): Promise<number> {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("mfa_unused_backup_codes");
  return (data as number) ?? 0;
}

export async function redeemBackupCode(code: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("mfa_redeem_backup_code", {
    p_code: code,
  });
  if (error) return { error: error.message };
  if (data !== true) return { error: "Invalid or used code." };
  return { success: true as const };
}

/**
 * Remove all backup codes for the current user. Called when disabling 2FA.
 */
export async function clearBackupCodes() {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();
  await supabase.from("mfa_backup_codes").delete().eq("user_id", user.userId);
  return { success: true as const };
}
