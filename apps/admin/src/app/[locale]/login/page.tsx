"use client";

import { Suspense, use, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithPassword } from "@/actions/auth";
import { createBrowserClient } from "@dbc/supabase";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  // If the URL hash carries a Supabase recovery/invite access_token (common
  // email-link outcome), skip the form while we let supabase-js consume the
  // hash, then push the user to /set-password.
  const [bootstrapping, setBootstrapping] = useState(
    () =>
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token")
  );

  useEffect(() => {
    if (!bootstrapping) return;
    const hash = window.location.hash || "";
    const supabase = createBrowserClient();
    const timer = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isRecovery =
          hash.includes("type=recovery") || hash.includes("type=invite");
        const target = isRecovery
          ? `/${locale}/set-password`
          : `/${locale}/dashboard`;
        window.location.replace(target);
      } else {
        setBootstrapping(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [locale, bootstrapping]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo placeholder */}
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            DBC Germany
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Admin Dashboard</p>
        </div>

        {bootstrapping ? (
          <LoginFormFallback />
        ) : (
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm locale={locale} />
          </Suspense>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Trouble signing in? Contact{" "}
          <a
            href="mailto:dbc-germany@realjaynka.com"
            className="text-primary hover:text-primary/80"
          >
            dbc-germany@realjaynka.com
          </a>
        </p>
      </div>
    </div>
  );
}

function LoginForm({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [email, setEmail] = useState("");
  const [forgotStage, setForgotStage] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      formData.set("locale", locale);
      if (redirectTo) formData.set("redirect", redirectTo);
      return loginWithPassword(formData);
    },
    null
  );

  async function handleForgot() {
    if (!email || !email.includes("@")) {
      setForgotError("Enter your email first.");
      setForgotStage("error");
      return;
    }
    setForgotStage("sending");
    setForgotError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/set-password`,
    });
    if (error) {
      setForgotError(error.message);
      setForgotStage("error");
    } else {
      setForgotStage("sent");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@dbc-germany.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <button
            type="button"
            onClick={handleForgot}
            className="text-xs text-primary hover:text-primary/80"
          >
            Forgot?
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {forgotStage === "sent" && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Password reset email sent. Check your inbox.
        </p>
      )}
      {forgotStage === "error" && forgotError && (
        <p className="text-sm text-red-600" role="alert">
          {forgotError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Signing in..."
          : forgotStage === "sending"
            ? "Sending reset email..."
            : "Sign in"}
      </button>
    </form>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
