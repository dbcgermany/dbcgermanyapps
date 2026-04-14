import Link from "next/link";
import { getTeamMembers } from "@/actions/team";
import { VisibilitySelect } from "./visibility-select";

export default async function TeamListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const members = await getTeamMembers();

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Team profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public team page content. Set visibility per member: <code>public</code> shows on
            dbc-germany.com/team, <code>internal</code> is admin-only, <code>hidden</code>{" "}
            archives the row.
          </p>
        </div>
        <Link
          href={`/${locale}/team/new`}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          New team member
        </Link>
      </div>

      {members.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          No team members yet.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {members.map((m) => {
            const badgeClass =
              m.visibility === "public"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : m.visibility === "internal"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-muted text-muted-foreground";
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                      {m.name
                        .split(/\s+/)
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                      >
                        {m.visibility}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {m.role_en} · sort {m.sort_order}
                      {m.email && ` · ${m.email}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <VisibilitySelect id={m.id} current={m.visibility} locale={locale} />
                  <Link
                    href={`/${locale}/team/${m.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
