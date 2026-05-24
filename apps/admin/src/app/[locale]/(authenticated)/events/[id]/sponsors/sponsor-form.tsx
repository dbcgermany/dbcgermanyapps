"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@dbc/ui";
import {
  SPONSOR_STATUS_VALUES,
  SPONSOR_TIER_VALUES,
  type SponsorStatus,
  type SponsorTier,
} from "@dbc/types";
import { createSponsor, updateSponsor } from "@/actions/sponsors";
import type { SponsorT } from "./copy";

export interface SponsorRow {
  id: string;
  company_name: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: SponsorTier;
  deal_value_cents: number | null;
  currency: string;
  status: SponsorStatus;
  website_url: string | null;
  deliverables: string | null;
  notes: string | null;
}

/**
 * Shared sponsor form used by both:
 *  - `/events/[id]/sponsors/new` (create)
 *  - `/events/[id]/sponsors/[sponsorId]` (edit)
 *
 * On success the operator is redirected back to `successPath` (the
 * sponsors list) so the round-trip is the same regardless of whether
 * they were creating or editing.
 *
 * The local Field / SelectField / TextareaField helpers stay inline for
 * now; they'll be swapped for @dbc/ui FormField in Phase 5 across every
 * admin form in one sweep.
 */
export function SponsorForm({
  mode,
  sponsor,
  eventId,
  locale,
  successPath,
  t,
}: {
  mode: "create" | "edit";
  sponsor?: SponsorRow;
  eventId: string;
  locale: string;
  successPath: string;
  t: SponsorT;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("locale", locale);
    formData.set("event_id", eventId);
    startTransition(async () => {
      const res =
        mode === "edit" && sponsor
          ? await updateSponsor(sponsor.id, formData)
          : await createSponsor(eventId, formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? t.save : t.add);
      router.push(successPath);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.companyName}
          name="company_name"
          defaultValue={sponsor?.company_name ?? ""}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label={t.tier}
            name="tier"
            defaultValue={sponsor?.tier ?? "partner"}
            options={SPONSOR_TIER_VALUES.map((v) => ({
              value: v,
              label: t.tiers[v] ?? v,
            }))}
          />
          <SelectField
            label={t.status}
            name="status"
            defaultValue={sponsor?.status ?? "lead"}
            options={SPONSOR_STATUS_VALUES.map((v) => ({
              value: v,
              label: t.statuses[v] ?? v,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.contactFirstName}
          name="contact_first_name"
          defaultValue={sponsor?.contact_first_name ?? ""}
        />
        <Field
          label={t.contactLastName}
          name="contact_last_name"
          defaultValue={sponsor?.contact_last_name ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.contactEmail}
          name="contact_email"
          type="email"
          defaultValue={sponsor?.contact_email ?? ""}
        />
        <Field
          label={t.phone}
          name="contact_phone"
          defaultValue={sponsor?.contact_phone ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.dealValue}
          name="deal_value_cents"
          type="number"
          step="0.01"
          defaultValue={
            sponsor?.deal_value_cents != null
              ? (sponsor.deal_value_cents / 100).toFixed(2)
              : ""
          }
        />
        <Field
          label={t.websiteUrl}
          name="website_url"
          type="url"
          defaultValue={sponsor?.website_url ?? ""}
        />
      </div>

      <TextareaField
        label={t.deliverables}
        name="deliverables"
        placeholder={t.deliverablesPh}
        defaultValue={sponsor?.deliverables ?? ""}
      />
      <TextareaField
        label={t.notesLabel}
        name="notes"
        placeholder={t.notesPh}
        defaultValue={sponsor?.notes ?? ""}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "edit"
              ? t.saving
              : t.adding
            : mode === "edit"
              ? t.save
              : t.add}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(successPath)}
        >
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

/* tiny field helpers — Phase 5 will swap these for FormField across every admin form */

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: ReactNode;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: ReactNode;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: ReactNode;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
