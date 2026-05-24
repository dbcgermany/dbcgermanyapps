import { notFound } from "next/navigation";
import { Badge } from "@dbc/ui";
import { getSponsor, deleteSponsor } from "@/actions/sponsors";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { SponsorForm, type SponsorRow } from "../sponsor-form";
import { pickSponsorT } from "../copy";

const TIER_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "info"> = {
  title: "accent",
  platinum: "accent",
  gold: "warning",
  silver: "default",
  bronze: "warning",
  partner: "info",
  media: "default",
};

const STATUS_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "accent"> = {
  lead: "default",
  proposal: "info",
  confirmed: "warning",
  active: "success",
  completed: "accent",
};

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; sponsorId: string }>;
}) {
  const { locale, id: eventId, sponsorId } = await params;
  const t = pickSponsorT(locale);
  const sponsor = await getSponsor(sponsorId);
  if (!sponsor) notFound();

  const sponsorRow: SponsorRow = {
    id: sponsor.id,
    company_name: sponsor.company_name,
    contact_first_name: sponsor.contact_first_name,
    contact_last_name: sponsor.contact_last_name,
    contact_email: sponsor.contact_email,
    contact_phone: sponsor.contact_phone,
    tier: sponsor.tier,
    deal_value_cents: sponsor.deal_value_cents,
    currency: sponsor.currency,
    status: sponsor.status,
    website_url: sponsor.website_url,
    deliverables: sponsor.deliverables,
    notes: sponsor.notes,
  };

  const sponsorsListPath = `/${locale}/events/${eventId}/sponsors`;

  return (
    <div>
      <PageHeader
        back={{ href: sponsorsListPath, label: t.backToSponsors }}
        title={sponsor.company_name}
        description={t.editSponsorTitle}
        cta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={TIER_VARIANT[sponsor.tier] ?? "default"}>
              {t.tiers[sponsor.tier] ?? sponsor.tier}
            </Badge>
            <Badge variant={STATUS_VARIANT[sponsor.status] ?? "default"}>
              {t.statuses[sponsor.status] ?? sponsor.status}
            </Badge>
            <DeleteButton
              action={async () => {
                "use server";
                return deleteSponsor(sponsor.id, eventId, locale);
              }}
              confirmTitle={t.deleteConfirm}
              confirmDescription={sponsor.company_name}
              confirmLabel={t.delete}
              cancelLabel={t.cancel}
              label={t.delete}
              successToast={t.deleteToast}
            />
          </div>
        }
      />

      <div className="mt-8 max-w-3xl">
        <SponsorForm
          mode="edit"
          sponsor={sponsorRow}
          eventId={eventId}
          locale={locale}
          successPath={sponsorsListPath}
          t={t}
        />
      </div>
    </div>
  );
}
