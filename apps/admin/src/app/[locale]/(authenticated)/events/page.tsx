import Link from "next/link";
import { Badge } from "@dbc/ui";
import { getTranslations } from "next-intl/server";
import { getEvents, togglePublish } from "@/actions/events";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.eventsList" });
  const events = await getEvents();

  return (
    <div>
      <PageHeader
        title={t("title")}
        cta={
          <Link
            href={`/${locale}/events/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("createEvent")}
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          message={t("emptyMessage")}
          cta={{ label: t("createEvent"), href: `/${locale}/events/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("event")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("type")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("date")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("city")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("capacity")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/events/${event.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {locale === "de"
                        ? event.title_de
                        : locale === "fr"
                          ? event.title_fr
                          : event.title_en}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {event.event_type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(event.starts_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.city}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.capacity}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={event.is_published ? "success" : "warning"}>
                      {event.is_published ? t("published") : t("draft")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await togglePublish(event.id, locale);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {event.is_published ? t("unpublish") : t("publish")}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
