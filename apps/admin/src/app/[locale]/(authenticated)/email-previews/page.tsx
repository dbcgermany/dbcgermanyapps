import { getTranslations } from "next-intl/server";
import { requireRole } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmailPreviewsClient } from "./email-previews-client";

export default async function EmailPreviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireRole("super_admin");
  const t = await getTranslations({ locale, namespace: "admin.emailPreviews" });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <EmailPreviewsClient
        locale={locale}
        defaultEmail={user.email}
      />
    </div>
  );
}
