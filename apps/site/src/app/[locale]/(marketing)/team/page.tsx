import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, Container, Eyebrow, Heading, Reveal, Section } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";
import { seoFromI18n } from "@/lib/seo";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { OurStoryTeaser } from "@/components/about/our-story-teaser";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/team", pageKey: "team" });
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
  const tIntro = await getTranslations({ locale, namespace: "site.intros" });

  const copy = {
    eyebrow: {
      en: "The people behind DBC Germany",
      de: "Das Team hinter DBC Germany",
      fr: "L'équipe DBC Germany",
    }[l],
    title: {
      en: "DBC Germany Team.",
      de: "Das DBC Germany Team.",
      fr: "L'équipe DBC Germany.",
    }[l],
    intro: {
      en: "Senior operators in Düsseldorf. We run incubation, investments, courses, mentorship and the Richesses d'Afrique Germany conference for founders building between Europe and Africa.",
      de: "Senior-Operator:innen in Düsseldorf. Wir betreiben Inkubation, Investitionen, Kurse, Mentoring und die Richesses d'Afrique Germany Konferenz für Gründer:innen, die zwischen Europa und Afrika bauen.",
      fr: "Opérateur·ice·s senior à Düsseldorf. Nous opérons l'incubation, les investissements, les formations, le mentorat et la conférence Richesses d'Afrique Germany pour les fondateur·ice·s qui construisent entre l'Europe et l'Afrique.",
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

  const listSchema =
    members.length > 0
      ? itemListJsonLd(
          members.map((m) => ({
            name: m.name,
            url: `https://dbc-germany.com/${locale}/team/${m.slug}`,
          }))
        )
      : null;

  return (
    <Section>
      {listSchema && <JsonLd data={listSchema} />}
      <Container max="5xl">
        <Reveal>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Heading level={1} className="mt-3">
            {copy.title}
          </Heading>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {copy.intro}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
            {tIntro("team")}
          </p>
        </Reveal>

        <OurStoryTeaser locale={locale} />

        {members.length === 0 ? (
          <Card className="mt-14 border-dashed text-center">
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          </Card>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <TeamMemberCard
                key={m.id}
                member={{
                  slug: m.slug,
                  name: m.name,
                  role: localeField(m, "role"),
                  photoUrl: m.photo_url,
                }}
                locale={locale}
                revealDelay={Math.min(i, 5) * 50}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
