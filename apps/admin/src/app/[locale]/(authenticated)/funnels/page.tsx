import Link from "next/link";
import { Badge, Card, LinkButton } from "@dbc/ui";
import { listFunnels } from "@/actions/funnels";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

const T = {
  en: {
    title: "Funnels",
    newFunnel: "New funnel",
    empty: "No funnels yet. Create the first one.",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
    views7d: "Views 7d",
    clicks7d: "Clicks 7d",
    ctr7d: "CTR 7d",
    ctaType: { external_link: "External", incubation_wizard: "Wizard", contact_form: "Contact" },
  },
  de: {
    title: "Funnels",
    newFunnel: "Neuer Funnel",
    empty: "Noch keine Funnels. Erstelle den ersten.",
    published: "Veröffentlicht",
    draft: "Entwurf",
    archived: "Archiviert",
    views7d: "Aufrufe 7T",
    clicks7d: "Klicks 7T",
    ctr7d: "CTR 7T",
    ctaType: { external_link: "Externer Link", incubation_wizard: "Wizard", contact_form: "Kontaktformular" },
  },
  fr: {
    title: "Funnels",
    newFunnel: "Nouveau funnel",
    empty: "Aucun funnel pour le moment. Créez le premier.",
    published: "Publié",
    draft: "Brouillon",
    archived: "Archivé",
    views7d: "Vues 7j",
    clicks7d: "Clics 7j",
    ctr7d: "CTR 7j",
    ctaType: { external_link: "Lien externe", incubation_wizard: "Wizard", contact_form: "Formulaire de contact" },
  },
} as const;

function statusVariant(status: "draft" | "published" | "archived") {
  if (status === "published") return "success" as const;
  if (status === "archived") return "default" as const;
  return "warning" as const;
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function FunnelsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const funnels = await listFunnels();

  return (
    <div>
      <PageHeader
        title={t.title}
        cta={<LinkButton href={`/${locale}/funnels/new`}>{t.newFunnel}</LinkButton>}
      />

      {funnels.length === 0 ? (
        <EmptyState
          message={t.empty}
          cta={{ label: t.newFunnel, href: `/${locale}/funnels/new` }}
          className="mt-12"
        />
      ) : (
        <div className="mt-8 space-y-3">
          {funnels.map((f) => {
            const heroTitle =
              f.content_en?.hero?.title ??
              f.content_de?.hero?.title ??
              f.content_fr?.hero?.title ??
              f.slug;
            const ctr = f.views_7d > 0 ? f.cta_clicks_7d / f.views_7d : 0;
            const statusLabel =
              f.status === "published" ? t.published : f.status === "archived" ? t.archived : t.draft;
            return (
              <Card
                key={f.id}
                padding="sm"
                className="flex flex-col gap-3 rounded-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${locale}/funnels/${f.id}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {heroTitle}
                    </Link>
                    <Badge variant={statusVariant(f.status)}>{statusLabel}</Badge>
                    <Badge variant="accent">{t.ctaType[f.cta_type]}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    /f/{f.slug} · {new Date(f.updated_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">{f.views_7d}</span>{" "}
                    {t.views7d}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{f.cta_clicks_7d}</span>{" "}
                    {t.clicks7d}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{formatPercent(ctr)}</span>{" "}
                    {t.ctr7d}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
