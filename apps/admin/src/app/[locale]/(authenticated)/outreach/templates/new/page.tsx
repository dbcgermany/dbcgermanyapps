import { getTranslations } from "next-intl/server";
import {
  getOutreachTemplate,
  type OutreachTemplateRow,
} from "@/actions/outreach-templates";
import { PageHeader } from "@/components/page-header";
import { OutreachTemplateEditor } from "../[slug]/editor";

/**
 * "+ New template" route. Mounts the same OutreachTemplateEditor in create
 * mode (SSOT — one editor component, two modes). Supports `?from=<slug>` to
 * hydrate fields from an existing template for quick duplication.
 */
export default async function NewOutreachTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: "admin.outreach.editor",
  });

  // Hydrate from an existing template when ?from=<slug> is provided. We
  // intentionally blank the slug + reset is_system so the new row can be
  // freely deleted later. Everything else (copy, reply-to) is copied so
  // the operator can tweak rather than start from zero.
  let seed: OutreachTemplateRow = {
    id: "",
    slug: "",
    name: "",
    description: "",
    reply_to: "team@dbc-germany.com",
    subject_en: "",
    subject_de: "",
    subject_fr: "",
    body_en: "",
    body_de: "",
    body_fr: "",
    is_system: false,
    sort_order: 100,
    updated_at: new Date().toISOString(),
  };
  if (from) {
    const source = await getOutreachTemplate(from);
    if (source) {
      seed = {
        ...source,
        id: "",
        slug: "",
        is_system: false,
      };
    }
  }

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/outreach/templates`, label: t("back") }}
        title={t("newTitle")}
        description={t("newSubtitle")}
      />
      <div className="mt-6">
        <OutreachTemplateEditor template={seed} locale={locale} mode="create" />
      </div>
    </div>
  );
}
