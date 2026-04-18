"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import { createSponsor, deleteSponsor } from "@/actions/sponsors";

interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: string;
  deal_value_cents: number | null;
  currency: string;
  status: string;
  logo_url: string | null;
  website_url: string | null;
  deliverables: string | null;
  notes: string | null;
}

const TIERS = [
  "title",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "partner",
  "media",
] as const;

const STATUSES = [
  "lead",
  "proposal",
  "confirmed",
  "active",
  "completed",
] as const;

const STATUS_VARIANT: Record<
  string,
  "default" | "info" | "warning" | "success" | "accent"
> = {
  lead: "default",
  proposal: "info",
  confirmed: "warning",
  active: "success",
  completed: "accent",
};

const TIER_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "info"> = {
  title: "accent",
  platinum: "accent",
  gold: "warning",
  silver: "default",
  bronze: "warning",
  partner: "info",
  media: "default",
};

export function SponsorsClient({
  eventId,
  locale,
  sponsors,
}: {
  eventId: string;
  locale: string;
  sponsors: Sponsor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  function fmtMoney(cents: number | null, currency: string) {
    if (cents == null) return "—";
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    });
  }

  function handleAdd(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await createSponsor(eventId, formData);
      if (!res.error) {
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this sponsor?")) return;
    startTransition(async () => {
      await deleteSponsor(id, eventId, locale);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Sponsors list */}
      {sponsors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No sponsors yet. Add your first one below.
        </p>
      ) : (
        <div className="space-y-3">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{s.company_name}</p>
                  <Badge variant={TIER_VARIANT[s.tier] ?? "default"}>
                    {s.tier}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[s.status] ?? "default"}>
                    {s.status}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {fmtMoney(s.deal_value_cents, s.currency)}
                  </span>
                  {s.contact_name && <span>{s.contact_name}</span>}
                  {s.contact_email && (
                    <a
                      href={`mailto:${s.contact_email}`}
                      className="text-primary hover:text-primary/80"
                    >
                      {s.contact_email}
                    </a>
                  )}
                  {s.contact_phone && <span>{s.contact_phone}</span>}
                  {s.website_url && (
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      {s.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                {s.deliverables && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Deliverables:</span>{" "}
                    {s.deliverables}
                  </p>
                )}
                {s.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button / form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add sponsor
        </button>
      ) : (
        <form
          action={handleAdd}
          className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="company_name"
              placeholder="Company name *"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="tier"
                defaultValue="partner"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue="lead"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="contact_name"
              placeholder="Contact name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="contact_email"
              type="email"
              placeholder="Contact email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="contact_phone"
              placeholder="Phone"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="deal_value_cents"
              type="number"
              step="0.01"
              placeholder="Deal value (e.g. 5000.00)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="website_url"
              type="url"
              placeholder="Website URL"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="deliverables"
            placeholder="Deliverables (logo placement, mentions, stage time, etc.)"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Internal notes"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-input px-4 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
