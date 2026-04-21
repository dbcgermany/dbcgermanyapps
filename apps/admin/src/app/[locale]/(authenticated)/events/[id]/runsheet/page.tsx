import { Button, Card } from "@dbc/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { getEvent } from "@/actions/events";
import { getRunsheetItems, populateRunsheetFromTemplate } from "@/actions/runsheet";
import { getAssignableStaff } from "@/actions/staff";
import { RunsheetSortable } from "./runsheet-sortable";
import { RunsheetForm } from "./runsheet-form";

const T = {
  en: {
    back: "Event",
    title: "Run Sheet",
    description:
      "Minute-by-minute event-day plan. Drag to reorder, click any row to edit.",
    addTitle: "Add item",
    noItems: "No run sheet items yet. Add your first one below or populate from the template.",
    populate: "Populate from template",
    downloadPdf: "Download PDF",
  },
  de: {
    back: "Event",
    title: "Ablaufplan",
    description:
      "Minutengenauer Plan f\u00FCr den Veranstaltungstag. Ziehen zum Umsortieren, klicken zum Bearbeiten.",
    addTitle: "Eintrag hinzuf\u00FCgen",
    noItems:
      "Noch keine Eintr\u00E4ge. F\u00FCgen Sie unten den ersten hinzu oder laden Sie das Template.",
    populate: "Aus Vorlage laden",
    downloadPdf: "PDF herunterladen",
  },
  fr: {
    back: "\u00C9v\u00E9nement",
    title: "Feuille de route",
    description:
      "Plan minute par minute. Glissez pour r\u00E9ordonner, cliquez pour \u00E9diter.",
    addTitle: "Ajouter un \u00E9l\u00E9ment",
    noItems:
      "Aucun \u00E9l\u00E9ment. Ajoutez-en un ci-dessous ou chargez depuis le mod\u00E8le.",
    populate: "Charger depuis le mod\u00E8le",
    downloadPdf: "T\u00E9l\u00E9charger le PDF",
  },
} as const;

export default async function RunsheetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = T[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const eventOrNull = await getEvent(eventId).catch(() => null);
  if (!eventOrNull) notFound();
  const event = eventOrNull;
  const eventStartsAt = event.starts_at;

  const [items, staffList] = await Promise.all([
    getRunsheetItems(eventId),
    getAssignableStaff(),
  ]);

  const staff = staffList.map((s) => ({
    id: s.id,
    name: s.display_name || s.role || s.id.slice(0, 8),
  }));

  async function handlePopulate() {
    "use server";
    await populateRunsheetFromTemplate(eventId, eventStartsAt, locale);
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        cta={
          <a
            href={`/api/runsheet/${eventId}?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t.downloadPdf}
          </a>
        }
        className="mt-2"
      />

      {items.length === 0 ? (
        <div className="mt-6 space-y-3 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t.noItems}</p>
          <form action={handlePopulate}>
            <Button type="submit">
              {t.populate}
            </Button>
          </form>
        </div>
      ) : (
        <div className="mt-6">
          <RunsheetSortable
            items={items}
            eventId={eventId}
            locale={locale}
            staff={staff}
          />
        </div>
      )}

      {/* Add item form */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t.addTitle}</h2>
        <div className="mt-4">
          <RunsheetForm eventId={eventId} locale={locale} staff={staff} />
        </div>
      </Card>
    </div>
  );
}
