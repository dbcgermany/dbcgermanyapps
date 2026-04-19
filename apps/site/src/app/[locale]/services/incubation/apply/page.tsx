import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { IncubationForm } from "./form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({
    locale,
    pathSuffix: "/services/incubation/apply",
    pageKey: "servicesApply",
  });
}

export default async function IncubationApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const copy = {
    eyebrow: {
      en: "Incubation application",
      de: "Bewerbung Inkubation",
      fr: "Candidature incubation",
    }[l],
    title: {
      en: "Tell us about your company.",
      de: "Erzähle uns von deinem Unternehmen.",
      fr: "Parlez-nous de votre entreprise.",
    }[l],
    intro: {
      en: "We review applications weekly. You'll hear back within 10 business days.",
      de: "Wir sichten Bewerbungen wöchentlich. Du hörst innerhalb von 10 Werktagen von uns.",
      fr: "Nous étudions les candidatures chaque semaine. Réponse sous 10 jours ouvrés.",
    }[l],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <IncubationForm locale={l} />
      </Reveal>
    </div>
  );
}
