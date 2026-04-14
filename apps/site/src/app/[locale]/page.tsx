import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getUpcomingEvents } from "@/lib/queries";
import { DBC } from "@/lib/dbc-assets";

export const revalidate = 60;

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
    photo: DBC.photo.incubationSidebar,
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
    photo: DBC.photo.eventFallback,
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const events = await getUpcomingEvents(3);

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src={DBC.hero.home}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          referrerPolicy="no-referrer"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/50 dark:from-background/95 dark:via-background/85 dark:to-background/50"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 15% 0%, rgba(200,16,46,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 90% 10%, rgba(212,160,23,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("hero.tag")}
          </p>

          <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={ticketsUrl}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              {t("hero.ctaPrimary")}
            </a>
            <Link
              href={`/${locale}/contact`}
              className="rounded-full border border-border bg-background/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-muted"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: t("stats.countries"), value: t("stats.countriesValue") },
              { label: t("stats.founders"), value: t("stats.foundersValue") },
              { label: t("stats.capital"), value: t("stats.capitalValue") },
              { label: t("stats.years"), value: t("stats.yearsValue") },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {item.value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Services grid --------------------------------------------------- */}
      <section id="services" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("services.eyebrow")}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {t("services.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("services.subtitle")}
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.key}
                href={s.href(locale)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <Image
                    src={s.photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-background/90 backdrop-blur">
                    <Image
                      src={s.icon}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <h3 className="font-heading text-xl font-bold">
                    {t(`services.${s.key}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t(`services.${s.key}.short`)}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
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
      </section>

      {/* Events teaser ---------------------------------------------------- */}
      <section className="border-y border-border bg-muted/40 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("events.eyebrow")}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t("events.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t("events.subtitle")}
              </p>
            </div>
            <a
              href={ticketsUrl}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
            >
              {t("events.cta")}
              <span aria-hidden>&rarr;</span>
            </a>
          </div>

          {events.length === 0 ? (
            <div className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-2">
              <div className="relative aspect-[4/3] w-full md:aspect-auto">
                <Image
                  src={DBC.photo.eventFallback}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-background/80" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Richesses d&apos;Afrique 2026
                </p>
                <h3 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
                  {locale === "de"
                    ? "13. Juni 2026 · Essen"
                    : locale === "fr"
                      ? "13 juin 2026 · Essen"
                      : "13 June 2026 · Essen"}
                </h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {t("events.noUpcoming")}
                </p>
                <a
                  href={ticketsUrl}
                  className="mt-6 inline-flex w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {t("events.cta")}
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const titleKey = `title_${locale}` as keyof typeof event;
                const title =
                  (event[titleKey] as string) || event.title_en;
                const cover = event.cover_image_url ?? DBC.photo.eventFallback;
                return (
                  <a
                    key={event.id}
                    href={`${ticketsUrl}/${locale}/events/${event.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={cover}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-medium uppercase tracking-wider text-primary">
                        {event.event_type}
                      </p>
                      <h3 className="mt-2 font-heading text-lg font-bold group-hover:text-primary">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {new Date(event.starts_at).toLocaleDateString(locale, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.venue_name}
                        {event.city && ` · ${event.city}`}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About snippet --------------------------------------------------- */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              {[DBC.gallery[0], DBC.gallery[1], DBC.gallery[2], DBC.gallery[3]].map(
                (src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("about.eyebrow")}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t("about.title")}
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t("about.body")}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Image
                  src={DBC.logo}
                  alt=""
                  width={18}
                  height={18}
                  className="h-4 w-4 object-contain"
                  referrerPolicy="no-referrer"
                />
                {t("affiliation.badge")}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/about`}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {t("about.ctaFounder")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band -------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[#8d0a20]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(50% 50% at 80% 50%, rgba(212,160,23,0.40) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-8 px-4 py-20 text-primary-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {t("cta.ready")}
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/80">
              {t("cta.readySub")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/services/incubation`}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-white/90"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
