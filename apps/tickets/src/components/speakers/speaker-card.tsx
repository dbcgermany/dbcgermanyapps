import Image from "next/image";
import Link from "next/link";
import { Card, Eyebrow, Heading, Reveal } from "@dbc/ui";

const AVATAR_GRADIENT =
  "bg-gradient-to-br from-primary/25 via-primary/10 to-accent/25 text-primary ring-1 ring-primary/20";

export type SpeakerCardData = {
  slug: string;
  fullName: string;
  title: string | null;
  company: string | null;
  photoUrl: string | null;
  roleLabel?: string | null;
  isFeatured?: boolean;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SpeakerCard({
  speaker,
  hrefBase,
  viewLabel,
  revealDelay = 0,
}: {
  speaker: SpeakerCardData;
  hrefBase: string;
  viewLabel: string;
  revealDelay?: number;
}) {
  const subtitle =
    speaker.title && speaker.company
      ? `${speaker.title} · ${speaker.company}`
      : speaker.title || speaker.company || "";

  return (
    <Reveal delay={revealDelay} className="h-full">
      <Link
        href={`${hrefBase}/${speaker.slug}`}
        className="block h-full transition-transform hover:-translate-y-1"
      >
        <Card className="flex h-full flex-col items-start transition-colors hover:border-primary/40">
          {speaker.roleLabel && (
            <span className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {speaker.roleLabel}
            </span>
          )}
          {speaker.photoUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full">
              <Image
                src={speaker.photoUrl}
                alt={speaker.fullName}
                fill
                sizes="96px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full font-heading text-2xl font-bold ${AVATAR_GRADIENT}`}
              aria-hidden
            >
              {initialsOf(speaker.fullName)}
            </div>
          )}
          <Heading level={4} className="mt-5">
            {speaker.fullName}
          </Heading>
          {subtitle && <Eyebrow className="mt-1">{subtitle}</Eyebrow>}
          <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
            {viewLabel}
            <span aria-hidden>→</span>
          </span>
        </Card>
      </Link>
    </Reveal>
  );
}
