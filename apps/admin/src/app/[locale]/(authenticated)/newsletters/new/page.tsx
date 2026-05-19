import { getTranslations } from "next-intl/server";
import { getCompanyInfo, formatOfficeAddress } from "@dbc/legal";
import {
  getNewsletterSenderDomainStatus,
  listContactCategories,
} from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { NewsletterComposer } from "../composer";

export default async function NewNewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.newsletters.new" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [categories, domainStatus, info] = await Promise.all([
    listContactCategories(),
    getNewsletterSenderDomainStatus(),
    getCompanyInfo(),
  ]);
  const companyFooter = [
    [info?.legal_name, info?.legal_form].filter(Boolean).join(" "),
    formatOfficeAddress(info, { oneLine: true }),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        back={{ href: `/${locale}/newsletters`, label: tBack("newsletters") }}
      />
      <div className="mt-8 max-w-3xl">
        <NewsletterComposer
          uiLocale={locale}
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name_en,
          }))}
          domainStatus={domainStatus}
          companyFooter={companyFooter}
        />
      </div>
    </div>
  );
}
