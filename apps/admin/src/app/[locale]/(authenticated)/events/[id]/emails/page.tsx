import Link from "next/link";
import {
  getEmailSequences,
  deleteEmailSequence,
  dispatchEmailSequence,
} from "@/actions/email-sequences";
import { SequenceForm } from "./sequence-form";

export default async function EmailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const sequences = await getEmailSequences(eventId);

  return (
    <div className="p-8">
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          {locale === "de"
            ? "E-Mail-Sequenz"
            : locale === "fr"
              ? "S\u00E9quence d\u2019e-mails"
              : "Email Sequence"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "de"
            ? "Automatische Follow-up-E-Mails an alle Teilnehmer nach der Veranstaltung. Verwenden Sie {name} f\u00FCr den Namen des Teilnehmers."
            : locale === "fr"
              ? "E-mails de suivi automatiques envoy\u00E9s \u00E0 tous les participants apr\u00E8s l\u2019\u00E9v\u00E9nement. Utilisez {name} pour le nom du participant."
              : "Automated follow-up emails sent to all attendees after the event. Use {name} for the attendee\u2019s name."}
        </p>
      </div>

      {/* Existing sequences */}
      {sequences.length > 0 && (
        <div className="mt-6 space-y-3">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      +{seq.delay_days}d
                    </span>
                    <p className="font-medium">{seq.subject_en}</p>
                    {seq.sent_at && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {seq.body_en}
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {!seq.sent_at && (
                    <form
                      action={async () => {
                        "use server";
                        await dispatchEmailSequence(seq.id, eventId, locale);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Send now
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deleteEmailSequence(seq.id, eventId, locale);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new sequence */}
      <div className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold">Add Sequence</h2>
        <SequenceForm eventId={eventId} locale={locale} />
      </div>
    </div>
  );
}
