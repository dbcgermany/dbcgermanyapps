"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Button, Input, Label, Select, Textarea } from "@dbc/ui";
import type { Affiliate } from "@dbc/affiliate";
import { updateAffiliateAction } from "@/actions/affiliates";

type EnrollmentRow = {
  id: string;
  event_id: string;
  commission_pct: number;
  status: string;
  dashboard_token: string;
  token_expires_at: string;
  token_revoked_at: string | null;
  event: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    slug: string;
  } | null;
  coupon_code: string | null;
  referralUrl: string;
  dashboardUrl: string;
  referralsCount: number;
  earnedCents: number;
  pendingCents: number;
};

type PayoutRow = {
  id: string;
  status: string;
  amount_cents: number;
  currency: string;
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
};

export function AffiliateDetailClient({
  affiliate,
  enrollments,
  payouts,
  locale,
}: {
  affiliate: Affiliate;
  enrollments: EnrollmentRow[];
  payouts: PayoutRow[];
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState(affiliate.first_name ?? "");
  const [lastName, setLastName] = useState(affiliate.last_name ?? "");
  const [email, setEmail] = useState(affiliate.contact_email);
  const [country, setCountry] = useState(affiliate.country ?? "");
  const [pLocale, setPLocale] = useState<"en" | "de" | "fr">(
    (affiliate.preferred_locale as "en" | "de" | "fr") ?? "en"
  );
  const [status, setStatus] = useState(affiliate.status);
  const [notes, setNotes] = useState(affiliate.notes ?? "");

  function save() {
    startTransition(async () => {
      try {
        await updateAffiliateAction(affiliate.id, {
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          contact_email: email.trim(),
          country: country.trim() || null,
          preferred_locale: pLocale,
          status: status as "invited" | "active" | "paused" | "terminated",
          notes: notes.trim() || null,
        });
        toast.success("Saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function formatMoney(cents: number, currency: string) {
    return new Intl.NumberFormat(
      locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
      { style: "currency", currency }
    ).format(cents / 100);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold">Profile</h2>
          {affiliate.contact_id && (
            <Link
              href={`/${locale}/contacts/${affiliate.contact_id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View contact →
            </Link>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>First name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label>Last name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <Label>Contact email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Locale</Label>
            <Select
              value={pLocale}
              onChange={(e) => setPLocale(e.target.value as "en" | "de" | "fr")}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </Select>
          </div>
          <div>
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="invited">Invited</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label>Notes (offline payment refs, etc.)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold">Event enrollments</h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not enrolled in any events. Open an event and use its &ldquo;Affiliate
            marketing&rdquo; card to enroll this affiliate.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {enrollments.map((ea) => {
              const tokenLive =
                !ea.token_revoked_at &&
                new Date(ea.token_expires_at) > new Date();
              return (
                <div
                  key={ea.id}
                  className="rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {ea.event ? (
                        <Link
                          href={`/${locale}/events/${ea.event.id}/affiliates`}
                          className="font-semibold hover:underline"
                        >
                          {ea.event.title}
                        </Link>
                      ) : (
                        <span className="font-semibold">—</span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {ea.commission_pct}% commission ·{" "}
                        {ea.coupon_code ? (
                          <>
                            code{" "}
                            <span className="font-mono">{ea.coupon_code}</span>
                          </>
                        ) : (
                          "no discount code"
                        )}{" "}
                        · expires{" "}
                        {new Date(ea.token_expires_at).toLocaleDateString(
                          locale
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ea.status === "active" ? "success" : "default"}
                      >
                        {ea.status}
                      </Badge>
                      <Badge variant={tokenLive ? "default" : "warning"}>
                        token: {tokenLive ? "live" : "ended"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{ea.referralsCount} referrals</span>
                    <span>· paid {formatMoney(ea.earnedCents, "EUR")}</span>
                    <span>
                      · in pipeline {formatMoney(ea.pendingCents, "EUR")}
                    </span>
                  </div>
                  <UrlRow
                    label="Sharing link"
                    url={ea.referralUrl}
                  />
                  <UrlRow
                    label="Private dashboard"
                    url={ea.dashboardUrl}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="font-heading text-lg font-bold">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString(locale)}
                  {p.payment_reference ? ` · ref ${p.payment_reference}` : ""}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono">
                    {formatMoney(p.amount_cents, p.currency)}
                  </span>
                  <Badge
                    variant={
                      p.status === "paid"
                        ? "success"
                        : p.status === "cancelled"
                        ? "error"
                        : "warning"
                    }
                  >
                    {p.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UrlRow({ label, url }: { label: string; url: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  }
  if (!url) return null;
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 break-all rounded border border-border bg-muted/20 px-2 py-1 text-xs">
          {url}
        </code>
        <Button variant="ghost" onClick={copy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
