"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
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
        <FormField label={t.companyName} required>
          <Input
            name="company_name"
            defaultValue={sponsor?.company_name ?? ""}
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label={t.tier}>
            <Select name="tier" defaultValue={sponsor?.tier ?? "partner"}>
              {SPONSOR_TIER_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t.tiers[v] ?? v}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t.status}>
            <Select name="status" defaultValue={sponsor?.status ?? "lead"}>
              {SPONSOR_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t.statuses[v] ?? v}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.contactFirstName}>
          <Input
            name="contact_first_name"
            defaultValue={sponsor?.contact_first_name ?? ""}
          />
        </FormField>
        <FormField label={t.contactLastName}>
          <Input
            name="contact_last_name"
            defaultValue={sponsor?.contact_last_name ?? ""}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.contactEmail}>
          <Input
            name="contact_email"
            type="email"
            defaultValue={sponsor?.contact_email ?? ""}
          />
        </FormField>
        <FormField label={t.phone}>
          <Input
            name="contact_phone"
            defaultValue={sponsor?.contact_phone ?? ""}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.dealValue}>
          <Input
            name="deal_value_cents"
            type="number"
            step="0.01"
            defaultValue={
              sponsor?.deal_value_cents != null
                ? (sponsor.deal_value_cents / 100).toFixed(2)
                : ""
            }
          />
        </FormField>
        <FormField label={t.websiteUrl}>
          <Input
            name="website_url"
            type="url"
            defaultValue={sponsor?.website_url ?? ""}
          />
        </FormField>
      </div>

      <FormField label={t.deliverables}>
        <Textarea
          name="deliverables"
          placeholder={t.deliverablesPh}
          defaultValue={sponsor?.deliverables ?? ""}
          rows={3}
        />
      </FormField>
      <FormField label={t.notesLabel}>
        <Textarea
          name="notes"
          placeholder={t.notesPh}
          defaultValue={sponsor?.notes ?? ""}
          rows={3}
        />
      </FormField>

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
