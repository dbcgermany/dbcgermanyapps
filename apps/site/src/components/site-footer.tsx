import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { DBC } from "@/lib/dbc-assets";
import { getCompanyInfo, getTagline } from "@/lib/company-info";
import { NewsletterFooterSignup } from "./newsletter-footer-signup";
import { CookieSettingsButton } from "@dbc/ui";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "site.footer" });
  const tNav = await getTranslations({ locale, namespace: "site.nav" });
  const tAff = await getTranslations({ locale, namespace: "site.affiliation" });
  const info = await getCompanyInfo();

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  const logoUrl = info?.logo_light_url || DBC.logo;
  const brandName = info?.brand_name || "DBC Germany";
  const tagline = getTagline(info, locale) || t("tagline");
  const socials: Array<{ label: string; url: string }> = [
    { label: "LinkedIn", url: info?.linkedin_url || "" },
    { label: "Instagram", url: info?.instagram_url || "" },
    { label: "Facebook", url: info?.facebook_url || "" },
    { label: "WhatsApp", url: info?.whatsapp_url || "" },
    { label: "YouTube", url: info?.youtube_url || "" },
    { label: "X", url: info?.twitter_url || "" },
  ].filter((s) => s.url);

  return (
    <footer className="mt-24 border-t border-border bg-surface-footer">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-heading text-lg font-bold">
              <Image
                src={logoUrl}
                alt={brandName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                referrerPolicy="no-referrer"
              />
              {brandName}
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {tagline}
            </p>

            <NewsletterFooterSignup locale={locale} />

            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-3 text-xs">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:border-primary/40 hover:text-primary"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
              <Image
                src={logoUrl}
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
                  href={`/${locale}/team`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("team")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/news`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("news")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/press`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("press")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/partners`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("partners")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/careers`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("careers")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/faq`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("faq")}
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
              <li>
                <Link
                  href={`/${locale}/cookies`}
                  className="text-foreground hover:text-primary"
                >
                  {tNav("cookies")}
                </Link>
              </li>
              <li>
                <CookieSettingsButton className="cursor-pointer text-sm text-foreground hover:text-primary text-left">
                  {locale === "de"
                    ? "Cookie-Einstellungen"
                    : locale === "fr"
                      ? "Paramètres des cookies"
                      : "Cookie settings"}
                </CookieSettingsButton>
              </li>
              <li>
                <Link
                  href={`/${locale}/us-privacy-notice`}
                  className="text-foreground hover:text-primary"
                >
                  Do Not Sell or Share
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>
            <p>
              &copy; {new Date().getFullYear()}{" "}
              {info?.legal_name || "DBC Germany"}
              {info?.legal_form ? ` ${info.legal_form}` : ""}. {t("rights")}
            </p>
            <p className="mt-1">
              Developed by{" "}
              <a
                href="https://narikia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 hover:text-primary"
              >
                Narikia UG
              </a>
            </p>
          </div>
          <p>Düsseldorf · Essen · Lubumbashi</p>
        </div>
      </div>
    </footer>
  );
}
