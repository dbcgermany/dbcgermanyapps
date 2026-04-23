import Image from "next/image";
import Link from "next/link";
import { Card, Eyebrow, Heading, Reveal } from "@dbc/ui";

// Shared card atom for every surface that lists team members — today
// /team (full grid) and /about (preview strip). Kept in one file so
// tweaks to the visual (avatar size, typography, hover state) propagate
// everywhere instead of drifting per page.

const AVATAR_GRADIENT =
  "bg-gradient-to-br from-primary/25 via-primary/10 to-accent/25 text-primary ring-1 ring-primary/20";

export type TeamMemberCardData = {
  slug: string;
  name: string;
  role: string;
  photoUrl: string | null;
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

export function TeamMemberCard({
  member,
  locale,
  revealDelay = 0,
}: {
  member: TeamMemberCardData;
  locale: string;
  revealDelay?: number;
}) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const viewLabel =
    l === "de" ? "Profil ansehen" : l === "fr" ? "Voir le profil" : "View profile";

  return (
    <Reveal delay={revealDelay} className="h-full">
      <Link
        href={`/${locale}/team/${member.slug}`}
        className="block h-full transition-transform hover:-translate-y-1"
      >
        <Card className="flex h-full flex-col items-start transition-colors hover:border-primary/40">
          {member.photoUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                sizes="80px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full font-heading text-2xl font-bold ${AVATAR_GRADIENT}`}
              aria-hidden
            >
              {initialsOf(member.name)}
            </div>
          )}
          <Heading level={4} className="mt-5">
            {member.name}
          </Heading>
          {member.role && <Eyebrow className="mt-1">{member.role}</Eyebrow>}
          <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
            {viewLabel}
            <span aria-hidden>→</span>
          </span>
        </Card>
      </Link>
    </Reveal>
  );
}
