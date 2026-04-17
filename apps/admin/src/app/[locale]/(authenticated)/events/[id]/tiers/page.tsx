import Link from "next/link";
import { getTiers } from "@/actions/tiers";
import { TierForm } from "./tier-form";
import { TiersSortable } from "./tiers-sortable";

export default async function TiersPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const tiers = await getTiers(eventId);

  return (
    <div>
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
        <div className="mt-6">
          <TiersSortable tiers={tiers} eventId={eventId} locale={locale} />
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
