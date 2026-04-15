import Link from "next/link";
import { listNewsletters } from "@/actions/newsletters";

export default async function NewslettersIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const newsletters = await listNewsletters();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Newsletters</h1>
        <Link
          href={`/${locale}/newsletters/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + New newsletter
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Broadcasts to confirmed, non-unsubscribed contacts. Every email includes
        a one-click unsubscribe link.
      </p>

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
                  <StatusBadge status={n.status} />
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    sending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] ?? map.draft
      }`}
    >
      {status}
    </span>
  );
}
