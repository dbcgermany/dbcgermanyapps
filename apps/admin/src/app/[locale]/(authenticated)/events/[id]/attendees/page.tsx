import { getTranslations } from "next-intl/server";
import { getEventAttendees } from "@/actions/attendees";
import { AttendeesList } from "./attendees-list";
import { PageHeader } from "@/components/page-header";

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const attendees = await getEventAttendees(eventId);
  const [tBack, t] = await Promise.all([
    getTranslations({ locale, namespace: "admin.back" }),
    getTranslations({ locale, namespace: "admin.events.attendees" }),
  ]);

  const checkedIn = attendees.filter((a) => a.checked_in_at).length;

  return (
    <div>
      <PageHeader
        title={t("pageTitle")}
        description={`${checkedIn} / ${attendees.length} ${t("checkedIn")}`}
        back={{ href: `/${locale}/events/${eventId}`, label: tBack("event") }}
      />

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
