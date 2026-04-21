"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@dbc/ui";
import { createBrowserClient } from "@dbc/supabase";
import { redeemBackupCode } from "@/actions/mfa";

type Mode = "totp" | "backup";

export function MfaChallengeForm({
  locale,
  redirectTo,
}: {
  locale: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.find((f) => f.status === "verified");
      if (totp) setFactorId(totp.id);
    })();
  }, [supabase]);

  async function submit() {
    if (mode === "totp") {
      if (!factorId) {
        toast.error("No TOTP factor found. Sign out and contact support.");
        return;
      }
      startTransition(async () => {
        const { data: chall } = await supabase.auth.mfa.challenge({ factorId });
        if (!chall) {
          toast.error("Could not start challenge.");
          return;
        }
        const { error } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: chall.id,
          code: code.trim(),
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Verified.");
        router.replace(redirectTo || `/${locale}/dashboard`);
      });
    } else {
      // Backup code redemption via server action. This is independent of the
      // Supabase MFA flow — on success we already hold an aal1 session and
      // treat the backup-code win as elevation-equivalent by signing the user
      // through to the next page. (Backup codes are one-use, tracked in
      // public.mfa_backup_codes.)
      startTransition(async () => {
        const result = await redeemBackupCode(code.trim());
        if ("error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        // For strict AAL2, we'd need a verified challenge here; since backup
        // codes exist precisely for the device-lost scenario, we accept them
        // as sufficient elevation and let the user proceed. They should then
        // disable+re-enable 2FA or regenerate codes from Security.
        toast.success(
          "Backup code accepted — regenerate your codes in Security."
        );
        router.replace(redirectTo || `/${locale}/dashboard`);
      });
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="flex rounded-md border border-border p-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode("totp");
            setCode("");
          }}
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "totp"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Authenticator
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("backup");
            setCode("");
          }}
          className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
            mode === "backup"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Backup code
        </button>
      </div>

      {mode === "totp" ? (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="w-full rounded-md border border-input bg-background px-3 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <input
          type="text"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD-1234"
          className="w-full rounded-md border border-input bg-background px-3 py-3 text-center font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={
          isPending ||
          (mode === "totp" ? code.length < 6 : code.trim().length < 4)
        }
        className="w-full"
      >
        {isPending ? "Verifying…" : "Verify"}
      </Button>

      <button
        type="button"
        onClick={() => supabase.auth.signOut().then(() => router.replace(`/${locale}/login`))}
        className="w-full text-xs text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
