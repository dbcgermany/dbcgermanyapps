import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import {
  listChapterDelegates,
  listChapterDelegateEvents,
} from "@/actions/chapter-delegates";
import { ChapterDelegatesClient } from "./chapter-delegates-client";

type Status = "active" | "pending_approval" | "rejected" | "revoked";

export default async function ChapterDelegatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    event?: string;
    chapter?: string;
    q?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: "admin.chapterDelegates",
  });
  const allowedStatuses: Status[] = [
    "pending_approval",
    "active",
    "rejected",
    "revoked",
  ];
  const status: Status =
    sp.status && (allowedStatuses as string[]).includes(sp.status)
      ? (sp.status as Status)
      : "pending_approval";

  const [rows, events] = await Promise.all([
    listChapterDelegates({
      status,
      eventId: sp.event || null,
      chapter: sp.chapter || null,
      search: sp.q || null,
    }),
    listChapterDelegateEvents(),
  ]);

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <ChapterDelegatesClient
        locale={locale}
        currentStatus={status}
        currentEventId={sp.event ?? null}
        currentChapter={sp.chapter ?? null}
        currentSearch={sp.q ?? null}
        rows={rows}
        events={events.map((e) => ({
          id: e.id,
          slug: e.slug,
          title:
            (e[`title_${locale}` as keyof typeof e] as string) || e.title_en,
        }))}
      />
    </div>
  );
}
