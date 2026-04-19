import { getCompanyInfo } from "@/actions/company-info";
import { getLegalReadiness, type PublicCompanyInfo } from "@dbc/legal";
import { Badge } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState as EmptyStateMolecule } from "@/components/empty-state";
import { CompanyInfoForm } from "./company-info-form";

const T = {
  en: {
    title: "Company Info",
    description:
      "The single source of truth for everything public-facing — footer, Impressum, privacy/terms pages, SEO defaults, social links, and brand assets.",
    empty:
      "No company info row yet. The company_info table has no row with id = 1. Seed it by running the initial Supabase migration, then refresh this page.",
    legalReadiness: "Legal readiness",
    allGood: "All fields required for Impressum, Privacy Policy, and Terms are populated.",
    missingHint:
      "The following fields are still missing. Fill them in before making legal pages public:",
  },
  de: {
    title: "Unternehmensdaten",
    description:
      "Die zentrale Datenquelle für alles, was öffentlich sichtbar ist — Footer, Impressum, Datenschutz-/AGB-Seiten, SEO-Standards, Social Links und Markenassets.",
    empty:
      "Noch keine company_info-Zeile. Die Tabelle company_info enthält keine Zeile mit id = 1. Führen Sie die initiale Supabase-Migration aus und laden Sie die Seite neu.",
    legalReadiness: "Rechtliche Bereitschaft",
    allGood: "Alle für Impressum, Datenschutz und AGB erforderlichen Felder sind ausgefüllt.",
    missingHint:
      "Folgende Felder fehlen noch. Füllen Sie sie aus, bevor die rechtlichen Seiten veröffentlicht werden:",
  },
  fr: {
    title: "Informations société",
    description:
      "La source unique de vérité pour tout ce qui est visible publiquement — pied de page, Impressum, pages confidentialité/CGU, SEO, liens sociaux et ressources de marque.",
    empty:
      "Aucune ligne company_info. La table company_info n’a pas de ligne avec id = 1. Exécutez la migration Supabase initiale puis actualisez.",
    legalReadiness: "Conformité juridique",
    allGood: "Tous les champs requis pour Impressum, Politique de confidentialité et CGU sont remplis.",
    missingHint:
      "Les champs suivants manquent encore. Complétez-les avant de publier les pages juridiques :",
  },
} as const;

export default async function CompanyInfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const info = await getCompanyInfo();

  return (
    <div>
      <PageHeader title={t.title} description={t.description} />

      <LegalReadinessWidget info={info} t={t} />

      {info ? (
        <CompanyInfoForm info={info} locale={locale} />
      ) : (
        <EmptyStateMolecule message={t.empty} className="mt-8" />
      )}
    </div>
  );
}


function LegalReadinessWidget({
  info,
  t,
}: {
  info: PublicCompanyInfo | Parameters<typeof getLegalReadiness>[0];
  t: { legalReadiness: string; allGood: string; missingHint: string };
}) {
  const { total, filled, missing } = getLegalReadiness(
    info as PublicCompanyInfo | null
  );
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const allGood = missing.length === 0;

  return (
    <div
      className={`mt-6 rounded-lg border p-4 ${
        allGood
          ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
          : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.legalReadiness}</h2>
        <Badge variant={allGood ? "success" : "warning"}>
          {filled}/{total} ({pct}%)
        </Badge>
      </div>
      {allGood ? (
        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
          {t.allGood}
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            {t.missingHint}
          </p>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {missing.map((m) => (
              <li key={m.key} className="flex items-start gap-1.5">
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <span className="font-medium">{m.label}</span>{" "}
                  <span className="text-muted-foreground">({m.why})</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
