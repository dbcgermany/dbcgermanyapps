"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Card, ConfirmDialog } from "@dbc/ui";
import {
  issueTeamFriendCoupons,
  listMyTeamFriendCoupons,
  revokeTeamFriendCoupon,
} from "@/actions/team-friend-invites";

interface EventOption {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  quota: number;
  targetTierName: string | null;
  targetPriceEur: string | null;
}

interface CouponRow {
  id: string;
  code: string;
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  applicable_tier_ids: string[] | null;
  created_at: string;
}

export function EventInvitesClient({
  locale,
  userId,
  events,
}: {
  locale: string;
  userId: string;
  events: EventOption[];
}) {
  const t = useTranslations("admin.eventInvites");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-6 space-y-6">
      {events.length === 0 && (
        <Card padding="md" className="rounded-lg">
          <p className="text-sm text-muted-foreground">{t("noPrograms")}</p>
        </Card>
      )}
      {events.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          locale={locale}
          userId={userId}
          isParentPending={isPending}
          startTransition={startTransition}
        />
      ))}
    </div>
  );
}

function EventCard({
  event,
  locale,
  userId,
  isParentPending,
  startTransition,
}: {
  event: EventOption;
  locale: string;
  userId: string;
  isParentPending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const t = useTranslations("admin.eventInvites");
  const [coupons, setCoupons] = useState<CouponRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listMyTeamFriendCoupons(event.id, userId);
      setCoupons(rows as CouponRow[]);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  function handleGenerate() {
    startTransition(async () => {
      const res = await issueTeamFriendCoupons(event.id, userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          res.created
            ? t("generatedToast", { count: res.created })
            : res.message ?? t("upToDateToast")
        );
        await refresh();
      }
    });
  }

  function handleRevoke(couponId: string) {
    startTransition(async () => {
      const res = await revokeTeamFriendCoupon(couponId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t("revokedToast"));
        await refresh();
      }
    });
  }

  const active = (coupons ?? []).filter((c) => c.is_active);
  const issued = (coupons ?? []).length;
  const remaining = Math.max(0, event.quota - issued);
  const startsLabel = new Date(event.startsAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card padding="md" className="rounded-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{event.title}</p>
          <p className="text-xs text-muted-foreground">{startsLabel}</p>
          {event.targetTierName && event.targetPriceEur && (
            <p
              className="mt-1 text-xs text-muted-foreground"
              // i18n string contains a single <strong> tag, safely templated.
              dangerouslySetInnerHTML={{
                __html: t("priceHint", {
                  price: event.targetPriceEur,
                  tierName: event.targetTierName,
                }),
              }}
            />
          )}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("slots")}
          </p>
          <p className="text-2xl font-semibold">
            {issued}/{event.quota}
          </p>
          {remaining > 0 && (
            <Button
              onClick={handleGenerate}
              disabled={isParentPending}
              className="mt-1"
            >
              {isParentPending
                ? t("generating")
                : t("generate", { count: remaining })}
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-xs text-muted-foreground">{t("loading")}</p>
      )}

      {!loading && coupons && coupons.length > 0 && (
        <div className="mt-4 space-y-2">
          {coupons.map((c) => {
            const usable = c.is_active && c.times_used === 0;
            const discount = (c.discount_value / 100).toFixed(2);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      toast.success(t("copied"));
                    }}
                    className="font-mono text-sm font-medium hover:text-primary"
                  >
                    {c.code}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {!c.is_active
                      ? t("codeRevoked")
                      : c.times_used > 0
                        ? t("codeUsed", { discount })
                        : t("codeUnused", { discount })}
                  </p>
                </div>
                {usable && (
                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        className="text-xs text-danger hover:opacity-80"
                      >
                        {t("revoke")}
                      </button>
                    }
                    title={t("revokeConfirmTitle")}
                    description={t("revokeConfirmDescription")}
                    variant="danger"
                    confirmLabel={t("revoke")}
                    onConfirm={() => handleRevoke(c.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && active.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("shareHint")}
        </p>
      )}
    </Card>
  );
}
