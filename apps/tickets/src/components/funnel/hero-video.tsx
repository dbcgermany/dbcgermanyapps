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

    const ytParams = (id: string) =>
      `autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&showinfo=0`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}?${ytParams(id)}`,
        };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id)
        return {
          provider: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}?${ytParams(id)}`,
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
        // Hide YouTube/Vimeo chrome (logo on hover, end-screen, "More
        // videos") by suppressing pointer events on the iframe — the
        // background-style hero is play-and-loop, no interaction needed.
        // disablekb=1 + fs=0 + controls=0 + modestbranding=1 + rel=0
        // already strip most of the UI; this is the belt that closes
        // the remaining gap (the brand logo that briefly appears on
        // hover, which our overlay would otherwise expose if a click
        // landed on the iframe).
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="pointer-events-none h-full w-full"
        />
      )}
    </div>
  );
}
