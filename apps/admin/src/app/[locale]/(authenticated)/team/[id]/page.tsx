import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getTranslations } from "next-intl/server";
import {
  getTeamMember,
  deleteTeamMember,
  getStaffAccountsForLinking,
} from "@/actions/team";
import { PageHeader } from "@/components/page-header";
import { TeamMemberForm } from "../member-form";

const T = {
  en: {
    linked: "Linked to staff account",
    notLinked: "No staff account linked",
    viewStaff: "View staff profile →",
    delete: "Delete",
    visibility: {
      public: "Public", internal: "Internal", hidden: "Hidden",
    } as Record<string, string>,
  },
  de: {
    linked: "Mit Mitarbeiterkonto verknüpft",
    notLinked: "Kein Mitarbeiterkonto verknüpft",
    viewStaff: "Mitarbeiterprofil ansehen →",
    delete: "Löschen",
    visibility: {
      public: "Öffentlich", internal: "Intern", hidden: "Ausgeblendet",
    } as Record<string, string>,
  },
  fr: {
    linked: "Lié à un compte équipe",
    notLinked: "Aucun compte équipe lié",
    viewStaff: "Voir le profil équipe →",
    delete: "Supprimer",
    visibility: {
      public: "Public", internal: "Interne", hidden: "Masqué",
    } as Record<string, string>,
  },
} as const;

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const [member, staffAccounts] = await Promise.all([
    getTeamMember(id),
    getStaffAccountsForLinking(id),
  ]);

  return (
    <div>
      <PageHeader
        title={member.name}
        description={member.profile_id ? t.linked : t.notLinked}
        back={{ href: `/${locale}/team`, label: tBack("team") }}
        cta={
          <div className="flex items-center gap-3">
            {member.profile_id && (
              <Link
                href={`/${locale}/staff/${member.profile_id}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t.viewStaff}
              </Link>
            )}
            <Badge variant={member.visibility === "public" ? "success" : member.visibility === "internal" ? "warning" : "default"}>
              {t.visibility[member.visibility] ?? member.visibility}
            </Badge>
            <form
              action={async () => {
                "use server";
                await deleteTeamMember(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {t.delete}
              </button>
            </form>
          </div>
        }
      />
      <TeamMemberForm
        locale={locale}
        mode="edit"
        initial={member}
        staffAccounts={staffAccounts}
      />
    </div>
  );
}
