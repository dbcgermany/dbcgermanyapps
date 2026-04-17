import { getEvent } from "@/actions/events";
import { EditEventForm } from "./edit-form";
import { PageHeader } from "@/components/page-header";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const event = await getEvent(id);

  return (
    <div>
      <PageHeader title="Edit Event" description={event.title_en} />

      <EditEventForm locale={locale} event={event} />
    </div>
  );
}
