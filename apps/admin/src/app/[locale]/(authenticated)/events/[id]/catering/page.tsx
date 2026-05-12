import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
  const [event, items, t, tBack] = await Promise.all([
    getEvent(id),
    listCateringMenu(id),
    getTranslations({ locale, namespace: "admin.catering" }),
    getTranslations({ locale, namespace: "admin.back" }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={event.title_en}
        back={{ href: `/${locale}/events/${id}`, label: tBack("event") }}
      />

      {!event.catering_enabled && (
        <div className="mt-6 rounded-lg border border-warning-border bg-warning-soft/40 p-4 text-sm">
          <p className="font-medium text-warning">{t("disabledTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("disabledHint")}{" "}
            <Link
              href={`/${locale}/events/${id}/edit`}
              className="underline hover:text-primary"
            >
              {t("eventSettingsLink")}
            </Link>
            .
          </p>
        </div>
      )}

      <CateringMenuClient eventId={id} locale={locale} items={items} />
    </div>
  );
}
