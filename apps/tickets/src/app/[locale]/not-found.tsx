import { NotFoundHero } from "@dbc/ui";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const hdrs = await headers();
  const path = hdrs.get("x-invoke-path") ?? hdrs.get("referer") ?? "/en";
  const seg = path.match(/\/(en|de|fr)(?:\/|$)/)?.[1] as
    | "en"
    | "de"
    | "fr"
    | undefined;
  const locale = seg ?? "en";
  const t = await getTranslations({ locale, namespace: "tickets.notFound" });

  return (
    <NotFoundHero
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      actions={[
        { label: t("events"), href: `/${locale}`, variant: "primary" },
        { label: t("orders"), href: `/${locale}/orders`, variant: "secondary" },
      ]}
    />
  );
}
