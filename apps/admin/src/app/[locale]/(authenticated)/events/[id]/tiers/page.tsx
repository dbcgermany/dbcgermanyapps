import { getTranslations } from "next-intl/server";
import { getTiers } from "@/actions/tiers";
import { TierForm } from "./tier-form";
import { TiersSortable } from "./tiers-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

const T = {
  en: { title: "Ticket Tiers", addTier: "Add Tier" },
  de: { title: "Ticketkategorien", addTier: "Kategorie hinzufügen" },
  fr: { title: "Catégories de billets", addTier: "Ajouter une catégorie" },
} as const;

export default async function TiersPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const tiers = await getTiers(eventId);

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

      {/* Existing tiers */}
      {tiers.length > 0 && (
        <div className="mt-6">
          <TiersSortable tiers={tiers} eventId={eventId} locale={locale} />
        </div>
      )}

      {/* Add new tier form */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t.addTier}</h2>
        <TierForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
