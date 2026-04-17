import { getAccountProfile } from "@/actions/account";
import { PageHeader } from "@/components/page-header";
import { AccountTabs } from "./account-tabs";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getAccountProfile();

  return (
    <div>
      <PageHeader
        title="My account"
        description="Your personal profile, preferences, and security. Company-wide settings live under Company Info."
      />

      <AccountTabs profile={profile} locale={locale} />
    </div>
  );
}
