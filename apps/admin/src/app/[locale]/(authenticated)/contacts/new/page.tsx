import { getTranslations } from "next-intl/server";
import {
  listContactCategoriesForFilter,
  listEventsForContactFilter,
} from "@/actions/contacts";
import { PageHeader } from "@/components/page-header";
import { NewContactForm } from "./new-contact-form";

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.contacts" });
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [events, categories] = await Promise.all([
    listEventsForContactFilter(),
    listContactCategoriesForFilter(),
  ]);

  return (
    <div>
      <PageHeader
        title={t("newTitle")}
        description={t("newDescription")}
        back={{ href: `/${locale}/contacts`, label: tBack("contacts") }}
      />
      <div className="mt-8 max-w-3xl">
        <NewContactForm
          locale={locale}
          events={events}
          categories={categories}
        />
      </div>
    </div>
  );
}
