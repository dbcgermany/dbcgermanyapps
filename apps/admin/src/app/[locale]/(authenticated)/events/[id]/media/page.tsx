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
          &larr; Back to event
        </Link>
        <PageHeader
          title={locale === "de" ? "Medien" : locale === "fr" ? "M\u00E9dias" : "Media"}
          description={locale === "de"
            ? "F\u00FCgen Sie Fotos, Videos und Links nach der Veranstaltung hinzu."
            : locale === "fr"
              ? "Ajoutez des photos, vid\u00E9os et liens apr\u00E8s l\u2019\u00E9v\u00E9nement."
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
        <h2 className="font-heading text-lg font-semibold">Add Media</h2>
        <MediaForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
