"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Label, Select, Badge } from "@dbc/ui";
import type { EventAffiliateListRow } from "@dbc/affiliate/server";
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

/**
 * Compute the default token expiry, mirroring the server-side default in
 * `enrollAffiliateInEvent`. Kept in the client so the dialog can preview
 * the date the admin would otherwise get if they leave the field alone.
 */
function defaultExpiry(eventEndsAt: string | null): string {
  const baseMs = eventEndsAt
    ? new Date(eventEndsAt).getTime() + 20 * 86400000
    : Date.now() + 180 * 86400000;
  return new Date(baseMs).toISOString().slice(0, 10); // yyyy-mm-dd
}

function fmtMoney(cents: number, locale: string) {
  return new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency: "EUR" }
  ).format(cents / 100);
}

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
  eventAffiliates: EventAffiliateListRow[];
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
  function handleExtend(id: string, days: number) {
    if (!Number.isFinite(days) || days <= 0) {
      toast.error("Enter a positive number of days");
      return;
    }
    startTransition(async () => {
      try {
        await extendAffiliateTokenAction(id, eventId, days);
        toast.success(`Token expiry extended by ${days} days`);
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totals.total > 0
            ? `${totals.active} active · ${totals.total} enrolled`
            : "No affiliates enrolled yet for this event."}
          {eventEndsAt
            ? ` · Default token closes ${new Date(
                new Date(eventEndsAt).getTime() + 20 * 86400000
              ).toLocaleDateString(locale)} (event end + 20 days)`
            : " · No event end set — default token lasts 180 days from enrollment"}
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
          {eventAffiliates.map((ea) => (
            <EnrollmentRow
              key={ea.id}
              ea={ea}
              locale={locale}
              pending={pending}
              onPctChange={handlePctChange}
              onStatusChange={handleStatusChange}
              onRotate={handleRotate}
              onRevoke={handleRevoke}
              onExtend={handleExtend}
            />
          ))}
        </div>
      )}

      {showEnroll && (
        <EnrollDialog
          eventId={eventId}
          eventEndsAt={eventEndsAt}
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

function EnrollmentRow({
  ea,
  locale,
  pending,
  onPctChange,
  onStatusChange,
  onRotate,
  onRevoke,
  onExtend,
}: {
  ea: EventAffiliateListRow;
  locale: string;
  pending: boolean;
  onPctChange: (id: string, v: number) => void;
  onStatusChange: (id: string, s: "active" | "paused" | "ended") => void;
  onRotate: (id: string) => void;
  onRevoke: (id: string) => void;
  onExtend: (id: string, days: number) => void;
}) {
  const [extendDays, setExtendDays] = useState(20);
  const tokenStatus = ea.token_revoked_at
    ? "revoked"
    : new Date(ea.token_expires_at) <= new Date()
      ? "expired"
      : "active";

  async function copy(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${locale}/affiliates/${ea.affiliate_id}`}
              className="text-base font-semibold hover:underline"
            >
              {ea.affiliate.display_name}
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
            {ea.affiliate.contact_email}
            {ea.coupon?.code ? (
              <>
                {" · code "}
                <span className="font-mono">{ea.coupon.code}</span>
              </>
            ) : (
              " · no discount code"
            )}
            {" · expires "}
            {new Date(ea.token_expires_at).toLocaleDateString(locale)}
          </p>

          {/* Per-row performance */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {ea.referralsCount} referral
              {ea.referralsCount === 1 ? "" : "s"}
            </span>
            <span className="text-muted-foreground">
              · paid out{" "}
              <span className="font-mono">
                {fmtMoney(ea.earnedCents, locale)}
              </span>
            </span>
            <span className="text-muted-foreground">
              · in pipeline{" "}
              <span className="font-mono">
                {fmtMoney(ea.pendingCents, locale)}
              </span>
            </span>
          </div>

          {/* URLs to copy / share */}
          <div className="mt-3 space-y-2">
            <UrlBlock
              label="Sharing link (public)"
              url={ea.referralUrl}
              onCopy={() => copy(ea.referralUrl, "Sharing link")}
            />
            <UrlBlock
              label="Dashboard (private — affiliate only)"
              url={ea.dashboardUrl}
              onCopy={() => copy(ea.dashboardUrl, "Dashboard link")}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
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
                if (!Number.isNaN(v) && v !== Number(ea.commission_pct)) {
                  onPctChange(ea.id, v);
                }
              }}
              className="w-20"
            />
            <Select
              value={ea.status}
              onChange={(e) =>
                onStatusChange(
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
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Extend</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs text-muted-foreground">days</span>
            <Button
              variant="ghost"
              onClick={() => onExtend(ea.id, extendDays)}
              disabled={pending}
            >
              Apply
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onRotate(ea.id)}
              disabled={pending}
            >
              Rotate
            </Button>
            <Button
              variant="destructive"
              onClick={() => onRevoke(ea.id)}
              disabled={pending || tokenStatus === "revoked"}
            >
              Revoke
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UrlBlock({
  label,
  url,
  onCopy,
}: {
  label: string;
  url: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 break-all rounded border border-border bg-muted/20 px-2 py-1 text-xs">
          {url}
        </code>
        <Button variant="ghost" onClick={onCopy}>
          Copy
        </Button>
      </div>
    </div>
  );
}

function EnrollDialog({
  eventId,
  eventEndsAt,
  eligibleAffiliates,
  onClose,
  onDone,
}: {
  eventId: string;
  eventEndsAt: string | null;
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
  const [expiryDate, setExpiryDate] = useState(defaultExpiry(eventEndsAt));
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
          // Send end-of-day in the local TZ so a date picker date doesn't
          // expire at midnight UTC mid-business-day.
          tokenExpiresAt: new Date(`${expiryDate}T23:59:59`).toISOString(),
        });
        toast.success("Enrolled and welcome email sent");
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  const expiryHint = eventEndsAt
    ? `Default: 20 days after the event end (${new Date(eventEndsAt).toLocaleDateString()}). Editable.`
    : "Event has no end date set — defaulting to 180 days from now. Editable.";

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
          Creates the dashboard token + coupon (if any), and emails the
          affiliate the two links.
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

          <div>
            <Label>Dashboard token expires</Label>
            <Input
              type="date"
              value={expiryDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">{expiryHint}</p>
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
                <span className="font-medium">Also offer a discount</span>{" "}
                to buyers who use this affiliate&rsquo;s link.{" "}
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
