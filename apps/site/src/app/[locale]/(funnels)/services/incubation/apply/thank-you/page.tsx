import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({
    locale,
    pathSuffix: "/services/incubation/apply/thank-you",
    pageKey: "servicesApply",
  });
}

export default async function IncubationApplyThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "incubationApply" });

  const steps = Array.from({ length: 3 }, (_, i) => t(`thankYou.nextSteps.${i}`));

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          &#10003;
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {t("thankYou.title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {t("thankYou.body")}
        </p>
      </Reveal>

      <Reveal delay={100}>
        <ol className="mt-8 space-y-3 text-sm text-muted-foreground">
          {steps.map((s, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </span>
              <span className="flex-1 pt-0.5 text-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            {t("thankYou.ctaHome")}
          </Link>
          <a
            href={t("thankYou.ctaFollowHref")}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t("thankYou.ctaFollow")}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
