import { notFound } from "next/navigation";
import { getEventBySlug, getPublicTiers } from "@/lib/queries";
import { CheckoutForm } from "./checkout-form";

const ALLOWED_SOURCES = new Set([
  "door_poster",
  "newsletter",
  "direct",
  "partner",
  "press",
  "funnel",
]);

// `fn` (funnel slug) is validated in the webhook against the funnels table,
// not here — we just need a shape guard so garbage can't sneak into Stripe
// metadata. Accept the same slug shape the funnels table's CHECK enforces.
const FUNNEL_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ src?: string; tier?: string; fn?: string }>;
}) {
  const { locale, slug } = await params;
  const { src, tier, fn } = await searchParams;
  const source = src && ALLOWED_SOURCES.has(src) ? src : null;
  const funnelSlug = fn && FUNNEL_SLUG_RE.test(fn) ? fn : null;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const tiers = await getPublicTiers(event.id);
  const availableTiers = tiers.filter((t) => {
    if (t.max_quantity !== null && t.quantity_sold >= t.max_quantity) return false;
    if (t.sales_start_at && new Date(t.sales_start_at) > new Date()) return false;
    if (t.sales_end_at && new Date(t.sales_end_at) < new Date()) return false;
    return true;
  });

  // Match the requested tier slug against the available tiers. If it matches,
  // the form opens with that tier pre-selected on the first attendee —
  // visitor landed from a funnel pricing button, one click to attendee form.
  const preselectedTier = tier
    ? availableTiers.find((t) => t.slug === tier) ?? null
    : null;

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
        source={funnelSlug ? "funnel" : source}
        funnelSlug={funnelSlug}
        initialTierId={preselectedTier?.id ?? null}
      />
    </main>
  );
}
