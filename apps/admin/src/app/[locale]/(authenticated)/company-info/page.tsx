import { getCompanyInfo } from "@/actions/company-info";
import { getLegalReadiness, type PublicCompanyInfo } from "@dbc/legal";
import { Badge } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState as EmptyStateMolecule } from "@/components/empty-state";
import { CompanyInfoForm } from "./company-info-form";

export default async function CompanyInfoPage() {
  const info = await getCompanyInfo();

  return (
    <div>
      <PageHeader
        title="Company Info"
        description="The single source of truth for everything public-facing — footer, Impressum, privacy/terms pages, SEO defaults, social links, and brand assets."
      />

      <LegalReadinessWidget info={info} />

      {info ? (
        <CompanyInfoForm info={info} />
      ) : (
        <EmptyStateMolecule
          message="No company info row yet. The company_info table has no row with id = 1. Seed it by running the initial Supabase migration, then refresh this page."
          className="mt-8"
        />
      )}
    </div>
  );
}


function LegalReadinessWidget({
  info,
}: {
  info: PublicCompanyInfo | Parameters<typeof getLegalReadiness>[0];
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
        <h2 className="text-sm font-semibold">
          Legal readiness
        </h2>
        <Badge variant={allGood ? "success" : "warning"}>
          {filled}/{total} ({pct}%)
        </Badge>
      </div>
      {allGood ? (
        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
          All fields required for Impressum, Privacy Policy, and Terms are
          populated.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            The following fields are still missing. Fill them in before making
            legal pages public:
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
