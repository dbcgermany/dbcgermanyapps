import { getIncubationApplications } from "@/actions/applications";
import { StatusSelect } from "./status-select";

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apps = await getIncubationApplications();

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold">
        Incubation applications
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submissions from the public form at /services/incubation.
      </p>

      {apps.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          No applications yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Founder</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Pitch</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apps.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium">{a.founder_name}</p>
                    <a
                      href={`mailto:${a.founder_email}`}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      {a.founder_email}
                    </a>
                    {a.founder_phone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.founder_phone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.country ?? "—"} · {a.locale.toUpperCase()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{a.company_name ?? "—"}</p>
                    {a.company_website && (
                      <a
                        href={a.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        {a.company_website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {a.company_stage ?? "—"}
                    {a.funding_needed_cents != null && (
                      <p className="mt-1">
                        €{(a.funding_needed_cents / 100).toLocaleString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 max-w-md text-xs leading-5 text-muted-foreground">
                    {a.pitch.length > 240
                      ? a.pitch.slice(0, 240) + "…"
                      : a.pitch}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusSelect
                      id={a.id}
                      locale={locale}
                      current={a.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
