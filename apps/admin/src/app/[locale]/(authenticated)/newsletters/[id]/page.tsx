import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getNewsletter,
  listContactCategories,
} from "@/actions/newsletters";
import { NewsletterComposer } from "../composer";

export default async function NewsletterEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [nl, categories] = await Promise.all([
    getNewsletter(id),
    listContactCategories(),
  ]);
  if (!nl) notFound();

  return (
    <div>
      <Link
        href={`/${locale}/newsletters`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All newsletters
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-bold">
        {nl.subject || "(untitled)"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Status: {nl.status}</p>

      <NewsletterComposer
        categories={categories.map((c) => ({ slug: c.slug, name: c.name_en }))}
        initial={{
          id: nl.id,
          subject: nl.subject ?? "",
          preheader: nl.preheader ?? "",
          body_mdx: nl.body_mdx ?? "",
          from_name: nl.from_name ?? "DBC Germany",
          from_email: nl.from_email ?? "newsletter@dbc-germany.com",
          reply_to: nl.reply_to ?? "",
          locale: nl.locale ?? "en",
          target_category_slugs: nl.target_category_slugs ?? [],
          exclude_category_slugs: nl.exclude_category_slugs ?? [],
        }}
        readOnly={nl.status !== "draft"}
      />
    </div>
  );
}
