"use client";

import { Suspense, use, useState } from "react";
import { createBrowserClient } from "@dbc/supabase";
import { useSearchParams } from "next/navigation";

export default function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return (
    <Suspense fallback={null}>
      <AuthForm locale={locale} />
    </Suspense>
  );
}

function AuthForm({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? `/${locale}/orders`;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = {
    en: {
      title: "Sign in with email",
      description: "Enter your email and we\u2019ll send you a sign-in link.",
      placeholder: "your@email.com",
      submit: "Send magic link",
      sent: "Check your email for a sign-in link.",
      expiry: "The link expires in 10 minutes.",
      error: "Something went wrong. Please try again.",
    },
    de: {
      title: "Mit E-Mail anmelden",
      description: "Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Anmeldelink.",
      placeholder: "ihre@email.de",
      submit: "Magic Link senden",
      sent: "Pr\u00fcfen Sie Ihre E-Mail auf einen Anmeldelink.",
      expiry: "Der Link l\u00e4uft in 10 Minuten ab.",
      error: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    },
    fr: {
      title: "Se connecter par e-mail",
      description: "Entrez votre e-mail et nous vous enverrons un lien de connexion.",
      placeholder: "votre@email.fr",
      submit: "Envoyer le lien",
      sent: "V\u00e9rifiez votre e-mail pour un lien de connexion.",
      expiry: "Le lien expire dans 10 minutes.",
      error: "Quelque chose s\u2019est mal pass\u00e9. Veuillez r\u00e9essayer.",
    },
  }[locale] ?? {
    title: "Sign in", description: "", placeholder: "email", submit: "Send", sent: "Check email.", expiry: "", error: "Error",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(t.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/30">
            &#x2709;
          </div>
          <h1 className="font-heading text-2xl font-bold">{t.sent}</h1>
          <p className="text-sm text-muted-foreground">{t.expiry}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
