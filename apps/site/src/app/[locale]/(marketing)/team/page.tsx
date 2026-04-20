import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, Container, Eyebrow, Heading, Reveal, Section } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";
import { seoFromI18n } from "@/lib/seo";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";

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

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENT =
  "bg-gradient-to-br from-primary/25 via-primary/10 to-accent/25 text-primary ring-1 ring-primary/20";

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

        {members.length === 0 ? (
          <Card className="mt-14 border-dashed text-center">
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          </Card>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => {
              const role = localeField(m, "role");
              return (
                <Reveal key={m.id} delay={Math.min(i, 5) * 50} className="h-full">
                <Link
                  href={`/${locale}/team/${m.slug}`}
                  className="block h-full transition-transform hover:-translate-y-1"
                >
                  <Card className="flex h-full flex-col items-start transition-colors hover:border-primary/40">
                    {m.photo_url ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-full">
                        <Image
                          src={m.photo_url}
                          alt={m.name}
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
                        {initialsOf(m.name)}
                      </div>
                    )}
                    <Heading level={4} className="mt-5">
                      {m.name}
                    </Heading>
                    {role && <Eyebrow className="mt-1">{role}</Eyebrow>}
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
                      {l === "de"
                        ? "Profil ansehen"
                        : l === "fr"
                          ? "Voir le profil"
                          : "View profile"}
                      <span aria-hidden>→</span>
                    </span>
                  </Card>
                </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
