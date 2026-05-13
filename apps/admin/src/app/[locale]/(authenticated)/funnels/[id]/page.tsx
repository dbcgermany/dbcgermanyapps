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
import { ActionForm } from "@/components/action-form";
import { captureServerError } from "@/lib/observe";
import { FunnelForm } from "../funnel-form";
import { KpiCards } from "./kpi-cards";
import { ShareLinkBuilder } from "./share-link-builder";

async function loadOrCapture<T>(
  op: () => Promise<T>,
  scope: string,
  data: Record<string, unknown>,
): Promise<T> {
  try {
    return await op();
  } catch (err) {
    captureServerError(err, { scope, data });
    throw err;
  }
}

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

export default async function EditFunnelPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  try {
    return await renderEditFunnelPage(props);
  } catch (err) {
    captureServerError(err, {
      scope: "funnels.editPage",
      data: { stage: "render" },
    });
    throw err;
  }
}

async function renderEditFunnelPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const tBack = await loadOrCapture(
    () => getTranslations({ locale, namespace: "admin.back" }),
    "funnels.getTranslations.back",
    { locale },
  );
  const tCommon = await loadOrCapture(
    () => getTranslations({ locale, namespace: "admin.common" }),
    "funnels.getTranslations.common",
    { locale },
  );
  const funnel = await loadOrCapture(() => getFunnel(id), "funnels.getFunnel", {
    funnel_id: id,
    locale,
  });
  const kpis7 = await loadOrCapture(
    () => getFunnelKpis(id, 7),
    "funnels.getFunnelKpis",
    { funnel_id: id, days: 7 },
  );
  const eventOptions = await loadOrCapture(
    () => listFunnelEventOptions(locale),
    "funnels.listFunnelEventOptions",
    { locale },
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title={t.title}
        back={{ href: `/${locale}/funnels`, label: tBack("funnels") }}
        cta={
          <div className="flex flex-wrap items-center gap-3">
            <ActionForm
              action={async () => {
                "use server";
                return funnel.status === "published"
                  ? unpublishFunnel(id, locale)
                  : publishFunnel(id, locale);
              }}
              successToast={
                funnel.status === "published"
                  ? tCommon("unpublishedToast")
                  : tCommon("publishedToast")
              }
              errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {funnel.status === "published" ? t.unpublish : t.publish}
              </button>
            </ActionForm>
            <ActionForm
              action={async () => {
                "use server";
                return archiveFunnel(id, locale);
              }}
              successToast={tCommon("archivedToast")}
              errorToastTemplate={tCommon("actionFailedToast", { error: "{error}" })}
            >
              <button
                type="submit"
                className="rounded-md border border-danger-border px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                {t.archive}
              </button>
            </ActionForm>
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
