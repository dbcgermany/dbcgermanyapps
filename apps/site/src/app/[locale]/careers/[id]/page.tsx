import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import {
  Card,
  Container,
  Eyebrow,
  Heading,
  Reveal,
  Section,
} from "@dbc/ui";
import { JobApplicationForm } from "./form";

export const revalidate = 60;

type JobOffer = {
  id: string;
  title_en: string;
  title_de: string;
  title_fr: string;
  description_en: string;
  description_de: string;
  description_fr: string;
  requirements_en: string | null;
  requirements_de: string | null;
  requirements_fr: string | null;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createServerClient();
  const { data: job } = await supabase
    .from("job_offers")
    .select("title_en, title_de, title_fr")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!job) return { title: "Not Found" };

  const titleKey = `title_${locale === "de" || locale === "fr" ? locale : "en"}` as keyof typeof job;
  return { title: job[titleKey] as string };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const supabase = await createServerClient();
  const { data: job } = await supabase
    .from("job_offers")
    .select(
      "id, title_en, title_de, title_fr, description_en, description_de, description_fr, requirements_en, requirements_de, requirements_fr, location, employment_type, department"
    )
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!job) notFound();

  const titleKey = `title_${l}` as keyof JobOffer;
  const descKey = `description_${l}` as keyof JobOffer;
  const reqKey = `requirements_${l}` as keyof JobOffer;

  const title = job[titleKey] as string;
  const description = (job[descKey] as string) || "";
  const requirements = (job[reqKey] as string | null) || "";
  const typeLabel =
    job.employment_type && TYPE_LABELS[job.employment_type]
      ? TYPE_LABELS[job.employment_type][l]
      : job.employment_type;

  const copy = {
    backLabel: { en: "All positions", de: "Alle Stellen", fr: "Tous les postes" }[l],
    descriptionLabel: { en: "Description", de: "Beschreibung", fr: "Description" }[l],
    requirementsLabel: { en: "Requirements", de: "Anforderungen", fr: "Pr\u00e9requis" }[l],
    applyLabel: { en: "Apply for this position", de: "Auf diese Stelle bewerben", fr: "Postuler pour ce poste" }[l],
  };

  return (
    <Section>
      <Container max="3xl">
        <a
          href={`/${locale}/careers`}
          className="text-sm text-primary hover:text-primary/80"
        >
          &larr; {copy.backLabel}
        </a>

        <Reveal>
        <Heading level={1} className="mt-6">
          {title}
        </Heading>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {job.location && (
            <Eyebrow className="text-muted-foreground">{job.location}</Eyebrow>
          )}
          {typeLabel && (
            <Eyebrow className="text-muted-foreground">{typeLabel}</Eyebrow>
          )}
          {job.department && (
            <Eyebrow className="text-muted-foreground">{job.department}</Eyebrow>
          )}
        </div>
        </Reveal>

        {description && (
          <Reveal delay={80}>
          <div className="mt-10">
            <Heading level={3}>{copy.descriptionLabel}</Heading>
            <div className="mt-4 whitespace-pre-line text-base leading-7 text-muted-foreground">
              {description}
            </div>
          </div>
          </Reveal>
        )}

        {requirements && (
          <Reveal delay={160}>
          <div className="mt-10">
            <Heading level={3}>{copy.requirementsLabel}</Heading>
            <div className="mt-4 whitespace-pre-line text-base leading-7 text-muted-foreground">
              {requirements}
            </div>
          </div>
          </Reveal>
        )}

        <Reveal delay={240}>
        <Card className="mt-14">
          <Heading level={3}>{copy.applyLabel}</Heading>
          <JobApplicationForm locale={l} jobOfferId={job.id} />
        </Card>
        </Reveal>
      </Container>
    </Section>
  );
}
