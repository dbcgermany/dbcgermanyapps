import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug, getEventMedia } from "@/lib/queries";
import { MediaGallery } from "./media-gallery";

export const revalidate = 300;

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const media = await getEventMedia(event.id);

  const titleKey = `title_${locale}` as keyof typeof event;
  const title = (event[titleKey] as string) || event.title_en;

  const t = {
    en: {
      back: "Back to event",
      title: "Gallery",
      subtitle: "Photos, videos and highlights from the event",
      empty: "No media has been shared yet. Check back soon.",
      photo: "Photo",
      video: "Video",
      link: "Link",
      open: "Open",
    },
    de: {
      back: "Zur\u00fcck zur Veranstaltung",
      title: "Galerie",
      subtitle: "Fotos, Videos und H\u00f6hepunkte der Veranstaltung",
      empty: "Es wurden noch keine Medien geteilt.",
      photo: "Foto",
      video: "Video",
      link: "Link",
      open: "\u00d6ffnen",
    },
    fr: {
      back: "Retour \u00e0 l\u2019\u00e9v\u00e9nement",
      title: "Galerie",
      subtitle: "Photos, vid\u00e9os et moments forts de l\u2019\u00e9v\u00e9nement",
      empty: "Aucun m\u00e9dia n\u2019a encore \u00e9t\u00e9 partag\u00e9.",
      photo: "Photo",
      video: "Vid\u00e9o",
      link: "Lien",
      open: "Ouvrir",
    },
  }[locale] ?? {
    back: "Back", title: "Gallery", subtitle: "",
    empty: "No media yet.", photo: "Photo", video: "Video",
    link: "Link", open: "Open",
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href={`/${locale}/events/${slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t.back}
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium text-primary">{title}</p>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </div>

      {media.length === 0 ? (
        <p className="mt-12 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <MediaGallery
          locale={locale}
          media={media.map((m) => ({
            id: m.id,
            type: m.type as "photo" | "video" | "link",
            url: m.url,
            title: m.title,
          }))}
          labels={{
            photo: t.photo,
            video: t.video,
            link: t.link,
            open: t.open,
          }}
        />
      )}
    </main>
  );
}
