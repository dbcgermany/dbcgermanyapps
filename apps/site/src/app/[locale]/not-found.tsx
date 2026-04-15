import { NotFoundHero } from "@dbc/ui";
import { headers } from "next/headers";

const COPY = {
  en: {
    eyebrow: "Lost the trail",
    title: "We can't find that page.",
    description:
      "The page you're after may have moved, been archived, or never existed. Here's where to go next.",
    home: "Home",
    events: "Events",
    contact: "Contact us",
  },
  de: {
    eyebrow: "Spur verloren",
    title: "Wir finden diese Seite nicht.",
    description:
      "Die gesuchte Seite wurde m\u00f6glicherweise verschoben, archiviert oder hat nie existiert. Hier geht es weiter.",
    home: "Startseite",
    events: "Veranstaltungen",
    contact: "Kontakt",
  },
  fr: {
    eyebrow: "Piste perdue",
    title: "Nous ne trouvons pas cette page.",
    description:
      "La page recherch\u00e9e a peut-\u00eatre \u00e9t\u00e9 d\u00e9plac\u00e9e, archiv\u00e9e, ou n'a jamais exist\u00e9. Reprenez ici.",
    home: "Accueil",
    events: "\u00c9v\u00e9nements",
    contact: "Nous contacter",
  },
};

export default async function NotFound() {
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
        { label: t.home, href: `/${locale}`, variant: "primary" },
        { label: t.events, href: `/${locale}/events`, variant: "secondary" },
        { label: t.contact, href: `/${locale}/contact`, variant: "ghost" },
      ]}
    />
  );
}
