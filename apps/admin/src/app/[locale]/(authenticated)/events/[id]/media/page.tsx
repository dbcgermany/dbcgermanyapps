import Link from "next/link";
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

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {locale === "de" ? "← Zurück zur Veranstaltung" : locale === "fr" ? "← Retour à l’événement" : "← Back to event"}
        </Link>
        <PageHeader
          title={locale === "de" ? "Medien" : locale === "fr" ? "Médias" : "Media"}
          description={locale === "de"
            ? "Fügen Sie Fotos, Videos und Links nach der Veranstaltung hinzu."
            : locale === "fr"
              ? "Ajoutez des photos, vidéos et liens après l’événement."
              : "Add post-event photos, videos, and links."}
          className="mt-2"
        />
      </div>

      {/* Existing media */}
      {media.length > 0 && (
        <div className="mt-6">
          <MediaSortable items={media} eventId={eventId} locale={locale} />
        </div>
      )}

      {/* Add form */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">
          {locale === "de" ? "Medien hinzufügen" : locale === "fr" ? "Ajouter un média" : "Add Media"}
        </h2>
        <MediaForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
