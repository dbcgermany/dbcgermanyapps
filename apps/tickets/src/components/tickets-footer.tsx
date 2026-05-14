import { useTranslations } from "next-intl";
import Link from "next/link";

// Minimal compliant footer for the tickets app. German law (TMG / §5 DDG)
// requires the Impressum to be reachable from every page "ohne wesentliche
// Zwischenschritte" — typically interpreted as max 2 clicks from anywhere.
// Until 2026-05-02 the tickets app linked the Impressum from no page; this
// footer closes that gap.
export function TicketsFooter({ locale }: { locale: string }) {
  // Reads from `site.footer` so the Impressum / Privacy / Terms / Cookie
  // labels stay in sync with the marketing site. The previous `nav`
  // namespace doesn't exist in the messages tree — every link rendered
  // its dotted path verbatim.
  const t = useTranslations("site.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} DBC Germany UG</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/${locale}/imprint`} className="hover:text-foreground">
            {t("imprint")}
          </Link>
          <Link href={`/${locale}/privacy`} className="hover:text-foreground">
            {t("privacy")}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-foreground">
            {t("terms")}
          </Link>
          <Link href={`/${locale}/cookies`} className="hover:text-foreground">
            {t("cookiePolicy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
