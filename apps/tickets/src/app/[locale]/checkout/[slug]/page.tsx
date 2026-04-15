import { notFound } from "next/navigation";
import { getEventBySlug, getPublicTiers } from "@/lib/queries";
import { CheckoutForm } from "./checkout-form";

const ALLOWED_SOURCES = new Set([
  "door_poster",
  "newsletter",
  "direct",
  "partner",
  "press",
]);

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { locale, slug } = await params;
  const { src } = await searchParams;
  const source = src && ALLOWED_SOURCES.has(src) ? src : null;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const tiers = await getPublicTiers(event.id);
  const availableTiers = tiers.filter((tier) => {
    if (tier.max_quantity !== null && tier.quantity_sold >= tier.max_quantity) return false;
    if (tier.sales_start_at && new Date(tier.sales_start_at) > new Date()) return false;
    if (tier.sales_end_at && new Date(tier.sales_end_at) < new Date()) return false;
    return true;
  });

  const titleKey = `title_${locale}` as keyof typeof event;
  const title = (event[titleKey] as string) || event.title_en;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-2xl font-bold">
        {locale === "de" ? "Kasse" : locale === "fr" ? "Paiement" : "Checkout"}
      </h1>
      <p className="mt-1 text-muted-foreground">{title}</p>

      <CheckoutForm
        eventSlug={slug}
        locale={locale}
        tiers={availableTiers.map((t) => ({
          id: t.id,
          name: (t[`name_${locale}` as keyof typeof t] as string) || t.name_en,
          priceCents: t.price_cents,
        }))}
        maxPerOrder={event.max_tickets_per_order}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        source={source}
      />
    </main>
  );
}
