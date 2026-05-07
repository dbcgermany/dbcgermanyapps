import Link from "next/link";
import { Badge } from "@dbc/ui";
import { PersonListRow } from "@/components/person-list-row";
import type { Speaker } from "@/actions/speakers";
import { SpeakerVisibilitySelect } from "./visibility-select";

function visibilityVariant(
  visibility: Speaker["visibility"],
): "success" | "warning" | "default" {
  return visibility === "public"
    ? "success"
    : visibility === "internal"
      ? "warning"
      : "default";
}

const VIS_LABELS = {
  en: { public: "Public", internal: "Internal", hidden: "Hidden" },
  de: { public: "Öffentlich", internal: "Intern", hidden: "Versteckt" },
  fr: { public: "Public", internal: "Interne", hidden: "Masqué" },
} as const;

function visibilityLabel(visibility: Speaker["visibility"], locale: string) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  return VIS_LABELS[l][visibility as keyof typeof VIS_LABELS.en] ?? visibility;
}

export function SpeakersList({
  initial,
  locale,
}: {
  initial: Speaker[];
  locale: string;
}) {
  return (
    <ul className="space-y-3">
      {initial.map((s) => {
        const fullName = `${s.first_name} ${s.last_name}`.trim();
        const subtitleBits = [s.title_en, s.company_en].filter(Boolean);
        const subtitle = subtitleBits.length > 0 ? subtitleBits.join(" · ") : "—";
        return (
          <li key={s.id}>
            <PersonListRow
              id={s.id}
              photoUrl={s.photo_url}
              initialsName={fullName}
              name={fullName}
              nameHref={`/${locale}/speakers/${s.id}`}
              badges={
                <>
                  <Badge variant={visibilityVariant(s.visibility)}>
                    {visibilityLabel(s.visibility, locale)}
                  </Badge>
                  {s.team_member_id && <Badge variant="info">team-linked</Badge>}
                </>
              }
              subtitle={
                <>
                  {subtitle}
                  {s.email && ` · ${s.email}`}
                </>
              }
              actions={
                <>
                  <SpeakerVisibilitySelect
                    id={s.id}
                    current={s.visibility}
                    locale={locale}
                  />
                  <Link
                    href={`/${locale}/speakers/${s.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Edit
                  </Link>
                </>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
