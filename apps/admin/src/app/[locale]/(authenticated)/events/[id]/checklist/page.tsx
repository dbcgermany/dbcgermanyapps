import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/actions/events";
import { getEventChecklist } from "@/actions/checklist";
import { getStaff } from "@/actions/staff";
import { PageHeader } from "@/components/page-header";
import { ChecklistClient } from "./checklist-client";

const PAGE_T = {
  en: { title: "Checklist", done: "done", overdue: "overdue" },
  de: { title: "Checkliste", done: "erledigt", overdue: "überfällig" },
  fr: { title: "Checklist", done: "terminé", overdue: "en retard" },
} as const;

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const pt = PAGE_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof PAGE_T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [checklist, staff] = await Promise.all([
    getEventChecklist(id),
    getStaff(),
  ]);

  const { progress } = checklist;
  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title={pt.title}
        description={`${progress.done}/${progress.total} ${pt.done} (${pct}%)${progress.overdue > 0 ? ` \u00B7 ${progress.overdue} ${pt.overdue}` : ""}`}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      <ChecklistClient
        eventId={id}
        items={checklist.items}
        progress={checklist.progress}
        staff={staff.map((s) => ({
          id: s.id,
          name: s.display_name || s.email,
        }))}
        locale={locale}
        eventStartsAt={event.starts_at}
      />
    </div>
  );
}
