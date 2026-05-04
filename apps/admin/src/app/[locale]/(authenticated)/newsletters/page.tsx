import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, LinkButton } from "@dbc/ui";
import { listNewsletters } from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";

export default async function NewslettersIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.newsletters.list" });
  const newsletters = await listNewsletters();

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        cta={
          <LinkButton href={`/${locale}/newsletters/new`}>
            {t("newNewsletter")}
          </LinkButton>
        }
      />

      {/* Mobile: iOS grouped-list cells */}
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
        {newsletters.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </li>
        ) : (
          newsletters.map((n) => (
            <li key={n.id}>
              <Link
                href={`/${locale}/newsletters/${n.id}`}
                className="flex items-start gap-3 px-4 py-3 transition-colors active:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{n.subject || t("untitled")}</p>
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
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {n.locale} · {n.recipients_count ?? "—"}
                    {n.sent_at
                      ? ` · ${new Date(n.sent_at).toLocaleDateString()}`
                      : ` · ${new Date(n.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <span aria-hidden className="mt-1 text-muted-foreground">›</span>
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">{t("subject")}</th>
              <th className="px-4 py-3 text-left">{t("status")}</th>
              <th className="px-4 py-3 text-left">{t("locale")}</th>
              <th className="px-4 py-3 text-right">{t("recipients")}</th>
              <th className="px-4 py-3 text-left">{t("sentUpdated")}</th>
            </tr>
          </thead>
          <tbody>
            {newsletters.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {t("empty")}
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
                    {n.subject || t("untitled")}
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

