import { getTranslations } from "next-intl/server";
import { getEventSpeakerQuestions } from "@/actions/speaker-questions";
import { QuestionsList } from "./questions-list";
import { PageHeader } from "@/components/page-header";
import { PdfButton } from "@/components/pdf-button";

export default async function EventQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const questions = await getEventSpeakerQuestions(eventId);

  const newCount = questions.filter((q) => q.status === "new").length;

  return (
    <div>
      <PageHeader
        title="Speaker questions"
        description={`${newCount} new · ${questions.length} total`}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
        cta={
          <PdfButton
            href={`/api/events/${eventId}/speaker-questions-pdf?locale=${locale}`}
            label="Download PDF"
          />
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
