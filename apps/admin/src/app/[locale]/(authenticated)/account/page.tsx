import { getTranslations } from "next-intl/server";
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
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const title =
    locale === "de" ? "Mein Konto" : locale === "fr" ? "Mon compte" : "My account";
  const description =
    locale === "de"
      ? "Ihr persönliches Profil, Einstellungen und Sicherheit. Unternehmensweite Einstellungen finden Sie unter Unternehmensdaten."
      : locale === "fr"
        ? "Votre profil personnel, vos préférences et votre sécurité. Les paramètres à l’échelle de la société se trouvent dans Informations société."
        : "Your personal profile, preferences, and security. Company-wide settings live under Company Info.";

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        back={{ href: `/${locale}/dashboard`, label: tBack("dashboard") }}
      />

      <AccountTabs profile={profile} locale={locale} />
    </div>
  );
}
