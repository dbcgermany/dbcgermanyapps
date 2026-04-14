import { getTeamMember, deleteTeamMember } from "@/actions/team";
import { TeamMemberForm } from "../member-form";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const member = await getTeamMember(id);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{member.name}</h1>
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
            Delete
          </button>
        </form>
      </div>
      <TeamMemberForm locale={locale} mode="edit" initial={member} />
    </div>
  );
}
