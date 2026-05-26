"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Badge,
} from "@dbc/ui";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import {
  enrollAffiliateAction,
  rotateAffiliateTokenAction,
  revokeAffiliateTokenAction,
  extendAffiliateTokenAction,
  updateEventAffiliateAction,
} from "@/actions/affiliates";

type AffiliateLite = {
  id: string;
  display_name: string;
  contact_email: string;
  status: string;
};

type EventAffiliateRow = {
  id: string;
  affiliate_id: string;
  commission_pct: number;
  coupon_id: string;
  status: string;
  dashboard_token: string;
  token_expires_at: string;
  token_revoked_at: string | null;
  affiliates: { id: string; display_name: string; contact_email: string; status: string } | null;
  coupons: { id: string; code: string; discount_type: string; discount_value: number } | null;
};

export function EventAffiliatesClient({
  eventId,
  eventSlug,
  eventEndsAt,
  affiliates,
  eventAffiliates,
  locale,
}: {
  eventId: string;
  eventSlug: string;
  eventEndsAt: string | null;
  affiliates: AffiliateLite[];
  eventAffiliates: EventAffiliateRow[];
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showEnroll, setShowEnroll] = useState(false);

  const enrolledIds = useMemo(
    () => new Set(eventAffiliates.map((ea) => ea.affiliate_id)),
    [eventAffiliates]
  );
  const eligibleAffiliates = useMemo(
    () =>
      affiliates.filter(
        (a) => !enrolledIds.has(a.id) && a.status !== "terminated"
      ),
    [affiliates, enrolledIds]
  );

  const totals = useMemo(() => {
    return {
      active: eventAffiliates.filter((e) => e.status === "active").length,
      total: eventAffiliates.length,
    };
  }, [eventAffiliates]);

  function handleRotate(id: string) {
    if (!confirm("Rotate this dashboard token? The current URL stops working immediately and a new welcome email goes out.")) return;
    startTransition(async () => {
      try {
        await rotateAffiliateTokenAction(id, eventId);
        toast.success("Token rotated and new email sent");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function handleRevoke(id: string) {
    if (!confirm("Revoke dashboard access? The URL stops working immediately. Affiliate can be re-enrolled later.")) return;
    startTransition(async () => {
      try {
        await revokeAffiliateTokenAction(id, eventId);
        toast.success("Dashboard access revoked");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function handleExtend(id: string) {
    startTransition(async () => {
      try {
        await extendAffiliateTokenAction(id, eventId, 20);
        toast.success("Token expiry extended by 20 days");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function handlePctChange(id: string, value: number) {
    startTransition(async () => {
      try {
        await updateEventAffiliateAction(id, eventId, { commission_pct: value });
        toast.success("Commission updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function handleStatusChange(id: string, status: "active" | "paused" | "ended") {
    startTransition(async () => {
      try {
        await updateEventAffiliateAction(id, eventId, { status });
        toast.success("Status updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard label="Active affiliates" value={String(totals.active)} />
        <StatCard label="Total enrolled" value={String(totals.total)} />
        <StatCard
          label="Event ends"
          value={
            eventEndsAt
              ? new Date(eventEndsAt).toLocaleDateString(locale)
              : "—"
          }
        />
        <StatCard
          label="Token policy"
          value="Auto-close 20 days after event"
          dense
        />
      </StatGrid>

      <div className="flex justify-end">
        <Button
          onClick={() => setShowEnroll(true)}
          disabled={eligibleAffiliates.length === 0}
        >
          Enroll affiliate
        </Button>
      </div>

      {eventAffiliates.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-muted-foreground">
            No affiliates enrolled for this event yet. Click &ldquo;Enroll
            affiliate&rdquo; to add one.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventAffiliates.map((ea) => {
            const aff = ea.affiliates;
            const cp = ea.coupons;
            const tokenStatus = ea.token_revoked_at
              ? "revoked"
              : new Date(ea.token_expires_at) <= new Date()
              ? "expired"
              : "active";
            return (
              <Card key={ea.id} padding="md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${locale}/affiliates/${ea.affiliate_id}`}
                        className="text-base font-semibold hover:underline"
                      >
                        {aff?.display_name ?? "—"}
                      </Link>
                      <Badge
                        variant={
                          ea.status === "active"
                            ? "success"
                            : ea.status === "paused"
                            ? "warning"
                            : "default"
                        }
                      >
                        {ea.status}
                      </Badge>
                      <Badge
                        variant={
                          tokenStatus === "active"
                            ? "default"
                            : tokenStatus === "expired"
                            ? "warning"
                            : "error"
                        }
                      >
                        token: {tokenStatus}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aff?.contact_email} · code{" "}
                      <span className="font-mono">{cp?.code ?? "—"}</span> ·
                      expires{" "}
                      {new Date(ea.token_expires_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`pct-${ea.id}`} className="text-sm">
                      %
                    </Label>
                    <Input
                      id={`pct-${ea.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={Number(ea.commission_pct)}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v !== Number(ea.commission_pct)) {
                          handlePctChange(ea.id, v);
                        }
                      }}
                      className="w-20"
                    />
                    <Select
                      value={ea.status}
                      onChange={(e) =>
                        handleStatusChange(
                          ea.id,
                          e.target.value as "active" | "paused" | "ended"
                        )
                      }
                      className="w-32"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="ended">Ended</option>
                    </Select>
                    <Button
                      variant="ghost"
                      onClick={() => handleExtend(ea.id)}
                      disabled={pending}
                    >
                      +20 days
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleRotate(ea.id)}
                      disabled={pending}
                    >
                      Rotate token
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRevoke(ea.id)}
                      disabled={pending || tokenStatus === "revoked"}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showEnroll && (
        <EnrollDialog
          eventId={eventId}
          eventSlug={eventSlug}
          eligibleAffiliates={eligibleAffiliates}
          onClose={() => setShowEnroll(false)}
          onDone={() => {
            setShowEnroll(false);
            router.refresh();
          }}
        />
      )}

    </div>
  );
}

function EnrollDialog({
  eventId,
  eventSlug: _eventSlug,
  eligibleAffiliates,
  onClose,
  onDone,
}: {
  eventId: string;
  eventSlug: string;
  eligibleAffiliates: AffiliateLite[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [affiliateId, setAffiliateId] = useState(eligibleAffiliates[0]?.id ?? "");
  const [commissionPct, setCommissionPct] = useState(10);
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(10);

  function submit() {
    if (!affiliateId || !couponCode.trim()) {
      toast.error("Affiliate and coupon code are required");
      return;
    }
    startTransition(async () => {
      try {
        await enrollAffiliateAction({
          affiliateId,
          eventId,
          commissionPct,
          couponCode: couponCode.trim().toUpperCase(),
          discountType,
          discountValue,
        });
        toast.success("Affiliate enrolled and welcome email sent");
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card padding="lg" className="w-full max-w-xl">
        <h2 className="text-lg font-semibold">Enroll affiliate for this event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A coupon code, a dashboard token, and a welcome email — all created in one click.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Affiliate</Label>
            <Select
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
            >
              {eligibleAffiliates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.display_name} · {a.contact_email}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Commission %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPct}
                onChange={(e) => setCommissionPct(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Referral coupon code</Label>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. ESTHER10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Discount type</Label>
              <Select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(
                    e.target.value as "percentage" | "fixed_amount"
                  )
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed (cents)</option>
              </Select>
            </div>
            <div>
              <Label>Discount value</Label>
              <Input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Enrolling…" : "Enroll & send welcome email"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Re-export so the page file can render without importing Fragment.
export { Fragment };
