"use client";

import { Suspense, use, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithPassword, requestPasswordResetForEmail } from "@/actions/auth";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Hero background — DBC Germany event photo, brand-hosted on
           Supabase public storage for stability. WebP first via <picture>
           so modern browsers get the smaller variant, JPEG as fallback. */}
      <picture>
        <source
          srcSet="https://rcqgsexfuaoiiuqcqeka.supabase.co/storage/v1/object/public/brand-assets/dbc-bg.webp"
          type="image/webp"
        />
        <img
          src="https://rcqgsexfuaoiiuqcqeka.supabase.co/storage/v1/object/public/brand-assets/dbc-bg.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      {/* Darken overlay for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55"
      />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-2xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo / brand */}
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
            DBC Germany
          </h1>
          <p className="mt-1 text-sm text-white/70">Admin Dashboard</p>
        </div>

        {bootstrapping ? (
          <LoginFormFallback />
        ) : (
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm locale={locale} />
          </Suspense>
        )}

        <p className="text-center text-xs text-white/60">
          Trouble signing in? Contact{" "}
          <a
            href="mailto:dbc-germany@realjaynka.com"
            className="text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
          >
            dbc-germany@realjaynka.com
          </a>
        </p>
      </div>
    </main>
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
    const res = await requestPasswordResetForEmail(email, locale);
    if (res.error) {
      setForgotError(res.error);
      setForgotStage("error");
    } else {
      setForgotStage("sent");
    }
  }

  const inputCls =
    "w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-sm placeholder:text-white/50 backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-white"
        >
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
          className={inputCls}
          placeholder="you@dbc-germany.com"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Password
          </label>
          <button
            type="button"
            onClick={handleForgot}
            className="text-xs text-white/80 hover:text-white"
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
          className={inputCls}
        />
      </div>

      {state?.error && (
        <p
          className="rounded-md bg-red-500/20 p-2 text-sm text-red-100 backdrop-blur"
          role="alert"
        >
          {state.error}
        </p>
      )}

      {forgotStage === "sent" && (
        <p className="rounded-md bg-emerald-500/20 p-3 text-sm text-emerald-100 backdrop-blur">
          Password reset email sent. Check your inbox.
        </p>
      )}
      {forgotStage === "error" && forgotError && (
        <p
          className="rounded-md bg-red-500/20 p-2 text-sm text-red-100 backdrop-blur"
          role="alert"
        >
          {forgotError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="h-16 animate-pulse rounded-md bg-white/10" />
      <div className="h-16 animate-pulse rounded-md bg-white/10" />
      <div className="h-10 animate-pulse rounded-md bg-white/10" />
    </div>
  );
}
