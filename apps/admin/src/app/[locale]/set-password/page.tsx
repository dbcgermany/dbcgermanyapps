"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@dbc/supabase";
import { Button } from "@dbc/ui";

export default function SetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <Suspense fallback={null}>
      <SetPasswordForm locale={locale} />
    </Suspense>
  );
}

function SetPasswordForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<
    "checking" | "ready" | "no-session" | "saving" | "done"
  >("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Supabase's detectSessionInUrl option (default true) processes hash
    // fragments automatically. Re-read the session after a tick.
    const t = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
        setStage("ready");
        // Clean the hash from the URL once the session is established.
        if (window.location.hash) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      } else {
        setStage("no-session");
      }
    }, 200);

    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(
        locale === "de"
          ? "Passwort muss mindestens 8 Zeichen lang sein."
          : locale === "fr"
            ? "Mot de passe doit faire au moins 8 caract\u00E8res."
            : "Password must be at least 8 characters."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(
        locale === "de"
          ? "Passw\u00F6rter stimmen nicht \u00FCberein."
          : locale === "fr"
            ? "Les mots de passe ne correspondent pas."
            : "Passwords do not match."
      );
      return;
    }

    setStage("saving");
    const supabase = createBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStage("ready");
      return;
    }

    // Clear the one-time flag set when the account was bootstrapped with a
    // temporary password, so the middleware stops redirecting here on future logins.
    await supabase.auth.updateUser({ data: { must_change_password: false } });

    setStage("done");
    setTimeout(() => {
      router.push(`/${locale}/dashboard`);
    }, 1500);
  }

  const t = {
    en: {
      checking: "Verifying invite\u2026",
      noSession:
        "This invite link is invalid or expired. Ask an admin to resend it.",
      title: "Create your password",
      email: "Account",
      passwordLabel: "New password",
      confirmLabel: "Confirm password",
      submit: "Save & sign in",
      saving: "Saving\u2026",
      done: "Success! Redirecting to your dashboard\u2026",
    },
    de: {
      checking: "Einladung wird gepr\u00FCft\u2026",
      noSession:
        "Dieser Einladungslink ist ung\u00FCltig oder abgelaufen. Bitten Sie einen Admin um einen neuen Link.",
      title: "Passwort erstellen",
      email: "Konto",
      passwordLabel: "Neues Passwort",
      confirmLabel: "Passwort best\u00E4tigen",
      submit: "Speichern & Anmelden",
      saving: "Speichern\u2026",
      done: "Erfolg! Weiterleitung zum Dashboard\u2026",
    },
    fr: {
      checking: "V\u00E9rification de l\u2019invitation\u2026",
      noSession:
        "Ce lien d\u2019invitation est invalide ou expir\u00E9. Demandez \u00E0 un admin de le renvoyer.",
      title: "Cr\u00E9er votre mot de passe",
      email: "Compte",
      passwordLabel: "Nouveau mot de passe",
      confirmLabel: "Confirmer le mot de passe",
      submit: "Enregistrer et se connecter",
      saving: "Enregistrement\u2026",
      done: "R\u00E9ussi ! Redirection vers le tableau de bord\u2026",
    },
  }[locale] ?? {
    checking: "Verifying\u2026",
    noSession: "Invalid or expired invite link.",
    title: "Create your password",
    email: "Account",
    passwordLabel: "New password",
    confirmLabel: "Confirm password",
    submit: "Save & sign in",
    saving: "Saving\u2026",
    done: "Success!",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            DBC Germany
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.title}
          </p>
        </div>

        {stage === "checking" && (
          <p className="text-center text-sm text-muted-foreground">
            {t.checking}
          </p>
        )}

        {stage === "no-session" && (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {t.noSession}
          </p>
        )}

        {(stage === "ready" || stage === "saving") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {email && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {t.email}: <span className="font-medium">{email}</span>
              </div>
            )}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium mb-1.5"
              >
                {t.confirmLabel}
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit"
              disabled={stage === "saving"}>
              {stage === "saving" ? t.saving : t.submit}
            </Button>
          </form>
        )}

        {stage === "done" && (
          <p className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {t.done}
          </p>
        )}
      </div>
    </div>
  );
}
