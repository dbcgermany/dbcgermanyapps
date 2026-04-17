import Link from "next/link";
import { getEventAttendees } from "@/actions/attendees";
import { AttendeesList } from "./attendees-list";

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const attendees = await getEventAttendees(eventId);

  const checkedIn = attendees.filter((a) => a.checked_in_at).length;

  return (
    <div>
      <div>
        <Link
          href={`/${locale}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to event
        </Link>
        <div className="mt-2 flex items-end justify-between">
          <h1 className="font-heading text-2xl font-bold">
            {locale === "de" ? "Teilnehmer" : locale === "fr" ? "Participants" : "Attendees"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {checkedIn} / {attendees.length} {locale === "de" ? "eingecheckt" : locale === "fr" ? "enregistr\u00E9s" : "checked in"}
          </p>
        </div>
      </div>

      <AttendeesList
        locale={locale}
        eventId={eventId}
        attendees={attendees.map((a) => ({
          id: a.id,
          name: a.attendee_name,
          email: a.attendee_email,
          ticketToken: a.ticket_token,
          tierName: a.tier
            ? ((a.tier[`name_${locale}` as keyof typeof a.tier] as string) ||
              a.tier.name_en)
            : "",
          acquisitionType: a.order?.acquisition_type ?? "purchased",
          checkedInAt: a.checked_in_at,
          notes: a.notes ?? "",
        }))}
      />
    </div>
  );
}
