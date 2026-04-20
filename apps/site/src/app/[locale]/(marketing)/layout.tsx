import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Marketing chrome (sticky nav, multi-column footer). Funnel pages under
// `[locale]/(funnels)/*` use their own minimal chrome instead so that
// social-media-ad landings aren't distracted by competing CTAs.
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}
