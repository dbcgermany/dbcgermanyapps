"use client";

import { useEffect, useState } from "react";

interface MediaItem {
  id: string;
  type: "photo" | "video" | "link";
  url: string;
  title: string | null;
}

export function MediaGallery({
  locale,
  media,
  labels,
}: {
  locale: string;
  media: MediaItem[];
  labels: { photo: string; video: string; link: string; open: string };
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = media.filter((m) => m.type === "photo");
  const videos = media.filter((m) => m.type === "video");
  const links = media.filter((m) => m.type === "link");

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : Math.min(i + 1, photos.length - 1)));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, photos.length]);

  return (
    <div className="mt-10 space-y-12">
      {photos.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {labels.photo}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.title ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {labels.video}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                {video.title && (
                  <p className="border-b border-border bg-muted/30 px-4 py-2 text-sm font-medium">
                    {video.title}
                  </p>
                )}
                <div className="aspect-video bg-black">
                  <VideoEmbed url={video.url} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {labels.link}
          </h2>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium">
                    {link.title || new URL(link.url).hostname}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label={locale === "de" ? "Schlie\u00DFen" : locale === "fr" ? "Fermer" : "Close"}
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].title ?? ""}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              &larr;
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Next"
            >
              &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function resolveEmbedUrl(
  url: string
): { provider: "youtube" | "vimeo" | "native"; src: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}`,
        };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}`,
        };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id)
        return {
          provider: "vimeo",
          src: `https://player.vimeo.com/video/${id}`,
        };
    }
  } catch {
    // Fall through to native.
  }
  return { provider: "native", src: url };
}

function VideoEmbed({ url }: { url: string }) {
  const { provider, src } = resolveEmbedUrl(url);

  if (provider === "youtube") {
    return (
      <iframe
        src={src}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }
  if (provider === "vimeo") {
    return (
      <iframe
        src={src}
        title="Vimeo video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }
  return <video controls src={src} className="h-full w-full" preload="metadata" />;
}
