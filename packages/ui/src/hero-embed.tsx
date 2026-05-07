// Hero-mounted embed for external video URLs (YouTube / Vimeo). Resolves
// the URL to a nocookie-friendly autoplay-loop-mute embed and masks the
// third-party UI: pointer-events:none on the iframe so hover never wakes
// up the brand chrome, plus URL params (controls=0, modestbranding=1,
// rel=0, etc.) that strip everything else. The hero is a background,
// never something the visitor is meant to interact with — for a clean
// 100%-DBC look without paid Vimeo Plus, prefer self-hosted via
// HeroVideoPlayer instead.

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

export function HeroEmbed({ url, title }: { url: string; title: string }) {
  const { provider, src } = resolveEmbedUrl(url);

  if (provider === "native") {
    return (
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
    );
  }

  return (
    <iframe
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="pointer-events-none h-full w-full"
    />
  );
}
