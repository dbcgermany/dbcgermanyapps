import Link from "next/link";
import { getTiers } from "@/actions/tiers";
import { TierForm } from "./tier-form";
import { TiersSortable } from "./tiers-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

const T = {
  en: { back: "← Back to event", title: "Ticket Tiers", addTier: "Add Tier" },
  de: { back: "← Zurück zur Veranstaltung", title: "Ticketkategorien", addTier: "Kategorie hinzufügen" },
  fr: { back: "← Retour à l’événement", title: "Catégories de billets", addTier: "Ajouter une catégorie" },
} as const;

export default async function TiersPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tiers = await getTiers(eventId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/events/${eventId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t.back}
          </Link>
          <PageHeader title={t.title} className="mt-2" />
        </div>
      </div>

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
