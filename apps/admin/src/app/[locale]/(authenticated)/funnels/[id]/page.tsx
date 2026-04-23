import { getTranslations } from "next-intl/server";
import {
  archiveFunnel,
  getFunnel,
  getFunnelKpis,
  listFunnelEventOptions,
  publishFunnel,
  unpublishFunnel,
} from "@/actions/funnels";
import { PageHeader } from "@/components/page-header";
import { FunnelForm } from "../funnel-form";
import { KpiCards } from "./kpi-cards";
import { ShareLinkBuilder } from "./share-link-builder";

const T = {
  en: {
    title: "Edit funnel",
    publish: "Publish",
    unpublish: "Unpublish",
    archive: "Archive",
    kpisHeading: "Performance",
    shareHeading: "Share links",
  },
  de: {
    title: "Funnel bearbeiten",
    publish: "Veröffentlichen",
    unpublish: "Zurückziehen",
    archive: "Archivieren",
    kpisHeading: "Performance",
    shareHeading: "Share-Links",
  },
  fr: {
    title: "Modifier le funnel",
    publish: "Publier",
    unpublish: "Dépublier",
    archive: "Archiver",
    kpisHeading: "Performance",
    shareHeading: "Liens de partage",
  },
} as const;

export default async function EditFunnelPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });
  const funnel = await getFunnel(id);
  const kpis7 = await getFunnelKpis(id, 7);
  const eventOptions = await listFunnelEventOptions(locale);

  return (
    <div className="space-y-10">
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/funnels`, label: tBack("funnels") }}
        cta={
          <div className="flex flex-wrap items-center gap-3">
            <form
              action={async () => {
                "use server";
                if (funnel.status === "published") {
                  await unpublishFunnel(id, locale);
                } else {
                  await publishFunnel(id, locale);
                }
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {funnel.status === "published" ? t.unpublish : t.publish}
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await archiveFunnel(id, locale);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {t.archive}
              </button>
            </form>
          </div>
        }
      />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">{t.kpisHeading}</h2>
        <KpiCards funnelId={id} locale={locale} initial7d={kpis7} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">{t.shareHeading}</h2>
        <ShareLinkBuilder slug={funnel.slug} locale={locale} />
      </section>

      <FunnelForm
        mode="edit"
        locale={locale}
        initial={funnel}
        eventOptions={eventOptions}
      />
    </div>
  );
}
