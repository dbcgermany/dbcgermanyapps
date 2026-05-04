"use client";

import { Suspense, use, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithPassword, requestPasswordResetForEmail } from "@/actions/auth";
import { createBrowserClient } from "@dbc/supabase";
import { Button } from "@dbc/ui";

type Locale = "en" | "de" | "fr";

const LOGIN_COPY = {
  en: {
    subtitle: "Admin Dashboard",
    trouble: "Trouble signing in? Contact",
    emailLabel: "Email",
    emailPlaceholder: "you@dbc-germany.com",
    passwordLabel: "Password",
    forgot: "Forgot?",
    enterEmailFirst: "Enter your email first.",
    resetSent: "Password reset email sent. Check your inbox.",
    signingIn: "Signing in...",
    sendingReset: "Sending reset email...",
    signIn: "Sign in",
  },
  de: {
    subtitle: "Admin-Dashboard",
    trouble: "Probleme beim Anmelden? Kontakt:",
    emailLabel: "E-Mail",
    emailPlaceholder: "sie@dbc-germany.com",
    passwordLabel: "Passwort",
    forgot: "Vergessen?",
    enterEmailFirst: "Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.",
    resetSent:
      "E-Mail zum Zurücksetzen des Passworts gesendet. Schauen Sie in Ihr Postfach.",
    signingIn: "Anmelden …",
    sendingReset: "E-Mail wird gesendet …",
    signIn: "Anmelden",
  },
  fr: {
    subtitle: "Tableau de bord admin",
    trouble: "Problème de connexion ? Contact :",
    emailLabel: "E-mail",
    emailPlaceholder: "vous@dbc-germany.com",
    passwordLabel: "Mot de passe",
    forgot: "Oublié ?",
    enterEmailFirst: "Veuillez d'abord saisir votre adresse e-mail.",
    resetSent:
      "E-mail de réinitialisation envoyé. Vérifiez votre boîte de réception.",
    signingIn: "Connexion …",
    sendingReset: "Envoi de l'e-mail …",
    signIn: "Se connecter",
  },
} satisfies Record<Locale, Record<string, string>>;

function localeKey(input: string): Locale {
  if (input === "de" || input === "fr") return input;
  return "en";
}

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
          <p className="mt-1 text-sm text-white/70">
            {LOGIN_COPY[localeKey(locale)].subtitle}
          </p>
        </div>

        {bootstrapping ? (
          <LoginFormFallback />
        ) : (
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm locale={locale} />
          </Suspense>
        )}

        <p className="text-center text-xs text-white/60">
          {LOGIN_COPY[localeKey(locale)].trouble}{" "}
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
  const t = LOGIN_COPY[localeKey(locale)];
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
      setForgotError(t.enterEmailFirst);
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
          {t.emailLabel}
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
          placeholder={t.emailPlaceholder}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            {t.passwordLabel}
          </label>
          <button
            type="button"
            onClick={handleForgot}
            className="text-xs text-white/80 hover:text-white"
          >
            {t.forgot}
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
          className="rounded-md bg-danger-strong/20 p-2 text-sm text-danger-strong backdrop-blur"
          role="alert"
        >
          {state.error}
        </p>
      )}

      {forgotStage === "sent" && (
        <p className="rounded-md bg-success-strong/20 p-3 text-sm text-success-strong backdrop-blur">
          {t.resetSent}
        </p>
      )}
      {forgotStage === "error" && forgotError && (
        <p
          className="rounded-md bg-danger-strong/20 p-2 text-sm text-danger-strong backdrop-blur"
          role="alert"
        >
          {forgotError}
        </p>
      )}

      <Button type="submit"
        disabled={isPending}>
        {isPending
          ? t.signingIn
          : forgotStage === "sending"
            ? t.sendingReset
            : t.signIn}
      </Button>
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
