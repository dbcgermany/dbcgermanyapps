import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, Container, Eyebrow, Heading, Section } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";

export const revalidate = 60;

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
};

async function getMember(slug: string): Promise<PublicMember | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("team_members")
    .select(
      "id, slug, name, role_en, role_de, role_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url"
    )
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();
  return (data as PublicMember | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMember(slug);
  if (!m) return {};
  return { title: `${m.name} — ${m.role_en}` };
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

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const found = await getMember(slug);
  if (!found) notFound();
  const m: PublicMember = found;

  function field(f: "role" | "bio") {
    const localized = m[`${f}_${l}` as keyof PublicMember] as string | null;
    if (localized) return localized;
    return (m[`${f}_en` as keyof PublicMember] as string | null) ?? "";
  }

  const role = field("role");
  const bio = field("bio");

  const back = {
    en: "All team",
    de: "Gesamtes Team",
    fr: "Toute l'équipe",
  }[l];

  return (
    <Section>
      <Container max="4xl">
        <Link
          href={`/${locale}/team`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {back}
        </Link>

        <div className="mt-6 grid items-start gap-10 md:grid-cols-[1fr_2fr]">
          <Card className="flex flex-col items-center text-center">
            {m.photo_url ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-full">
                <Image
                  src={m.photo_url}
                  alt={m.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div
                aria-hidden
                className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 font-heading text-4xl font-bold text-primary"
              >
                {initialsOf(m.name)}
              </div>
            )}
            <Heading level={3} className="mt-6">
              {m.name}
            </Heading>
            {role && (
              <Eyebrow className="mt-2 text-center">{role}</Eyebrow>
            )}
            <div className="mt-6 flex flex-col items-center gap-2 text-sm font-semibold">
              {m.email && (
                <a
                  href={`mailto:${m.email}`}
                  className="text-primary hover:text-primary/80"
                >
                  {m.email}
                </a>
              )}
              {m.linkedin_url && (
                <a
                  href={m.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>

            {m.slug !== "ruth-bambi" && (
              <p className="mt-6 w-full border-t border-border pt-4 text-center text-xs text-muted-foreground">
                {l === "de"
                  ? "Berichtet an"
                  : l === "fr"
                    ? "Rend compte à"
                    : "Reports to"}
                :{" "}
                <Link
                  href={`/${locale}/team/ruth-bambi`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  Ruth Bambi
                </Link>
              </p>
            )}
          </Card>

          <div>
            <Eyebrow>
              {l === "de"
                ? "Über"
                : l === "fr"
                  ? "À propos"
                  : "About"}{" "}
              {m.name}
            </Eyebrow>
            <Heading level={1} className="mt-3">
              {m.name}
            </Heading>
            {bio ? (
              <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-foreground">
                {bio}
              </div>
            ) : (
              <p className="mt-6 text-muted-foreground">
                {l === "de"
                  ? "Profil wird vorbereitet."
                  : l === "fr"
                    ? "Profil en préparation."
                    : "Profile coming soon."}
              </p>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
