import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DBC } from "@/lib/dbc-assets";

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
  {
    key: "incubation",
    photo: DBC.photo.incubation,
    icon: DBC.serviceIcon.incubation,
    href: (l: string) => `/${l}/services/incubation`,
  },
  {
    key: "courses",
    photo: DBC.photo.courses,
    icon: DBC.serviceIcon.courses,
    href: (l: string) => `/${l}/services/courses`,
  },
  {
    key: "investments",
    photo: DBC.photo.investments,
    icon: DBC.serviceIcon.investments,
    href: (l: string) => `/${l}/services/investments`,
  },
  {
    key: "mentorship",
    photo: DBC.photo.mentorship,
    icon: DBC.serviceIcon.mentorship,
    href: (l: string) => `/${l}/services/mentorship`,
  },
  {
    key: "events",
    photo: DBC.photo.events,
    icon: DBC.serviceIcon.events,
    href: (l: string) => `/${l}/events`,
  },
  {
    key: "elearning",
    photo: DBC.photo.cohort,
    icon: DBC.serviceIcon.elearning,
    href: (l: string) => `/${l}/services/elearning`,
  },
] as const;

export default async function ServicesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src={DBC.hero.services}
          alt="DBC Germany services overview"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          referrerPolicy="no-referrer"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
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
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.key}
              href={s.href(locale)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src={s.photo}
                  alt={t(`services.${s.key}.title`)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 flex h-14 w-14 items-center justify-center rounded-xl border border-white/30 bg-background/90 backdrop-blur">
                  <Image
                    src={s.icon}
                    alt=""
                    width={32}
                    height={32}
                    aria-hidden
                    className="h-8 w-8 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-10">
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
              </div>
            </Link>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("services.germanyBand.eyebrow")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t("services.germanyBand.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("services.germanyBand.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["meetups", "incubator", "fund", "tickets"] as const).map(
            (key) => {
              const href = t(`services.germanyBand.items.${key}.href`);
              const external = href.startsWith("http");
              const localHref = external ? href : `/${locale}${href}`;
              return (
                <Link
                  key={key}
                  href={localHref}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <h3 className="font-heading text-lg font-bold">
                    {t(`services.germanyBand.items.${key}.title`)}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {t(`services.germanyBand.items.${key}.body`)}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t(`services.germanyBand.items.${key}.cta`)}
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </section>
    </>
  );
}
