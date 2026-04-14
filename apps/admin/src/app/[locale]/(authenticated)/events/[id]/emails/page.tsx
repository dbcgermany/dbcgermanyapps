import Link from "next/link";
import { getEmailSequences } from "@/actions/email-sequences";
import { SequenceForm } from "./sequence-form";
import { EmailRow } from "./email-row";

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
            <EmailRow
              key={seq.id}
              seq={seq}
              eventId={eventId}
              locale={locale}
            />
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
