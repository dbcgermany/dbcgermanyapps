import Link from "next/link";
import { getCoupons } from "@/actions/coupons";
import { createServerClient } from "@dbc/supabase/server";
import { CouponForm } from "./coupon-form";
import { CouponRow } from "./coupon-row";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const coupons = await getCoupons(eventId);
  const supabase = await createServerClient();
  const { data: tiersData } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr, is_active, sort_order")
    .eq("event_id", eventId)
    .order("sort_order");
  type TierKey = "name_en" | "name_de" | "name_fr";
  const nameKey = (`name_${locale}` as TierKey);
  const tiers = (tiersData ?? []).map((t) => ({
    id: t.id as string,
    name: ((t[nameKey] as string | null) ?? (t.name_en as string)),
  }));

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <PageHeader title="Coupon Codes" className="mt-2" />
      </div>

      {/* Existing coupons */}
      {coupons.length > 0 && (
        <div className="mt-6 space-y-3">
          {coupons.map((coupon) => (
            <CouponRow
              key={coupon.id}
              coupon={coupon}
              eventId={eventId}
              locale={locale}
              tiers={tiers}
            />
          ))}
        </div>
      )}

      {/* Add new coupon */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Add Coupon</h2>
        <CouponForm eventId={eventId} locale={locale} tiers={tiers} />
      </Card>
    </div>
  );
}
