import Link from "next/link";
import { getEventSpeakerQuestions } from "@/actions/speaker-questions";
import { QuestionsList } from "./questions-list";
import { PageHeader } from "@/components/page-header";

export default async function EventQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const questions = await getEventSpeakerQuestions(eventId);

  const newCount = questions.filter((q) => q.status === "new").length;

  return (
    <div>
      <PageHeader
        title="Speaker questions"
        description={`${newCount} new · ${questions.length} total`}
        back={{ href: `/${locale}/events/${eventId}`, label: "Event" }}
        cta={
          <Link
            href={`/api/events/${eventId}/speaker-questions-pdf?locale=${locale}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Download PDF
          </Link>
        }
      />

      <QuestionsList
        locale={locale}
        eventId={eventId}
        questions={questions}
      />
    </div>
  );
}
