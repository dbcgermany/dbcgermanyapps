import { NotFoundHero } from "@dbc/ui";
import { headers } from "next/headers";

const COPY = {
  en: {
    eyebrow: "Admin",
    title: "This page doesn't exist.",
    description:
      "The admin route you followed isn't on the map. It may have been renamed, you might not have access, or you could have pasted the wrong link.",
    dashboard: "Go to dashboard",
    back: "Back to login",
  },
  de: {
    eyebrow: "Admin",
    title: "Diese Seite existiert nicht.",
    description:
      "Die gew\u00fcnschte Admin-Seite gibt es nicht. M\u00f6glicherweise wurde sie umbenannt, Sie haben keinen Zugriff oder der Link ist falsch.",
    dashboard: "Zum Dashboard",
    back: "Zur\u00fcck zum Login",
  },
  fr: {
    eyebrow: "Admin",
    title: "Cette page n'existe pas.",
    description:
      "La page admin demand\u00e9e est introuvable. Elle a pu \u00eatre renomm\u00e9e, vous n'avez peut-\u00eatre pas les droits, ou le lien est incorrect.",
    dashboard: "Aller au tableau de bord",
    back: "Retour \u00e0 la connexion",
  },
};

export default async function NotFound() {
  // Detect locale from the URL path (middleware always prefixes it).
  const hdrs = await headers();
  const path = hdrs.get("x-invoke-path") ?? hdrs.get("referer") ?? "/en";
  const seg = path.match(/\/(en|de|fr)(?:\/|$)/)?.[1] as
    | "en"
    | "de"
    | "fr"
    | undefined;
  const locale = seg ?? "en";
  const t = COPY[locale];

  return (
    <NotFoundHero
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      actions={[
        { label: t.dashboard, href: `/${locale}/dashboard`, variant: "primary" },
        { label: t.back, href: `/${locale}/login`, variant: "secondary" },
      ]}
    />
  );
}
