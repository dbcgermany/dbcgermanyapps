import { listContactCategories } from "@/actions/newsletters";
import { PageHeader } from "@/components/page-header";
import { NewsletterComposer } from "../composer";

export default async function NewNewsletterPage() {
  const categories = await listContactCategories();
  return (
    <div>
      <PageHeader
        title="New newsletter"
        description="Save as a draft, preview the recipient count, and send when ready."
      />
      <NewsletterComposer
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name_en,
        }))}
      />
    </div>
  );
}
