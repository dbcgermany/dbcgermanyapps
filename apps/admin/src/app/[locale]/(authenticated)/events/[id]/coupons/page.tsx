import Link from "next/link";
import { getCoupons } from "@/actions/coupons";
import { CouponForm } from "./coupon-form";
import { CouponRow } from "./coupon-row";

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const coupons = await getCoupons(eventId);

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Coupon Codes</h1>
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
            />
          ))}
        </div>
      )}

      {/* Add new coupon */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">Add Coupon</h2>
        <CouponForm eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
