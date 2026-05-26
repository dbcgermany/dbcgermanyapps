"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Input, Label } from "@dbc/ui";
import {
  createAndSendPayoutAction,
  markPayoutPaidAction,
} from "@/actions/affiliates";

type Eligible = {
  affiliate_id: string;
  affiliate: {
    display_name: string;
    contact_email: string;
    preferred_locale: "en" | "de" | "fr" | null;
  };
  total_cents: number;
  commission_count: number;
};

export function PayoutQueueClient({
  eligibles,
  locale,
}: {
  eligibles: Eligible[];
  locale: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openPayout, setOpenPayout] = useState<Eligible | null>(null);
  const [openMarkPaid, setOpenMarkPaid] = useState<{
    payoutId: string;
  } | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [reference, setReference] = useState("");

  function generate(eligible: Eligible) {
    if (!periodLabel.trim()) {
      toast.error("Period label is required");
      return;
    }
    startTransition(async () => {
      try {
        const payout = await createAndSendPayoutAction({
          affiliateId: eligible.affiliate_id,
          periodLabel: periodLabel.trim(),
        });
        toast.success("Statement generated & email sent");
        setOpenPayout(null);
        setPeriodLabel("");
        setOpenMarkPaid({ payoutId: payout.payout_id });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }
  function markPaid() {
    if (!openMarkPaid || !reference.trim()) {
      toast.error("Bank reference is required");
      return;
    }
    startTransition(async () => {
      try {
        await markPayoutPaidAction({
          payout_id: openMarkPaid.payoutId,
          payment_reference: reference.trim(),
        });
        toast.success("Payout marked paid");
        setOpenMarkPaid(null);
        setReference("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function fmt(cents: number) {
    return new Intl.NumberFormat(
      locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US",
      { style: "currency", currency: "EUR" }
    ).format(cents / 100);
  }

  return (
    <>
      <Card padding="md">
        <h2 className="text-lg font-semibold">Eligible for payout</h2>
        {eligibles.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No affiliates have eligible commissions right now. Commissions move
            from &ldquo;pending&rdquo; to &ldquo;eligible&rdquo; after the event&rsquo;s
            refund window closes.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {eligibles.map((e) => (
              <li
                key={e.affiliate_id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span>
                  <span className="font-semibold">{e.affiliate.display_name}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    {e.affiliate.contact_email} · {e.commission_count} commission(s)
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono">{fmt(e.total_cents)}</span>
                  <Button
                    onClick={() => setOpenPayout(e)}
                    disabled={pending}
                  >
                    Generate statement
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {openPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card padding="lg" className="w-full max-w-md">
            <h3 className="text-lg font-semibold">
              Generate statement for {openPayout.affiliate.display_name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmt(openPayout.total_cents)} from {openPayout.commission_count}{" "}
              commission(s). A PDF statement is generated, stored, and emailed.
              Commissions move to &ldquo;payout_queued&rdquo;.
            </p>
            <div className="mt-4">
              <Label>Period label (appears on the PDF)</Label>
              <Input
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. Richesses 2026"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpenPayout(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button onClick={() => generate(openPayout)} disabled={pending}>
                {pending ? "Generating…" : "Generate & send"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {openMarkPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card padding="lg" className="w-full max-w-md">
            <h3 className="text-lg font-semibold">Mark payout as paid</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the bank reference (Qonto transaction ID, IBAN reference,
              etc.). The affiliate sees this on their dashboard.
            </p>
            <div className="mt-4">
              <Label>Bank reference</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="QNT-2026-…"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpenMarkPaid(null)}
                disabled={pending}
              >
                Later
              </Button>
              <Button onClick={markPaid} disabled={pending}>
                {pending ? "Saving…" : "Mark paid"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
