import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageBack } from "@dbc/ui";
import { getOutreachTemplate } from "@/actions/outreach-templates";
import { OutreachTemplateEditor } from "./editor";

export default async function OutreachTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({
    locale,
    namespace: "admin.outreach.editor",
  });
  const template = await getOutreachTemplate(slug);
  if (!template) notFound();

  return (
    <div>
      <PageBack href={`/${locale}/outreach/templates`} label={t("back")} />
      <h1 className="mt-2 font-heading text-2xl font-bold">{t("editTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{template.slug}</p>
      <OutreachTemplateEditor template={template} locale={locale} />
    </div>
  );
}
