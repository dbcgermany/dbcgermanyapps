import Link from "next/link";
import { getEmailSequences } from "@/actions/email-sequences";
import { SequenceForm } from "./sequence-form";
import { EmailRow } from "./email-row";
import { Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";

export default async function EmailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const sequences = await getEmailSequences(eventId);

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {locale === "de"
            ? "← Zurück zur Veranstaltung"
            : locale === "fr"
              ? "← Retour à l’événement"
              : "← Back to event"}
        </Link>
        <PageHeader
          title={locale === "de"
            ? "E-Mail-Sequenz"
            : locale === "fr"
              ? "Séquence d’e-mails"
              : "Email Sequence"}
          description={locale === "de"
            ? "Automatische Follow-up-E-Mails an alle Teilnehmer nach der Veranstaltung. Verwenden Sie {name} für den Namen des Teilnehmers."
            : locale === "fr"
              ? "E-mails de suivi automatiques envoyés à tous les participants après l’événement. Utilisez {name} pour le nom du participant."
              : "Automated follow-up emails sent to all attendees after the event. Use {name} for the attendee’s name."}
          className="mt-2"
        />
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
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">
          {locale === "de"
            ? "Sequenz hinzufügen"
            : locale === "fr"
              ? "Ajouter une séquence"
              : "Add Sequence"}
        </h2>
        <SequenceForm eventId={eventId} locale={locale} />
      </Card>
    </div>
  );
}
