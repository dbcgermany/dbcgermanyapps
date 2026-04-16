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
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("about.title") };
}

export default async function AboutPage({
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
          src={DBC.photo.team}
          alt="The DBC Germany team"
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
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("about.eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("about.title")}
          </h1>
          <p className="mt-8 text-lg leading-8 text-muted-foreground">
            {t("about.body")}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Image
              src={DBC.logo}
              alt="DBC Germany"
              width={18}
              height={18}
              className="h-4 w-4 object-contain"
              referrerPolicy="no-referrer"
            />
            {t("affiliation.badge")}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-[2fr_1fr]">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                {locale === "de"
                  ? "Unser Gründer"
                  : locale === "fr"
                    ? "Notre fondateur"
                    : "Our founder"}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {locale === "de"
                  ? "Dr. Jean-Clément Diambilay gründete das Diambilay Business Center in Lubumbashi mit einer einfachen Überzeugung: Afrikas größte wirtschaftliche Ressource sind seine Menschen. DBC Germany trägt diese Überzeugung nach Europa und bringt jede Säule unseres Ökosystems zur afrikanischen Diaspora."
                  : locale === "fr"
                    ? "Le Dr Jean-Clément Diambilay a fondé le Diambilay Business Center à Lubumbashi avec une conviction simple : la plus grande ressource économique de l'Afrique, ce sont ses peuples. DBC Germany porte cette conviction en Europe."
                    : "Dr. Jean-Clément Diambilay founded the Diambilay Business Center in Lubumbashi on one simple conviction: Africa's greatest economic asset is its people. DBC Germany carries that conviction to Europe and brings every pillar of our ecosystem to the African diaspora."}
              </p>
            </div>
            <figure className="flex flex-col gap-3">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <Image
                  src={DBC.photo.founder}
                  alt="Dr. Jean-Clément Diambilay"
                  fill
                  sizes="(min-width: 768px) 33vw, 80vw"
                  className="object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              <figcaption className="text-center">
                <p className="font-heading text-base font-bold leading-tight">
                  Dr. Jean-Clément Diambilay
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {locale === "de"
                    ? "Gründer · DBC Group"
                    : locale === "fr"
                      ? "Fondateur · DBC Group"
                      : "Founder · DBC Group"}
                </p>
              </figcaption>
            </figure>
          </div>

          <blockquote className="mt-20 border-l-4 border-primary bg-muted/30 px-6 py-8 sm:px-10">
            <p className="font-heading text-xl italic leading-relaxed text-foreground sm:text-2xl">
              “{t("about.conviction")}”
            </p>
            <footer className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              — {t("about.convictionAttribution")}
            </footer>
          </blockquote>

          <div className="mt-20 grid items-center gap-12 md:grid-cols-2">
            <div className="relative order-last aspect-[4/3] overflow-hidden rounded-2xl md:order-first">
              <Image
                src={DBC.photo.cohort}
                alt="DBC Germany incubation cohort participants"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold">
                {locale === "de"
                  ? "Wo wir sind"
                  : locale === "fr"
                    ? "Où nous sommes"
                    : "Where we operate"}
              </h2>
              <ul className="mt-4 space-y-3 text-base">
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                  />
                  <span>
                    <strong>Düsseldorf</strong> —{" "}
                    {locale === "de"
                      ? "Sitz der DBC Germany: Inkubation, Investitionen, Operations."
                      : locale === "fr"
                        ? "Siège de DBC Germany : incubation, investissements, opérations."
                        : "DBC Germany HQ: incubation, investments, operations."}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70"
                  />
                  <span>
                    <strong>Essen</strong> —{" "}
                    {locale === "de"
                      ? "Veranstaltungsort Richesses d'Afrique 2026. Nur Event, kein Dauerstandort."
                      : locale === "fr"
                        ? "Lieu de Richesses d'Afrique 2026. Événement ponctuel, pas de bureau permanent."
                        : "Venue for Richesses d'Afrique 2026. Event only, not a permanent office."}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent"
                  />
                  <span>
                    <strong>Lubumbashi, DR Congo</strong> —{" "}
                    {locale === "de"
                      ? "Mutterorganisation · 378, Av Likasi · +243 820 121 513"
                      : locale === "fr"
                        ? "Organisation mère · 378, Av Likasi · +243 820 121 513"
                        : "Parent organisation · 378, Av Likasi · +243 820 121 513"}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent/70"
                  />
                  <span>
                    <strong>Herblay-sur-Seine, France</strong> —{" "}
                    {locale === "de"
                      ? "DBC France SAS (SIREN 940 839 145) · 43 Avenue du Gros Chêne"
                      : locale === "fr"
                        ? "DBC France SAS (SIREN 940 839 145) · 43 Avenue du Gros Chêne"
                        : "DBC France SAS (SIREN 940 839 145) · 43 Avenue du Gros Chêne"}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/contact`}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("about.ctaCareers")}
            </Link>
            <Link
              href={`/${locale}/services`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {t("nav.services")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
