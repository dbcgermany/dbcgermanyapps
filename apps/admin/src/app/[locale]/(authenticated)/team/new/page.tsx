import { getTranslations } from "next-intl/server";
import { getStaffAccountsForLinking } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

const T = {
  en: { title: "New team member" },
  de: { title: "Neues Teammitglied" },
  fr: { title: "Nouveau membre" },
} as const;

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const staffAccounts = await getStaffAccountsForLinking();

  return (
    <div>
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/team`, label: tBack("team") }}
      />
      <TeamMemberForm locale={locale} mode="create" staffAccounts={staffAccounts} />
    </div>
  );
}
