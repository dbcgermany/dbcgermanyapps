"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@dbc/ui";
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
  events: {
    id: string;
    title_en: string;
    title_de: string | null;
    title_fr: string | null;
    starts_at: string;
    ends_at: string | null;
    slug: string;
  } | null;
  coupons: { code: string } | null;
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
  const [displayName, setDisplayName] = useState(affiliate.display_name);
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
          display_name: displayName.trim(),
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
      <Card padding="md">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold">Event enrollments</h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Not enrolled in any events. Open an event and use its &ldquo;Affiliate
            marketing&rdquo; card to enroll this affiliate.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {enrollments.map((ea) => {
              const ev = ea.events;
              const evTitle = ev
                ? (locale === "de" && ev.title_de) ||
                  (locale === "fr" && ev.title_fr) ||
                  ev.title_en
                : "—";
              const tokenLive =
                !ea.token_revoked_at &&
                new Date(ea.token_expires_at) > new Date();
              return (
                <li key={ea.id} className="flex items-center justify-between py-3">
                  <div>
                    {ev ? (
                      <Link
                        href={`/${locale}/events/${ev.id}/affiliates`}
                        className="font-semibold hover:underline"
                      >
                        {evTitle}
                      </Link>
                    ) : (
                      <span>{evTitle}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      code <span className="font-mono">{ea.coupons?.code}</span>
                      {" · "}
                      {Number(ea.commission_pct)}% commission · expires{" "}
                      {new Date(ea.token_expires_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ea.status === "active" ? "success" : "default"}>
                      {ea.status}
                    </Badge>
                    <Badge variant={tokenLive ? "default" : "warning"}>
                      token: {tokenLive ? "live" : "ended"}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold">Payout history</h2>
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
      </Card>
    </div>
  );
}
