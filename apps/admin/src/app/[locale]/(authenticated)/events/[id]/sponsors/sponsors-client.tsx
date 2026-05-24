"use client";

import Link from "next/link";
import { Badge } from "@dbc/ui";
import {
  type SponsorStatus,
  type SponsorTier,
} from "@dbc/types";
import { deleteSponsor } from "@/actions/sponsors";
import { InlineEditRow } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { DeleteButton } from "@/components/delete-button";
import { pickSponsorT } from "./copy";

interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: SponsorTier;
  deal_value_cents: number | null;
  currency: string;
  status: SponsorStatus;
  logo_url: string | null;
  website_url: string | null;
  deliverables: string | null;
  notes: string | null;
}

const STATUS_VARIANT: Record<
  SponsorStatus,
  "default" | "info" | "warning" | "success" | "accent"
> = {
  lead: "default",
  proposal: "info",
  confirmed: "warning",
  active: "success",
  completed: "accent",
};

const TIER_VARIANT: Record<
  SponsorTier,
  "default" | "accent" | "success" | "warning" | "info"
> = {
  title: "accent",
  platinum: "accent",
  gold: "warning",
  silver: "default",
  bronze: "warning",
  partner: "info",
  media: "default",
};

/**
 * Read-only list of sponsors. Each row's company name is a Link to the
 * dedicated detail page (`/sponsors/[sponsorId]`) where the full
 * 11-field edit form lives. Per-row delete still inline via the shared
 * compact <DeleteButton>. Creation lives at `/sponsors/new`, reached via
 * the AddButton in the page header (added in page.tsx, not here).
 *
 * The previous inline expand-to-edit form was removed in Phase 8 — one
 * source of truth per sponsor (the detail page) avoids the two-form
 * drift risk and matches every other global resource (team/contacts/
 * news/newsletters/staff/etc.).
 */
export function SponsorsClient({
  eventId,
  locale,
  sponsors,
}: {
  eventId: string;
  locale: string;
  sponsors: Sponsor[];
}) {
  const t = pickSponsorT(locale);

  function fmtMoney(cents: number | null, currency: string) {
    if (cents == null) return "—";
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    });
  }

  return (
    <EditableList isEmpty={sponsors.length === 0} emptyMessage={t.empty}>
      {sponsors.map((s) => (
        <InlineEditRow
          key={s.id}
          title={
            <Link
              href={`/${locale}/events/${eventId}/sponsors/${s.id}`}
              className="hover:text-primary"
            >
              {s.company_name}
            </Link>
          }
          badges={
            <>
              <Badge variant={TIER_VARIANT[s.tier] ?? "default"}>
                {t.tiers[s.tier] ?? s.tier}
              </Badge>
              <Badge variant={STATUS_VARIANT[s.status] ?? "default"}>
                {t.statuses[s.status] ?? s.status}
              </Badge>
            </>
          }
          meta={<SponsorMeta sponsor={s} deliverablesLabel={t.deliverables} value={fmtMoney(s.deal_value_cents, s.currency)} />}
          deleteAction={
            <DeleteButton
              action={async () => deleteSponsor(s.id, eventId, locale)}
              confirmTitle={t.deleteConfirm}
              confirmDescription={s.company_name}
              confirmLabel={t.delete}
              cancelLabel={t.cancel}
              label={t.delete}
              successToast={t.deleteToast}
              compact
            />
          }
        />
      ))}
    </EditableList>
  );
}

/* -------------------------------------------------------------------------- */

function SponsorMeta({
  sponsor,
  deliverablesLabel,
  value,
}: {
  sponsor: Sponsor;
  deliverablesLabel: string;
  value: string;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="font-medium text-foreground">{value}</span>
        {sponsor.contact_name && <span>{sponsor.contact_name}</span>}
        {sponsor.contact_email && (
          <a
            href={`mailto:${sponsor.contact_email}`}
            className="text-primary hover:text-primary/80"
          >
            {sponsor.contact_email}
          </a>
        )}
        {sponsor.contact_phone && <span>{sponsor.contact_phone}</span>}
        {sponsor.website_url && (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            {sponsor.website_url.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
      {sponsor.deliverables && (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{deliverablesLabel}:</span>{" "}
          {sponsor.deliverables}
        </p>
      )}
      {sponsor.notes && (
        <p className="mt-1 text-xs text-muted-foreground">{sponsor.notes}</p>
      )}
    </>
  );
}
