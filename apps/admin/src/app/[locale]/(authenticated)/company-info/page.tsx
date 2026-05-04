import { getTranslations } from "next-intl/server";
import { getCompanyInfo } from "@/actions/company-info";
import { getLegalReadiness, type PublicCompanyInfo } from "@dbc/legal";
import { Badge } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState as EmptyStateMolecule } from "@/components/empty-state";
import { CompanyInfoForm } from "./company-info-form";

export default async function CompanyInfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.companyInfo.page" });
  const info = await getCompanyInfo();

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <LegalReadinessWidget
        info={info}
        legalReadiness={t("legalReadiness")}
        allGoodLabel={t("allGood")}
        missingHint={t("missingHint")}
      />

      {info ? (
        <CompanyInfoForm info={info} locale={locale} />
      ) : (
        <EmptyStateMolecule message={t("empty")} className="mt-8" />
      )}
    </div>
  );
}


function LegalReadinessWidget({
  info,
  legalReadiness,
  allGoodLabel,
  missingHint,
}: {
  info: PublicCompanyInfo | Parameters<typeof getLegalReadiness>[0];
  legalReadiness: string;
  allGoodLabel: string;
  missingHint: string;
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
          ? "border-success-border bg-success-soft"
          : "border-warning-border bg-warning-soft"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{legalReadiness}</h2>
        <Badge variant={allGood ? "success" : "warning"}>
          {filled}/{total} ({pct}%)
        </Badge>
      </div>
      {allGood ? (
        <p className="mt-1 text-xs text-success">
          {allGoodLabel}
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-warning">
            {missingHint}
          </p>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {missing.map((m) => (
              <li key={m.key} className="flex items-start gap-1.5">
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-warning-strong" />
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
