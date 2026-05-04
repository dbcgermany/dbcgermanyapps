import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations({
    locale,
    namespace: "tickets.gallery.page",
  });

  const titleKey = `title_${locale}` as keyof typeof event;
  const title = (event[titleKey] as string) || event.title_en;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href={`/${locale}/events/${slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t("back")}
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium text-primary">{title}</p>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {media.length === 0 ? (
        <p className="mt-12 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          {t("empty")}
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
            photo: t("photo"),
            video: t("video"),
            link: t("link"),
            open: t("open"),
          }}
        />
      )}
    </main>
  );
}
