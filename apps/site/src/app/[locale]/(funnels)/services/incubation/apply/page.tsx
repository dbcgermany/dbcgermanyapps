import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { seoFromI18n } from "@/lib/seo";
import { WizardShell } from "./wizard/wizard-shell";

type PageLocale = "en" | "de" | "fr";

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

export default async function IncubationApplyFunnelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: PageLocale =
    locale === "de" || locale === "fr" ? (locale as PageLocale) : "en";
  const t = await getTranslations({ locale: l, namespace: "incubationApply" });

  return (
    <section className="relative min-h-[calc(100vh-56px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
      />
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {t("landing.eyebrow")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("landing.title")}
        </h1>
      </div>
      <WizardShell locale={l} />
    </section>
  );
}
