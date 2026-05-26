"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Label, Select, Badge } from "@dbc/ui";
import {
  createAffiliateAction,
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
  affiliates: {
    id: string;
    display_name: string;
    contact_email: string;
    status: string;
  } | null;
  coupons: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
};

export function EventAffiliatesClient({
  eventId,
  eventSlug: _eventSlug,
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

  function handleRotate(id: string) {
    if (
      !confirm(
        "Rotate this dashboard token? The current URL stops working immediately and a new welcome email goes out."
      )
    )
      return;
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
    if (
      !confirm(
        "Revoke dashboard access? The URL stops working immediately. Affiliate can be re-enrolled later."
      )
    )
      return;
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
        await updateEventAffiliateAction(id, eventId, {
          commission_pct: value,
        });
        toast.success("Commission updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function handleStatusChange(
    id: string,
    status: "active" | "paused" | "ended"
  ) {
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

  const totals = useMemo(
    () => ({
      active: eventAffiliates.filter((e) => e.status === "active").length,
      total: eventAffiliates.length,
    }),
    [eventAffiliates]
  );

  return (
    <>
      {/* CTA row sits below the PageHeader; mirrors team-invites layout. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totals.total > 0
            ? `${totals.active} active · ${totals.total} enrolled`
            : "No affiliates enrolled yet for this event."}
          {eventEndsAt
            ? ` · Tokens auto-close ${new Date(
                new Date(eventEndsAt).getTime() + 20 * 86400000
              ).toLocaleDateString(locale)}`
            : ""}
        </p>
        <Button onClick={() => setShowEnroll(true)} disabled={pending}>
          Enroll affiliate
        </Button>
      </div>

      {eventAffiliates.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No affiliates enrolled yet. Click <strong>Enroll affiliate</strong>{" "}
            above to add an external partner — they&rsquo;ll get a welcome
            email with their referral link and private dashboard URL.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {eventAffiliates.map((ea) => {
            const aff = ea.affiliates;
            const cp = ea.coupons;
            const tokenStatus = ea.token_revoked_at
              ? "revoked"
              : new Date(ea.token_expires_at) <= new Date()
                ? "expired"
                : "active";
            return (
              <div
                key={ea.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                      {aff?.contact_email}
                      {cp?.code ? (
                        <>
                          {" · code "}
                          <span className="font-mono">{cp.code}</span>
                        </>
                      ) : (
                        " · no discount code"
                      )}
                      {" · expires "}
                      {new Date(ea.token_expires_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Label
                        htmlFor={`pct-${ea.id}`}
                        className="text-xs text-muted-foreground"
                      >
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
                          if (
                            !Number.isNaN(v) &&
                            v !== Number(ea.commission_pct)
                          ) {
                            handlePctChange(ea.id, v);
                          }
                        }}
                        className="w-20"
                      />
                    </div>
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
                      Rotate
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
              </div>
            );
          })}
        </div>
      )}

      {showEnroll && (
        <EnrollDialog
          eventId={eventId}
          eligibleAffiliates={eligibleAffiliates}
          onClose={() => setShowEnroll(false)}
          onDone={() => {
            setShowEnroll(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function EnrollDialog({
  eventId,
  eligibleAffiliates,
  onClose,
  onDone,
}: {
  eventId: string;
  eligibleAffiliates: AffiliateLite[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const startInCreateMode = eligibleAffiliates.length === 0;
  const [mode, setMode] = useState<"existing" | "new">(
    startInCreateMode ? "new" : "existing"
  );
  const [affiliateId, setAffiliateId] = useState(
    eligibleAffiliates[0]?.id ?? ""
  );
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLocale, setNewLocale] = useState<"en" | "de" | "fr">("en");

  const [commissionPct, setCommissionPct] = useState(10);
  const [offerDiscount, setOfferDiscount] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState(10);

  function submit() {
    startTransition(async () => {
      try {
        let resolvedId = affiliateId;
        if (mode === "new") {
          if (!newName.trim() || !newEmail.trim()) {
            toast.error("Name and email are required");
            return;
          }
          const created = await createAffiliateAction({
            display_name: newName.trim(),
            contact_email: newEmail.trim(),
            preferred_locale: newLocale,
          });
          resolvedId = created.id;
        }
        if (!resolvedId) {
          toast.error("Pick an affiliate or create a new one");
          return;
        }
        if (offerDiscount && !couponCode.trim()) {
          toast.error("Enter a coupon code or turn off the discount option");
          return;
        }
        await enrollAffiliateAction({
          affiliateId: resolvedId,
          eventId,
          commissionPct,
          coupon: offerDiscount
            ? {
                code: couponCode.trim().toUpperCase(),
                discountType,
                discountValue,
              }
            : null,
        });
        toast.success("Enrolled and welcome email sent");
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={() => !pending && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-lg font-bold">Enroll affiliate</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One click creates the coupon, generates the dashboard token, and emails
          the affiliate.
        </p>

        <div className="mt-5 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`pb-2 text-sm font-medium ${
              mode === "new"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground"
            }`}
          >
            New affiliate
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={eligibleAffiliates.length === 0}
            className={`pb-2 text-sm font-medium ${
              mode === "existing"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground"
            } disabled:opacity-40`}
          >
            Existing ({eligibleAffiliates.length})
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {mode === "new" ? (
            <>
              <div>
                <Label>Display name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Esther Tshipama"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact email</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="esther@example.com"
                  />
                </div>
                <div>
                  <Label>Preferred locale</Label>
                  <Select
                    value={newLocale}
                    onChange={(e) =>
                      setNewLocale(e.target.value as "en" | "de" | "fr")
                    }
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </Select>
                </div>
              </div>
            </>
          ) : (
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
          )}

          <div className="mt-2">
            <Label>Commission %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionPct}
              onChange={(e) => setCommissionPct(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paid on the order total when a sale is attributed to this
              affiliate via their referral URL.
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={offerDiscount}
                onChange={(e) => setOfferDiscount(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Also offer a discount</span> to
                buyers who use this affiliate&rsquo;s link.{" "}
                <span className="text-muted-foreground">
                  Optional — the affiliate earns commission either way.
                </span>
              </span>
            </label>
          </div>

          {offerDiscount && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div>
                <Label>Coupon code</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ESTHER10"
                />
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
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Enrolling…" : "Enroll & send welcome email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
