import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, Container, Eyebrow, Heading, Section } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "de" ? "Team" : locale === "fr" ? "Équipe" : "Team",
  };
}

type PublicMember = {
  id: string;
  slug: string;
  name: string;
  role_en: string;
  role_de: string | null;
  role_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

async function getPublicTeam(): Promise<PublicMember[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("team_members")
    .select(
      "id, slug, name, role_en, role_de, role_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, sort_order"
    )
    .eq("visibility", "public")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data as PublicMember[]) ?? [];
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function accentFor(i: number) {
  if (i % 3 === 0)
    return "bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 text-primary";
  if (i % 3 === 1)
    return "bg-gradient-to-br from-accent/30 via-accent/15 to-primary/20 text-accent";
  return "bg-gradient-to-br from-muted via-muted/60 to-background text-foreground";
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const members = await getPublicTeam();

  const copy = {
    eyebrow: {
      en: "The people behind DBC Germany",
      de: "Das Team hinter DBC Germany",
      fr: "L'équipe DBC Germany",
    }[l],
    title: {
      en: "A DACH team, tightly linked to DBC International.",
      de: "Ein DACH-Team, eng verbunden mit DBC International.",
      fr: "Une équipe DACH, étroitement liée à DBC International.",
    }[l],
    intro: {
      en: "We're a small team in Düsseldorf connecting DBC's programmes, investments, and events to founders in Germany, Austria, and Switzerland.",
      de: "Wir sind ein kleines Team in Düsseldorf, das die Programme, Investitionen und Veranstaltungen von DBC an Gründer:innen in Deutschland, Österreich und der Schweiz bringt.",
      fr: "Nous sommes une petite équipe à Düsseldorf, qui relie les programmes, investissements et événements DBC aux entrepreneurs d'Allemagne, d'Autriche et de Suisse.",
    }[l],
    empty: {
      en: "Team profiles are being prepared.",
      de: "Team-Profile werden vorbereitet.",
      fr: "Les profils de l'équipe sont en préparation.",
    }[l],
  };

  function localeField(
    m: PublicMember,
    field: "role" | "bio"
  ): string {
    const key = `${field}_${l}` as keyof PublicMember;
    const v = m[key] as string | null;
    if (v) return v;
    const en = m[`${field}_en` as keyof PublicMember] as string | null;
    return en ?? "";
  }

  return (
    <Section>
      <Container max="5xl">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-3">
          {copy.title}
        </Heading>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>

        {members.length === 0 ? (
          <Card className="mt-14 border-dashed text-center">
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          </Card>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => {
              const role = localeField(m, "role");
              const bio = localeField(m, "bio");
              const teaser =
                bio && bio.length > 180 ? bio.slice(0, 180).trim() + "…" : bio;
              return (
                <Link
                  key={m.id}
                  href={`/${locale}/team/${m.slug}`}
                  className="block transition-transform hover:-translate-y-1"
                >
                  <Card className="flex h-full flex-col items-start transition-colors hover:border-primary/40">
                    {m.photo_url ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-full">
                        <Image
                          src={m.photo_url}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full font-heading text-2xl font-bold ${accentFor(i)}`}
                        aria-hidden
                      >
                        {initialsOf(m.name)}
                      </div>
                    )}
                    <Heading level={4} className="mt-5">
                      {m.name}
                    </Heading>
                    {role && <Eyebrow className="mt-1">{role}</Eyebrow>}
                    {teaser && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {teaser}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {l === "de"
                        ? "Profil ansehen"
                        : l === "fr"
                          ? "Voir le profil"
                          : "View profile"}
                      <span aria-hidden>→</span>
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
