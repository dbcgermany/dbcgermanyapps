import { listContactCategories } from "@/actions/newsletters";
import { NewsletterComposer } from "../composer";

export default async function NewNewsletterPage() {
  const categories = await listContactCategories();
  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-bold">New newsletter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save as a draft, preview the recipient count, and send when ready.
      </p>
      <NewsletterComposer
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name_en,
        }))}
      />
    </div>
  );
}
