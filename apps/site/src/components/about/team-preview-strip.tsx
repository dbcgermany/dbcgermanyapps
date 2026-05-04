import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import {
  TeamMemberCard,
  type TeamMemberCardData,
} from "@/components/team/team-member-card";

export async function TeamPreviewStrip({
  members,
  locale,
}: {
  members: TeamMemberCardData[];
  locale: string;
}) {
  if (members.length === 0) return null;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = await getTranslations({ locale: l, namespace: "site.about.teamPreview" });
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            {t("title")}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {members.slice(0, 6).map((m, i) => (
            <TeamMemberCard
              key={m.slug}
              member={m}
              locale={locale}
              revealDelay={Math.min(i, 5) * 50}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href={`/${locale}/team`}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("viewAll")}
          </a>
        </div>
      </div>
    </section>
  );
}
