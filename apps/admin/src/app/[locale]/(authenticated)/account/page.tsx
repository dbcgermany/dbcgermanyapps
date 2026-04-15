import { getAccountProfile } from "@/actions/account";
import { AccountTabs } from "./account-tabs";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const profile = await getAccountProfile();

  return (
    <div className="p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">My account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal profile, preferences, and security. Company-wide
          settings live under Company Info.
        </p>
      </div>

      <AccountTabs profile={profile} locale={locale} />
    </div>
  );
}
