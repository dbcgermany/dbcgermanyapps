import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Absolute minimum footer permitted by law + brand. No about/careers/socials —
// those belong on the marketing site. Keeps the funnel page focused on the
// single conversion goal (submit the form).
export async function FunnelLegalFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "site.footer" });
  const year = new Date().getFullYear();

  const links = [
    { href: `/${locale}/imprint`, label: t("imprint") },
    { href: `/${locale}/privacy`, label: t("privacy") },
    { href: `/${locale}/cookies`, label: t("cookiePolicy") },
  ];

  return (
    <footer
      className="border-t border-border bg-background py-6 text-xs text-muted-foreground"
      data-funnel-footer
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
        <p>
          &copy; {year} DBC Germany. {t("rights")}
        </p>
        <ul className="flex flex-wrap items-center gap-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
