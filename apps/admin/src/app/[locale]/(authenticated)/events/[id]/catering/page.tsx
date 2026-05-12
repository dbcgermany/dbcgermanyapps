import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getEvent } from "@/actions/events";
import { listCateringMenu } from "@/actions/catering";
import { CateringMenuClient } from "./catering-menu-client";

export default async function EventCateringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [event, items] = await Promise.all([
    getEvent(id),
    listCateringMenu(id),
  ]);

  return (
    <div>
      <PageHeader
        title="Catering menu"
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: "Event" }}
      />

      {!event.catering_enabled && (
        <div className="mt-6 rounded-lg border border-warning-border bg-warning-soft/40 p-4 text-sm">
          <p className="font-medium text-warning">
            Catering is disabled for this event.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open{" "}
            <Link
              href={`/${locale}/events/${id}/edit`}
              className="underline hover:text-primary"
            >
              event settings
            </Link>{" "}
            and tick <em>Catering enabled for this event</em> before guests can submit selections.
          </p>
        </div>
      )}

      <CateringMenuClient eventId={id} locale={locale} items={items} />
    </div>
  );
}
