import { HeroEmbed } from "./hero-embed";
import { HeroVideoPlayer } from "./hero-video-player";

// Single composition for an admin-controlled hero banner. Layers (back to
// front):
//   1. Background — Supabase-hosted mp4 (autoplay/muted/loop), or
//      YouTube/Vimeo embed via HeroEmbed, or static cover image, or the
//      consumer-supplied fallback image.
//   2. Darkening tint — rgba(0,0,0,strength/100) so the PNG and copy below
//      always read against whatever the operator chose. Inline style
//      because Tailwind can't generate arbitrary opacity from a runtime
//      number.
//   3. Centered PNG overlay (transparency-preserved) + smaller localised
//      text.
//
// Used by both apps/tickets (event hero) and apps/site (homepage hero).
// Remains presentational — fetching the props is the consumer's job.

export interface HeroBannerProps {
  title: string;
  videoUrl?: string | null;
  imageUrl?: string | null;
  /** When videoUrl + imageUrl are both null/empty, this is rendered. */
  fallbackImageUrl?: string;
  overlayImageUrl?: string | null;
  /** Already locale-resolved by the consumer. */
  overlayText?: string | null;
  /** 0–100; clamped internally. */
  darkeningStrength: number;
  /** Override the default rounded-2xl/border container chrome. */
  className?: string;
}

function isExternalEmbed(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

const DEFAULT_CONTAINER =
  "relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm sm:aspect-21/9";

export function HeroBanner({
  title,
  videoUrl,
  imageUrl,
  fallbackImageUrl,
  overlayImageUrl,
  overlayText,
  darkeningStrength,
  className,
}: HeroBannerProps) {
  const trimmedVideo = videoUrl?.trim() || null;
  const trimmedImage = imageUrl?.trim() || null;
  const hasOverlay = !!overlayImageUrl || !!overlayText;
  const tintAlpha = Math.max(0, Math.min(100, darkeningStrength)) / 100;

  if (trimmedVideo && isExternalEmbed(trimmedVideo)) {
    return (
      <div className={className ?? DEFAULT_CONTAINER}>
        <HeroEmbed url={trimmedVideo} title={title} />
        {tintAlpha > 0 && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(0,0,0,${tintAlpha})` }}
          />
        )}
        {hasOverlay && (
          <OverlayLayer
            overlayImageUrl={overlayImageUrl}
            overlayText={overlayText}
          />
        )}
      </div>
    );
  }

  return (
    <div className={className ?? DEFAULT_CONTAINER}>
      {trimmedVideo ? (
        <HeroVideoPlayer src={trimmedVideo} title={title} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmedImage ?? fallbackImageUrl ?? ""}
          alt={title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}

      {tintAlpha > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(0,0,0,${tintAlpha})` }}
        />
      )}
      {hasOverlay && (
        <OverlayLayer
          overlayImageUrl={overlayImageUrl}
          overlayText={overlayText}
        />
      )}
    </div>
  );
}

function OverlayLayer({
  overlayImageUrl,
  overlayText,
}: {
  overlayImageUrl?: string | null;
  overlayText?: string | null;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 pointer-events-none">
      {overlayImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={overlayImageUrl}
          alt=""
          className="max-h-[60%] max-w-[80%] object-contain"
          referrerPolicy="no-referrer"
        />
      )}
      {overlayText && (
        <p className="mt-4 max-w-xl text-center text-sm font-medium leading-snug text-white drop-shadow-md sm:text-base">
          {overlayText}
        </p>
      )}
    </div>
  );
}
