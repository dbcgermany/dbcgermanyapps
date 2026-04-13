import Link from "next/link";
import { getCoupons, toggleCouponActive } from "@/actions/coupons";
import { CouponForm } from "./coupon-form";

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const coupons = await getCoupons(eventId);

  return (
    <div className="p-8">
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
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
                    {coupon.code}
                  </code>
                  {!coupon.is_active && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}% off`
                    : `\u20AC${(coupon.discount_value / 100).toFixed(2)} off`}
                  {" \u00B7 "}
                  {coupon.times_used}
                  {coupon.max_uses ? ` / ${coupon.max_uses}` : ""} used
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await toggleCouponActive(coupon.id, eventId, locale);
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {coupon.is_active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
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
