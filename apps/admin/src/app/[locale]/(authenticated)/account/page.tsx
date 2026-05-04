import { getTranslations } from "next-intl/server";
import {
  getAccountProfile,
  listNotificationPreferences,
} from "@/actions/account";
import { PageHeader } from "@/components/page-header";
import { AccountTabs } from "./account-tabs";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getAccountProfile();
  const notificationPrefs = await listNotificationPreferences();
  const [tBack, t] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.account" }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("pageTitle")}
        description={t("description")}
        back={{ href: `/${locale}/dashboard`, label: tBack("dashboard") }}
      />

      <AccountTabs
        profile={profile}
        locale={locale}
        notificationPrefs={notificationPrefs}
      />
    </div>
  );
}
