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
          alt=""
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

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.key}
              href={s.href(locale)}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-10 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary to-accent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Image
                  src={s.icon}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="mt-6 font-heading text-2xl font-bold">
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
    </>
  );
}
