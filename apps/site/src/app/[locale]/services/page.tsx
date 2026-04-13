import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.services" });
  return { title: t("title") };
}

const SERVICES = [
  { key: "incubation", href: (l: string) => `/${l}/services/incubation` },
  { key: "courses", href: (l: string) => `/${l}/services/courses` },
  { key: "investments", href: (l: string) => `/${l}/services/investments` },
  { key: "mentorship", href: (l: string) => `/${l}/services/mentorship` },
  { key: "events", href: (l: string) => `/${l}/events` },
  { key: "elearning", href: (l: string) => `/${l}/services/elearning` },
] as const;

export default async function ServicesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {t("services.eyebrow")}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {t("services.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("services.subtitle")}
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {SERVICES.map((s) => (
          <Link
            key={s.key}
            href={s.href(locale)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-10 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <h2 className="font-heading text-2xl font-bold">
              {t(`services.${s.key}.title`)}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t(`services.${s.key}.long`)}
            </p>
            <span className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {t("services.learnMore")}
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
