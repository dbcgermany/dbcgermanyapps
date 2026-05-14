import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { listOutreachTemplates } from "@/actions/outreach-templates";

export default async function OutreachTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "admin.outreach.editor",
  });
  const templates = await listOutreachTemplates();

  return (
    <div>
      <PageHeader title={t("indexTitle")} description={t("indexSubtitle")} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">{t("colName")}</th>
              <th className="px-4 py-3 text-left">{t("colDescription")}</th>
              <th className="px-4 py-3 text-left">{t("colReplyTo")}</th>
              <th className="px-4 py-3 text-left">{t("colUpdated")}</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {templates.map((tmpl) => {
              const href = `/${locale}/outreach/templates/${tmpl.slug}`;
              return (
                <tr key={tmpl.slug}>
                  <td className="px-4 py-3">
                    <Link href={href} className="font-medium hover:underline">
                      {tmpl.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{tmpl.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tmpl.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {tmpl.reply_to}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(tmpl.updated_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={href}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      {t("edit")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
