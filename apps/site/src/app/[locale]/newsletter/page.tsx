import { Reveal } from "@dbc/ui";
import { NewsletterSignupForm } from "./signup-form";

const COPY = {
  en: {
    eyebrow: "Stay in the loop",
    title: "DBC Germany newsletter",
    body: "Curated updates on Richesses d'Afrique Germany, incubation calls, and diaspora-economy briefs for business leaders in Europe and Africa. One email at most per week, unsubscribe in one click.",
  },
  de: {
    eyebrow: "Bleiben Sie verbunden",
    title: "DBC-Germany-Newsletter",
    body: "Kuratierte Updates zu Richesses d'Afrique Germany, Incubation-Calls und Briefings zur Diaspora-Wirtschaft f\u00fcr F\u00fchrungskr\u00e4fte in Europa und Afrika. H\u00f6chstens eine E-Mail pro Woche, jederzeit mit einem Klick abmeldbar.",
  },
  fr: {
    eyebrow: "Restez inform\u00e9\u00b7e",
    title: "Newsletter DBC Germany",
    body: "Des mises \u00e0 jour cibl\u00e9es sur Richesses d'Afrique Germany, les appels d'incubation et les notes sur l'\u00e9conomie de la diaspora pour les dirigeants en Europe et en Afrique. Au plus un e-mail par semaine, d\u00e9sinscription en un clic.",
  },
};

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = COPY[key];

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-4 text-muted-foreground">{t.body}</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10">
          <NewsletterSignupForm locale={key} />
        </div>
      </Reveal>
    </main>
  );
}
