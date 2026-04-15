import { getCompanyInfo } from "@/actions/company-info";
import { CompanyInfoForm } from "./company-info-form";

export default async function CompanyInfoPage() {
  const info = await getCompanyInfo();

  return (
    <div className="p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Company Info</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The single source of truth for everything public-facing — footer,
          Impressum, privacy/terms pages, SEO defaults, social links, and
          brand assets.
        </p>
      </div>

      <CompanyInfoForm info={info} />
    </div>
  );
}
