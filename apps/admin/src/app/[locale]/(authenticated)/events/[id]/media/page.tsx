import { getTranslations } from "next-intl/server";
import { getEventMedia } from "@/actions/media";
import { MediaForm } from "./media-form";
import { MediaSortable } from "./media-sortable";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const media = await getEventMedia(eventId);
  const [tBack, t] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.events" }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("mediaPageTitle")}
        description={t("mediaDescription")}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

      {/* Existing media */}
      {media.length > 0 && (
        <div className="mt-6">
          <MediaSortable items={media} eventId={eventId} locale={locale} />
        </div>
      )}

      {/* Add form */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t("addMedia")}</h2>
        <MediaForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
