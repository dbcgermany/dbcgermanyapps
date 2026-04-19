import { getTranslations } from "next-intl/server";
import { listContactCategories } from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { NewsletterComposer } from "../composer";

const T = {
  en: {
    title: "New newsletter",
    description:
      "Save as a draft, preview the recipient count, and send when ready.",
  },
  de: {
    title: "Neuer Newsletter",
    description:
      "Als Entwurf speichern, Empfängerzahl anzeigen und bei Bereitschaft senden.",
  },
  fr: {
    title: "Nouvelle newsletter",
    description:
      "Enregistrez en brouillon, prévisualisez le nombre de destinataires, puis envoyez.",
  },
} as const;

export default async function NewNewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const categories = await listContactCategories();
  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        back={{ href: `/${locale}/newsletters`, label: tBack("newsletters") }}
      />
      <NewsletterComposer
        uiLocale={locale}
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name_en,
        }))}
      />
    </div>
  );
}
