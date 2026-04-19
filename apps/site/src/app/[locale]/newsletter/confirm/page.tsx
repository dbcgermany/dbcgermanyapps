import Link from "next/link";
import { Reveal } from "@dbc/ui";
import { confirmNewsletterSubscription } from "@/actions/newsletter";

const COPY = {
  en: {
    successTitle: "You're subscribed \u2014 welcome!",
    successBody:
      "Thanks for confirming. We'll send updates about Richesses d'Afrique Germany and the rest of our work to your inbox.",
    errorTitle: "Link is invalid",
    errorBody:
      "This confirmation link has expired or was already used. You can request a new one from the newsletter page.",
    home: "Back to home",
    signup: "Go to signup",
  },
  de: {
    successTitle: "Anmeldung best\u00e4tigt \u2014 willkommen!",
    successBody:
      "Vielen Dank f\u00fcr die Best\u00e4tigung. Wir schicken Ihnen Updates zu Richesses d'Afrique Germany und unserer Arbeit.",
    errorTitle: "Link ist ung\u00fcltig",
    errorBody:
      "Dieser Best\u00e4tigungslink ist abgelaufen oder wurde bereits verwendet. Sie k\u00f6nnen einen neuen anfordern.",
    home: "Zur Startseite",
    signup: "Zur Anmeldung",
  },
  fr: {
    successTitle: "Inscription confirm\u00e9e \u2014 bienvenue !",
    successBody:
      "Merci d'avoir confirm\u00e9. Vous recevrez les nouveaut\u00e9s de Richesses d'Afrique Germany et de nos programmes.",
    errorTitle: "Lien invalide",
    errorBody:
      "Ce lien de confirmation a expir\u00e9 ou a d\u00e9j\u00e0 \u00e9t\u00e9 utilis\u00e9. Vous pouvez en demander un nouveau.",
    home: "Retour \u00e0 l'accueil",
    signup: "Aller \u00e0 l'inscription",
  },
};

export default async function NewsletterConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = COPY[key];
  const result = await confirmNewsletterSubscription(token ?? "");
  const ok = "success" in result;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      <Reveal>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {ok ? t.successTitle : t.errorTitle}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {ok ? t.successBody : t.errorBody}
        </p>
      </Reveal>
      <Reveal delay={80}>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/${locale}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t.home}
        </Link>
        {!ok && (
          <Link
            href={`/${locale}/newsletter`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t.signup}
          </Link>
        )}
      </div>
      </Reveal>
    </main>
  );
}
