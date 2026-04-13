import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "site.footer" });
  const tNav = await getTranslations({ locale, namespace: "site.nav" });

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-heading text-lg font-bold">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                DBC
              </span>
              DBC Germany
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground">
              {t("parentOrg")}
            </p>
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
            &copy; {new Date().getFullYear()} DBC Germany GmbH.{" "}
            {t("rights")}
          </p>
          <p>Berlin · Frankfurt · Lubumbashi</p>
        </div>
      </div>
    </footer>
  );
}
