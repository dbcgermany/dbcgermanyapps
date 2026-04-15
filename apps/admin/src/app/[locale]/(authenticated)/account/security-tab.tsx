"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@dbc/supabase";
import {
  generateBackupCodes,
  countRemainingBackupCodes,
  clearBackupCodes,
} from "@/actions/mfa";
import {
  requestPasswordReset,
  signOutEverywhere,
  listMySessions,
  revokeMySession,
  type SessionRow,
} from "@/actions/account";

type Factor = {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
  created_at: string;
};

type EnrollmentState =
  | { kind: "idle" }
  | {
      kind: "enrolling";
      factorId: string;
      qrCode: string;
      secret: string;
      uri: string;
    }
  | { kind: "showing_codes"; codes: string[] };

export function SecurityTab() {
  const supabase = createBrowserClient();
  const [resetPending, startResetTransition] = useTransition();
  const [soePending, startSoeTransition] = useTransition();
  const [mfaPending, startMfaTransition] = useTransition();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentState>({ kind: "idle" });
  const [verifyCode, setVerifyCode] = useState("");
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const verifiedFactor = factors.find(
    (f) => f.factor_type === "totp" && f.status === "verified"
  );
  const mfaEnabled = !!verifiedFactor;

  async function loadFactors() {
    setLoadingFactors(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error(`Could not load factors: ${error.message}`);
      setLoadingFactors(false);
      return;
    }
    setFactors((data?.all ?? []) as Factor[]);
    setLoadingFactors(false);
    const remaining = await countRemainingBackupCodes();
    setRemainingCodes(remaining);
    const rows = await listMySessions();
    setSessions(rows);
  }

  async function revokeSession(sessionId: string) {
    setRevokingId(sessionId);
    const result = await revokeMySession(sessionId);
    setRevokingId(null);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success("Session revoked.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  }

  useEffect(() => {
    void loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnrolment() {
    startMfaTransition(async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "DBC Germany Admin",
      });
      if (error || !data) {
        toast.error(error?.message ?? "Could not start 2FA enrolment.");
        return;
      }
      setEnrollment({
        kind: "enrolling",
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    });
  }

  async function confirmEnrolment() {
    if (enrollment.kind !== "enrolling") return;
    startMfaTransition(async () => {
      const { data: chall, error: challError } =
        await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
      if (challError || !chall) {
        toast.error(challError?.message ?? "Challenge failed.");
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: chall.id,
        code: verifyCode.trim(),
      });
      if (verifyErr) {
        toast.error(verifyErr.message);
        return;
      }
      const seedResult = await generateBackupCodes();
      if ("error" in seedResult && seedResult.error) {
        toast.error(seedResult.error);
        return;
      }
      if ("codes" in seedResult && seedResult.codes) {
        setEnrollment({ kind: "showing_codes", codes: seedResult.codes });
        setVerifyCode("");
        await loadFactors();
        toast.success("Two-factor authentication enabled.");
      }
    });
  }

  async function disable2fa() {
    if (!verifiedFactor) return;
    const code = prompt(
      "Enter a current 6-digit code from your authenticator app to confirm disabling 2FA."
    );
    if (!code) return;
    startMfaTransition(async () => {
      const { data: chall } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });
      if (!chall) {
        toast.error("Could not start challenge.");
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: chall.id,
        code: code.trim(),
      });
      if (verifyErr) {
        toast.error(verifyErr.message);
        return;
      }
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });
      if (unenrollErr) {
        toast.error(unenrollErr.message);
        return;
      }
      await clearBackupCodes();
      toast.success("Two-factor authentication disabled.");
      await loadFactors();
    });
  }

  async function regenerateBackupCodes() {
    if (!verifiedFactor) return;
    const code = prompt(
      "Enter a current 6-digit code from your authenticator to regenerate your backup codes. The old codes will stop working."
    );
    if (!code) return;
    startMfaTransition(async () => {
      const { data: chall } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });
      if (!chall) {
        toast.error("Could not start challenge.");
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: chall.id,
        code: code.trim(),
      });
      if (verifyErr) {
        toast.error(verifyErr.message);
        return;
      }
      const result = await generateBackupCodes();
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("codes" in result && result.codes) {
        setEnrollment({ kind: "showing_codes", codes: result.codes });
        await loadFactors();
      }
    });
  }

  function handleReset() {
    startResetTransition(async () => {
      const result = await requestPasswordReset();
      if ("error" in result && result.error) toast.error(result.error);
      else
        toast.success("Password-reset link sent to your email.", {
          description: "Check your inbox.",
        });
    });
  }

  function handleSignOutEverywhere() {
    startSoeTransition(async () => {
      const result = await signOutEverywhere();
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success("Signed out on all devices.");
    });
  }

  function shortUserAgent(ua: string): string {
    // Keep it readable without a full UA parser
    if (/iPhone/i.test(ua)) return "Safari on iPhone";
    if (/iPad/i.test(ua)) return "Safari on iPad";
    if (/Android/i.test(ua))
      return /Chrome/i.test(ua) ? "Chrome on Android" : "Browser on Android";
    if (/Macintosh/i.test(ua)) {
      if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari on macOS";
      if (/Chrome/i.test(ua)) return "Chrome on macOS";
      if (/Firefox/i.test(ua)) return "Firefox on macOS";
      return "macOS browser";
    }
    if (/Windows/i.test(ua)) {
      if (/Chrome/i.test(ua)) return "Chrome on Windows";
      if (/Firefox/i.test(ua)) return "Firefox on Windows";
      if (/Edg/i.test(ua)) return "Edge on Windows";
      return "Windows browser";
    }
    if (/Linux/i.test(ua)) return "Linux browser";
    return ua.slice(0, 80);
  }

  function downloadCodes(codes: string[]) {
    const blob = new Blob(
      [
        `DBC Germany — 2FA backup codes\nGenerated: ${new Date().toISOString()}\n\n` +
          codes.join("\n") +
          "\n\nEach code is valid for one use. Store them somewhere safe.\n",
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dbc-germany-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border p-4">
        <h3 className="font-heading text-base font-bold">Password</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We’ll email you a secure reset link.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetPending}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {resetPending ? "Sending…" : "Send password-reset email"}
        </button>
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-bold">
              Two-factor authentication
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              TOTP from an authenticator app (1Password, Authy, Google
              Authenticator). Plus 10 single-use backup codes.
            </p>
            {loadingFactors ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Loading status…
              </p>
            ) : mfaEnabled ? (
              <p className="mt-2 text-xs text-green-700 dark:text-green-400">
                ✓ Enabled
                {remainingCodes !== null &&
                  ` · ${remainingCodes} backup code${
                    remainingCodes === 1 ? "" : "s"
                  } remaining`}
              </p>
            ) : (
              <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                Not yet enabled.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!mfaEnabled && enrollment.kind === "idle" && (
              <button
                type="button"
                onClick={startEnrolment}
                disabled={mfaPending}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {mfaPending ? "Starting…" : "Enable 2FA"}
              </button>
            )}
            {mfaEnabled && (
              <>
                <button
                  type="button"
                  onClick={regenerateBackupCodes}
                  disabled={mfaPending}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Regenerate backup codes
                </button>
                <button
                  type="button"
                  onClick={disable2fa}
                  disabled={mfaPending}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Disable 2FA
                </button>
              </>
            )}
          </div>
        </div>

        {enrollment.kind === "enrolling" && (
          <div className="mt-5 rounded-md border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              1. Scan the QR code with your authenticator app
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollment.qrCode}
                alt="TOTP QR"
                className="h-40 w-40 rounded-md border border-border bg-white p-2"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Or enter the secret manually:
                </p>
                <p className="mt-1 break-all font-mono text-sm">
                  {enrollment.secret}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm font-medium">
              2. Enter the current 6-digit code
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-32 rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={confirmEnrolment}
                disabled={mfaPending || verifyCode.length < 6}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {mfaPending ? "Verifying…" : "Verify & enable"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void supabase.auth.mfa.unenroll({
                    factorId: enrollment.factorId,
                  });
                  setEnrollment({ kind: "idle" });
                  setVerifyCode("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {enrollment.kind === "showing_codes" && (
          <div className="mt-5 rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
              Save these backup codes now
            </p>
            <p className="mt-1 text-xs text-yellow-900/80 dark:text-yellow-200/80">
              Each code works once. We will never show them again. Use them if
              you lose access to your authenticator.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm text-yellow-900 dark:text-yellow-200">
              {enrollment.codes.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => downloadCodes(enrollment.codes)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Download .txt
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(enrollment.codes.join("\n"));
                  toast.success("Copied to clipboard.");
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Copy all
              </button>
              <button
                type="button"
                onClick={() => setEnrollment({ kind: "idle" })}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                I’ve saved them
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-bold">Active sessions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Devices and browsers currently signed in to this account. Revoke
              any you don’t recognise.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOutEverywhere}
            disabled={soePending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {soePending ? "Signing out…" : "Sign out everywhere"}
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            No session data available (load the tab again to refresh).
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border">
            {sessions.map((s) => {
              const ua = s.user_agent ?? "Unknown device";
              const last = s.updated_at ?? s.created_at;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {shortUserAgent(ua)}
                    </p>
                    <p className="text-muted-foreground">
                      {s.ip ? `${s.ip} · ` : ""}
                      Last active {new Date(last).toLocaleString()}
                      {s.aal === "aal2" && (
                        <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          2FA
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeSession(s.id)}
                    disabled={revokingId === s.id}
                    className="text-xs font-medium text-red-600 hover:opacity-80 disabled:opacity-50"
                  >
                    {revokingId === s.id ? "Revoking…" : "Revoke"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
