import Link from "next/link";
import { getEventMedia } from "@/actions/media";
import { MediaForm } from "./media-form";
import { MediaRow } from "./media-row";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const media = await getEventMedia(eventId);

  return (
    <div className="p-8">
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          {locale === "de" ? "Medien" : locale === "fr" ? "M\u00E9dias" : "Media"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "de"
            ? "F\u00FCgen Sie Fotos, Videos und Links nach der Veranstaltung hinzu."
            : locale === "fr"
              ? "Ajoutez des photos, vid\u00E9os et liens apr\u00E8s l\u2019\u00E9v\u00E9nement."
              : "Add post-event photos, videos, and links."}
        </p>
      </div>

      {/* Existing media */}
      {media.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {media.map((item) => (
            <MediaRow
              key={item.id}
              item={item}
              eventId={eventId}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">Add Media</h2>
        <MediaForm eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
