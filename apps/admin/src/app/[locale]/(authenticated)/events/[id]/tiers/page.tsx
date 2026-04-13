import Link from "next/link";
import { getTiers, deleteTier } from "@/actions/tiers";
import { TierForm } from "./tier-form";

export default async function TiersPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const tiers = await getTiers(eventId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/events/${eventId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to event
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold">
            Ticket Tiers
          </h1>
        </div>
      </div>

      {/* Existing tiers */}
      {tiers.length > 0 && (
        <div className="mt-6 space-y-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{tier.name_en}</p>
                  {!tier.is_public && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  &euro;{(tier.price_cents / 100).toFixed(2)} &middot;{" "}
                  {tier.quantity_sold}
                  {tier.max_quantity ? ` / ${tier.max_quantity}` : ""} sold
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteTier(tier.id, eventId, locale);
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Add new tier form */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">Add Tier</h2>
        <TierForm eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
