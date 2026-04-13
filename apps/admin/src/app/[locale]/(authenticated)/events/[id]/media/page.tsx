import Link from "next/link";
import { getEventMedia, deleteEventMedia } from "@/actions/media";
import { MediaForm } from "./media-form";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const media = await getEventMedia(eventId);

  const typeIcons: Record<string, string> = {
    photo: "\u{1F4F7}",
    video: "\u{1F3AC}",
    link: "\u{1F517}",
  };

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
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border p-4"
            >
              <span className="text-xl">{typeIcons[item.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {item.title || item.type}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-primary"
                >
                  {item.url}
                </a>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteEventMedia(item.id, eventId, locale);
                }}
              >
                <button
                  type="submit"
                  className="shrink-0 text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
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
