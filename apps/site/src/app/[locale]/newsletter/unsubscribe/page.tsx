import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { unsubscribeFromNewsletter } from "@/actions/newsletter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({
    locale,
    pathSuffix: "/newsletter/unsubscribe",
    pageKey: "newsletterUnsubscribe",
  });
}

const COPY = {
  en: {
    title: "You've been unsubscribed",
    body: "We won't send you any more newsletters. If this was a mistake, you can re-subscribe anytime.",
    errorTitle: "Invalid unsubscribe link",
    errorBody: "The link is missing or malformed. If you keep receiving emails, reply to any of them and we'll remove you manually.",
    home: "Back to home",
    signup: "Re-subscribe",
  },
  de: {
    title: "Sie wurden abgemeldet",
    body: "Wir senden Ihnen keine Newsletter mehr. Falls das ein Versehen war, k\u00f6nnen Sie sich jederzeit erneut anmelden.",
    errorTitle: "Ung\u00fcltiger Abmeldelink",
    errorBody: "Der Link fehlt oder ist besch\u00e4digt. Falls Sie weiterhin E-Mails erhalten, antworten Sie einfach und wir entfernen Sie manuell.",
    home: "Zur Startseite",
    signup: "Erneut anmelden",
  },
  fr: {
    title: "D\u00e9sinscription confirm\u00e9e",
    body: "Vous ne recevrez plus nos newsletters. Si c'\u00e9tait une erreur, vous pouvez vous r\u00e9-inscrire \u00e0 tout moment.",
    errorTitle: "Lien de d\u00e9sinscription invalide",
    errorBody: "Le lien est absent ou incorrect. Si vous continuez \u00e0 recevoir des e-mails, r\u00e9pondez-nous et nous vous retirerons manuellement.",
    home: "Retour \u00e0 l'accueil",
    signup: "Se r\u00e9-inscrire",
  },
};

export default async function NewsletterUnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; send?: string }>;
}) {
  const { locale } = await params;
  const { token, send } = await searchParams;
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = COPY[key];

  const result = token
    ? await unsubscribeFromNewsletter({
        token,
        newsletterSendId: send ?? null,
      })
    : { error: "missing token" as const };

  const ok = "success" in result;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      <Reveal>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {ok ? t.title : t.errorTitle}
        </h1>
        <p className="mt-4 text-muted-foreground">{ok ? t.body : t.errorBody}</p>
      </Reveal>
      <Reveal delay={80}>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/${locale}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t.home}
        </Link>
        <Link
          href={`/${locale}/newsletter`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t.signup}
        </Link>
      </div>
      </Reveal>
    </main>
  );
}
