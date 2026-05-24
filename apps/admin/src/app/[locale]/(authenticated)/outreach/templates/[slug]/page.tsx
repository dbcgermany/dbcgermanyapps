import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOutreachTemplate } from "@/actions/outreach-templates";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        back={{ href: `/${locale}/outreach/templates`, label: t("back") }}
        title={t("editTitle")}
        description={template.slug}
      />
      <div className="mt-6">
        <OutreachTemplateEditor template={template} locale={locale} />
      </div>
    </div>
  );
}
