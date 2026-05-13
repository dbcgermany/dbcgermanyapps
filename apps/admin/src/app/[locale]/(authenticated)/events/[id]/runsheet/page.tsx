import { Button, Card } from "@dbc/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { getEvent } from "@/actions/events";
import { getRunsheetItems, populateRunsheetFromTemplate } from "@/actions/runsheet";
import { getAssignableStaff } from "@/actions/staff";
import { RunsheetSortable } from "./runsheet-sortable";
import { RunsheetForm } from "./runsheet-form";

export default async function RunsheetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const [t, tBack, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "admin.events.runsheet" }),
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.common" }),
  ]);

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
    return populateRunsheetFromTemplate(eventId, eventStartsAt, locale);
  }

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        cta={
          <a
            href={`/api/runsheet/${eventId}?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("downloadPdf")}
          </a>
        }
        className="mt-2"
      />

      {items.length === 0 ? (
        <div className="mt-6 space-y-3 rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("noItems")}</p>
          <ActionForm
            action={handlePopulate}
            successToast={tCommon("savedToast")}
            errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
          >
            <Button type="submit">
              {t("populate")}
            </Button>
          </ActionForm>
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
        <h2 className="font-heading text-lg font-semibold">{t("addTitle")}</h2>
        <div className="mt-4">
          <RunsheetForm eventId={eventId} locale={locale} staff={staff} />
        </div>
      </Card>
    </div>
  );
}
