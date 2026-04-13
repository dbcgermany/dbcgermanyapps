import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const VALID_SERVICES = [
  "incubation",
  "courses",
  "investments",
  "mentorship",
  "elearning",
] as const;
type ValidService = (typeof VALID_SERVICES)[number];

function isValidService(s: string): s is ValidService {
  return (VALID_SERVICES as readonly string[]).includes(s);
}

export function generateStaticParams() {
  return VALID_SERVICES.map((service) => ({ service }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}): Promise<Metadata> {
  const { locale, service } = await params;
  if (!isValidService(service)) return {};
  const t = await getTranslations({ locale, namespace: "site.services" });
  return {
    title: t(`${service}.title`),
    description: t(`${service}.long`),
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}) {
  const { locale, service } = await params;
  if (!isValidService(service)) notFound();

  const t = await getTranslations({ locale, namespace: "site" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bullets = t.raw(`services.${service}.bullets`) as string[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Link
        href={`/${locale}/services`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t("nav.services")}
      </Link>

      <div className="mt-6 grid gap-12 md:grid-cols-[3fr_2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("services.eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {t(`services.${service}.title`)}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t(`services.${service}.long`)}
          </p>

          <ul className="mt-10 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                >
                  &#x2713;
                </span>
                <span className="text-base leading-7 text-foreground">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/contact`}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t("cta.secondary")}
            </Link>
            <Link
              href={`/${locale}/services`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {t("services.eyebrow")}
            </Link>
          </div>
        </div>

        {/* Visual panel */}
        <aside className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("services.eyebrow")}
              </p>
              <p className="mt-4 font-heading text-2xl font-bold">
                {t(`services.${service}.title`)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`services.${service}.short`)}
              </p>
            </div>
            <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              <p>{t("cta.readySub")}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
