import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { NewsletterSignupForm } from "./signup-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/newsletter", pageKey: "newsletter" });
}

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
  const t = await getTranslations({ locale: key, namespace: "site.newsletter.page" });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("body")}</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10">
          <NewsletterSignupForm locale={key} />
        </div>
      </Reveal>
    </main>
  );
}
