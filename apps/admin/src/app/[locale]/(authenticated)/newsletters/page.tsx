import Link from "next/link";
import { Badge } from "@dbc/ui";
import { listNewsletters } from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";

export default async function NewslettersIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const newsletters = await listNewsletters();

  return (
    <div>
      <PageHeader
        title="Newsletters"
        description="Broadcasts to confirmed, non-unsubscribed contacts. Every email includes a one-click unsubscribe link."
        cta={
          <Link
            href={`/${locale}/newsletters/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + New newsletter
          </Link>
        }
      />

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Locale</th>
              <th className="px-4 py-3 text-right">Recipients</th>
              <th className="px-4 py-3 text-left">Sent / updated</th>
            </tr>
          </thead>
          <tbody>
            {newsletters.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No newsletters yet. Create the first one.
                </td>
              </tr>
            )}
            {newsletters.map((n) => (
              <tr key={n.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/newsletters/${n.id}`}
                    className="font-medium hover:underline"
                  >
                    {n.subject || "(untitled)"}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      n.status === "sent"
                        ? "success"
                        : n.status === "sending"
                          ? "warning"
                          : n.status === "scheduled"
                            ? "info"
                            : n.status === "failed"
                              ? "error"
                              : "default"
                    }
                  >
                    {n.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 uppercase">{n.locale}</td>
                <td className="px-4 py-3 text-right">
                  {n.recipients_count ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {n.sent_at
                    ? new Date(n.sent_at).toLocaleString()
                    : new Date(n.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

