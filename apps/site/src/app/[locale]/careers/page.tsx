import type { Metadata } from "next";
import { createServerClient } from "@dbc/supabase/server";
import {
  Card,
  Container,
  Eyebrow,
  Heading,
  LinkButton,
  Section,
} from "@dbc/ui";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de"
        ? "Karriere"
        : locale === "fr"
          ? "Carri\u00e8res"
          : "Careers",
  };
}

type JobOffer = {
  id: string;
  title_en: string;
  title_de: string;
  title_fr: string;
  description_en: string;
  description_de: string;
  description_fr: string;
  location: string | null;
  employment_type: string | null;
  department: string | null;
};

const TYPE_LABELS: Record<string, Record<string, string>> = {
  full_time: { en: "Full-time", de: "Vollzeit", fr: "Temps plein" },
  part_time: { en: "Part-time", de: "Teilzeit", fr: "Temps partiel" },
  freelance: { en: "Freelance", de: "Freiberuflich", fr: "Freelance" },
  internship: { en: "Internship", de: "Praktikum", fr: "Stage" },
};

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const supabase = await createServerClient();
  const { data: jobs } = await supabase
    .from("job_offers")
    .select(
      "id, title_en, title_de, title_fr, description_en, description_de, description_fr, location, employment_type, department"
    )
    .eq("is_published", true)
    .order("sort_order");

  const offers: JobOffer[] = jobs ?? [];

  const copy = {
    eyebrow: { en: "Careers", de: "Karriere", fr: "Carri\u00e8res" }[l],
    title: {
      en: "Work at DBC Germany.",
      de: "Arbeite bei DBC Germany.",
      fr: "Rejoindre DBC Germany.",
    }[l],
    intro: {
      en: "We\u2019re a lean team in D\u00fcsseldorf. Hands-on operators welcome. Strong preference for candidates with African roots or Francophone fluency.",
      de: "Wir sind ein schlankes Team in D\u00fcsseldorf. Praktische Macher:innen willkommen \u2014 bevorzugt mit afrikanischen Wurzeln oder franz\u00f6sischen Sprachkenntnissen.",
      fr: "\u00c9quipe resserr\u00e9e \u00e0 D\u00fcsseldorf. Profils op\u00e9rationnels bienvenus \u2014 une pr\u00e9f\u00e9rence pour les candidat\u00b7e\u00b7s aux racines africaines ou francophones.",
    }[l],
    apply: { en: "Apply", de: "Bewerben", fr: "Postuler" }[l],
    speculativeTitle: {
      en: "Don\u2019t see your role?",
      de: "Keine passende Rolle dabei?",
      fr: "Vous ne trouvez pas votre poste\u00a0?",
    }[l],
    speculativeBody: {
      en: "We always want to meet excellent operators. Send a short note on what you\u2019d build with us.",
      de: "Wir lernen gerne exzellente Operator:innen kennen. Schreib uns kurz, was du mit uns aufbauen willst.",
      fr: "Nous rencontrons volontiers d\u2019excellents op\u00e9rationnels. \u00c9crivez-nous ce que vous construiriez avec nous.",
    }[l],
    contact: { en: "Contact", de: "Kontakt", fr: "Contact" }[l],
    noOpenings: {
      en: "No open positions right now. Check back soon!",
      de: "Aktuell keine offenen Stellen. Schau bald wieder vorbei!",
      fr: "Aucun poste ouvert pour le moment. Revenez bient\u00f4t\u00a0!",
    }[l],
  };

  const titleKey = `title_${l}` as keyof JobOffer;
  const descKey = `description_${l}` as keyof JobOffer;

  return (
    <Section>
      <Container max="4xl">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-3">
          {copy.title}
        </Heading>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {copy.intro}
        </p>

        <div className="mt-14 space-y-4">
          {offers.length === 0 && (
            <p className="text-sm text-muted-foreground">{copy.noOpenings}</p>
          )}

          {offers.map((job) => {
            const typeLabel =
              job.employment_type && TYPE_LABELS[job.employment_type]
                ? TYPE_LABELS[job.employment_type][l]
                : job.employment_type;
            const description = (job[descKey] as string) || "";

            return (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Heading level={4}>{job[titleKey] as string}</Heading>
                    <Eyebrow className="mt-1 text-muted-foreground">
                      {job.location ?? ""}{job.location && typeLabel ? " \u00b7 " : ""}{typeLabel ?? ""}
                    </Eyebrow>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {description.length > 200
                        ? description.slice(0, 200) + "\u2026"
                        : description}
                    </p>
                  </div>
                  <LinkButton
                    size="sm"
                    href={`/${locale}/careers/${job.id}`}
                    className="shrink-0"
                  >
                    {copy.apply}
                  </LinkButton>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-14 border-dashed bg-muted/30">
          <Heading level={4}>{copy.speculativeTitle}</Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.speculativeBody}
          </p>
          <LinkButton size="sm" href={`/${locale}/contact`} className="mt-4">
            {copy.contact}
          </LinkButton>
        </Card>
      </Container>
    </Section>
  );
}
