import { getTranslations } from "next-intl/server";
import { getSiteTestimonials } from "@/actions/site-content";
import { PageHeader } from "@/components/page-header";
import { SiteTestimonialsClient } from "./site-testimonials-client";

export default async function SiteTestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "admin.testimonials.page",
  });
  const testimonials = await getSiteTestimonials();

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SiteTestimonialsClient locale={locale} initial={testimonials} />
    </div>
  );
}
