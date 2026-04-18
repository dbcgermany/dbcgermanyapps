import Link from "next/link";
import { getStaffAccountsForLinking } from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

const T = {
  en: { back: "← Team", title: "New team member" },
  de: { back: "← Team", title: "Neues Teammitglied" },
  fr: { back: "← Équipe", title: "Nouveau membre" },
} as const;

export default async function NewTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const staffAccounts = await getStaffAccountsForLinking();

  return (
    <div>
      <Link
        href={`/${locale}/team`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {t.back}
      </Link>
      <PageHeader title={t.title} />
      <TeamMemberForm locale={locale} mode="create" staffAccounts={staffAccounts} />
    </div>
  );
}
