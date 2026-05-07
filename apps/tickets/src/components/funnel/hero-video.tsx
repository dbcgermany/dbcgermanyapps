// Hero-mounted video player for events with a hero_video_url. Resolves
// YouTube/Vimeo URLs to nocookie-friendly embeds; falls back to native
// <video> for direct file URLs. Aspect ratio mirrors the cover-image hero
// (aspect-video on small, aspect-21/9 on >=sm) so layout is identical.
//
// All variants autoplay muted + loop continuously — the hero is a
// background, never a player the visitor is meant to interact with.
// YouTube `loop=1` requires `playlist=<id>` set to the same id, otherwise
// the video stops after one play. Vimeo uses `background=1` which is the
// purpose-built clean-autoplay-loop mode.

function resolveEmbedUrl(
  url: string,
): { provider: "youtube" | "vimeo" | "native"; src: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0&modestbranding=1`,
        };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0&modestbranding=1`,
        };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id)
        return {
          provider: "vimeo",
          src: `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&background=1`,
        };
    }
  } catch {
    /* fall through to native */
  }
  return { provider: "native", src: url };
}

export function HeroVideo({ url, title }: { url: string; title: string }) {
  const { provider, src } = resolveEmbedUrl(url);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm sm:aspect-21/9">
      {provider === "native" ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={title}
        />
      ) : (
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      )}
    </div>
  );
}
