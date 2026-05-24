import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LinkButton } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";
import { getEventSpeakersForAdmin, getSpeakers } from "@/actions/speakers";
import { PageHeader } from "@/components/page-header";
import { EventSpeakersClient } from "./speakers-client";

export default async function EventSpeakersAdminPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title_en")
    .eq("id", id)
    .single();
  if (!event) return notFound();

  const [eventSpeakers, allSpeakers] = await Promise.all([
    getEventSpeakersForAdmin(id),
    getSpeakers(),
  ]);

  // Speakers not yet attached to this event
  const attachedIds = new Set(eventSpeakers.map((es) => es.speaker_id));
  const available = allSpeakers.filter((s) => !attachedIds.has(s.id));

  return (
    <div>
      <PageHeader
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
        title={`Speakers · ${event.title_en}`}
        description="Attach speakers from the global library and set role labels per event."
        cta={
          <LinkButton href={`/${locale}/speakers/new`} variant="primary">
            New speaker
          </LinkButton>
        }
      />

      <div className="mt-8">
        <EventSpeakersClient
          eventId={id}
          locale={locale}
          attached={eventSpeakers}
          available={available.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
          }))}
        />
      </div>
    </div>
  );
}
