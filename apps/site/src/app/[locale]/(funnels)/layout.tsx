import { FunnelTopBar } from "@/components/funnel/funnel-topbar";
import { FunnelLegalFooter } from "@/components/funnel/funnel-legal-footer";

// Minimal chrome for social-media-ad landing pages. Swap the marketing
// header/footer (multi-level nav, competing CTAs) for a logo + locale
// picker and a single-line legal footer. Shared by every route under
// `[locale]/(funnels)/*` — the incubation funnel today, event-ticket
// funnels later.
export default async function FunnelsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <a
        href="#funnel-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <FunnelTopBar locale={locale} />
      <main id="funnel-content" className="flex-1">
        {children}
      </main>
      <FunnelLegalFooter locale={locale} />
    </>
  );
}
