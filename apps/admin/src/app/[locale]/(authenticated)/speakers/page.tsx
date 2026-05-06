import Link from "next/link";
import { LinkButton } from "@dbc/ui";
import { getSpeakers } from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function SpeakersListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const speakers = await getSpeakers();

  return (
    <div>
      <PageHeader
        title="Speakers"
        description="Global speakers library. Each speaker can be attached to one or more events."
        cta={
          <LinkButton href={`/${locale}/speakers/new`}>New speaker</LinkButton>
        }
      />

      {speakers.length === 0 ? (
        <EmptyState
          message="No speakers yet. Add the first one to populate event line-ups."
          cta={{ label: "New speaker", href: `/${locale}/speakers/new` }}
          className="mt-12"
        />
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          {speakers.map((s) => (
            <li key={s.id}>
              <Link
                href={`/${locale}/speakers/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photo_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-bold">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[s.title_en, s.company_en].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.visibility === "public"
                      ? "bg-success-soft text-success-strong"
                      : s.visibility === "internal"
                        ? "bg-muted text-muted-foreground"
                        : "bg-danger-soft text-danger-strong"
                  }`}
                >
                  {s.visibility}
                </span>
                {s.team_member_id && (
                  <span className="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-semibold text-info-strong">
                    team-linked
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
