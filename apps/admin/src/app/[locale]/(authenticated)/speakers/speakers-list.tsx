import Link from "next/link";
import { Badge } from "@dbc/ui";
import type { Speaker } from "@/actions/speakers";
import { SpeakerVisibilitySelect } from "./visibility-select";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
        const subtitle = [s.title_en, s.company_en].filter(Boolean).join(" · ");
        return (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-center gap-3">
              {s.photo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={s.photo_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                  {initialsOf(fullName)}
                </span>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/speakers/${s.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {fullName}
                  </Link>
                  <Badge variant={visibilityVariant(s.visibility)}>
                    {visibilityLabel(s.visibility, locale)}
                  </Badge>
                  {s.team_member_id && (
                    <Badge variant="info">team-linked</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {subtitle || "—"}
                  {s.email && ` · ${s.email}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
