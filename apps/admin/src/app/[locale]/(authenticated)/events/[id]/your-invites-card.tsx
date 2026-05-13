"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Card, ConfirmDialog } from "@dbc/ui";
import {
  getEffectiveTeamInviteConfig,
  issueTeamFriendCoupons,
  listMyTeamFriendCoupons,
  revokeTeamFriendCoupon,
  type EffectiveTeamInviteConfig,
  type TeamFriendCouponRow,
} from "@/actions/team-friend-invites";

/**
 * Per-event card that surfaces the logged-in team member's own team-friend
 * invite codes. Server actions strictly filter on issued_to_profile_id =
 * currentUser, so admins can't see other staff's codes through this card.
 * The admin matrix at /events/[id]/team-invites is the place to see
 * everyone's codes.
 */
export function YourInvitesCard({ eventId }: { eventId: string }) {
  const t = useTranslations("admin.yourInvites");
  const [cfg, setCfg] = useState<EffectiveTeamInviteConfig | null>(null);
  const [coupons, setCoupons] = useState<TeamFriendCouponRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    setLoading(true);
    try {
      const [config, rows] = await Promise.all([
        getEffectiveTeamInviteConfig(eventId),
        listMyTeamFriendCoupons(eventId),
      ]);
      setCfg(config);
      setCoupons(rows);
    } catch {
      setCfg(null);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  function handleGenerate() {
    startTransition(async () => {
      const res = await issueTeamFriendCoupons(eventId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      const created = (res as { created?: number }).created ?? 0;
      const message = (res as { message?: string }).message;
      toast.success(
        created > 0
          ? t("generatedToast", { count: created })
          : message ?? t("upToDateToast")
      );
      await refresh();
    });
  }

  function handleRevoke(couponId: string) {
    startTransition(async () => {
      const res = await revokeTeamFriendCoupon(couponId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("revokedToast"));
      await refresh();
    });
  }

  if (loading || !coupons) {
    return (
      <Card padding="md" className="rounded-lg">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </Card>
    );
  }

  // Suppress the card entirely when the program isn't configured for this
  // user (no quota AND nothing already issued — admin hasn't set it up).
  if (!cfg || (cfg.quota === 0 && coupons.length === 0)) return null;

  const discountLabel = formatDiscount(cfg);
  const issued = coupons.length;
  const remaining = Math.max(0, cfg.quota - issued);

  return (
    <Card padding="md" className="rounded-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{t("title")}</p>
          {discountLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("discountHint", { discount: discountLabel })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("slots")}
          </p>
          <p className="text-2xl font-semibold">
            {issued}/{cfg.quota}
          </p>
          {remaining > 0 && (
            <Button
              onClick={handleGenerate}
              disabled={pending || cfg.discountValue <= 0}
              className="mt-1"
            >
              {pending
                ? t("generating")
                : t("generate", { count: remaining })}
            </Button>
          )}
        </div>
      </div>

      {coupons.length > 0 && (
        <div className="mt-4 space-y-2">
          {coupons.map((c) => {
            const usable = c.is_active && c.times_used === 0;
            const redeemerLabel =
              c.redeemed_by_name || c.redeemed_by_email
                ? [c.redeemed_by_name, c.redeemed_by_email]
                    .filter(Boolean)
                    .join(" · ")
                : null;
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
                        ? redeemerLabel
                          ? t("codeUsedBy", { who: redeemerLabel })
                          : t("codeUsed")
                        : t("codeUnused")}
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

      {coupons.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {t("shareHint")}
        </p>
      )}

      {cfg.discountValue <= 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("notConfiguredYet")}
        </p>
      )}
    </Card>
  );
}

function formatDiscount(cfg: EffectiveTeamInviteConfig | null): string | null {
  if (!cfg || cfg.discountValue <= 0) return null;
  if (cfg.discountType === "percent") return `${cfg.discountValue}%`;
  return `€${(cfg.discountValue / 100).toFixed(2)}`;
}
