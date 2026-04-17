import { getEvent } from "@/actions/events";
import { EditEventForm } from "./edit-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const event = await getEvent(id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit Event</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title_en}</p>

      <EditEventForm locale={locale} event={event} />
    </div>
  );
}
