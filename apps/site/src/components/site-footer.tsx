import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { DBC } from "@/lib/dbc-assets";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "site.footer" });
  const tNav = await getTranslations({ locale, namespace: "site.nav" });
  const tAff = await getTranslations({ locale, namespace: "site.affiliation" });

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-heading text-lg font-bold">
              <Image
                src={DBC.logo}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                referrerPolicy="no-referrer"
              />
              DBC Germany
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("tagline")}
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
              <Image
                src={DBC.logo}
                alt="Diambilay Business Center"
                width={40}
                height={40}
                className="mt-0.5 h-10 w-10 shrink-0 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="text-xs leading-5 text-muted-foreground">
                <p>{tAff("footer")}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <a
                    href={DBC.parentSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                  >
                    diambilaybusinesscenter.org
                  </a>
                  <a
                    href={DBC.sisterSites.richesses}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {tAff("sisterRichesses")}
                  </a>
                  <a
                    href={DBC.sisterSites.academie}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {tAff("sisterAcademie")}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.services")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/services/incubation`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("incubation")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/courses`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("courses")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/investments`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("investments")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/mentorship`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("mentorship")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/events`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("events")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services/elearning`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("elearning")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.company")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-foreground hover:text-primary"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("contact")}
                </Link>
              </li>
              <li>
                <a
                  href={ticketsUrl}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("tickets")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.legal")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-foreground hover:text-primary"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-foreground hover:text-primary"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/imprint`}
                  className="text-foreground hover:text-primary"
                >
                  {t("imprint")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} DBC Germany (UG i.G.).{" "}
            {t("rights")}
          </p>
          <p>Düsseldorf · Essen · Lubumbashi</p>
        </div>
      </div>
    </footer>
  );
}
