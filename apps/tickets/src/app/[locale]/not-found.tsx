import { NotFoundHero } from "@dbc/ui";
import { headers } from "next/headers";

const COPY = {
  en: {
    eyebrow: "Not found",
    title: "We can't find that ticket page.",
    description:
      "The event or order you're looking for may have ended, been moved, or the link may have expired. You can still browse the active events.",
    events: "Browse events",
    orders: "My orders",
  },
  de: {
    eyebrow: "Nicht gefunden",
    title: "Diese Ticketseite existiert nicht.",
    description:
      "Die gesuchte Veranstaltung oder Bestellung ist vorbei, wurde verschoben, oder der Link ist abgelaufen. Hier finden Sie die aktiven Veranstaltungen.",
    events: "Veranstaltungen ansehen",
    orders: "Meine Bestellungen",
  },
  fr: {
    eyebrow: "Introuvable",
    title: "Cette page billetterie est introuvable.",
    description:
      "L'\u00e9v\u00e9nement ou la commande est peut-\u00eatre termin\u00e9\u00b7e, d\u00e9plac\u00e9\u00b7e, ou le lien a expir\u00e9. Parcourez les \u00e9v\u00e9nements actifs ici.",
    events: "Voir les \u00e9v\u00e9nements",
    orders: "Mes commandes",
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
        { label: t.events, href: `/${locale}`, variant: "primary" },
        { label: t.orders, href: `/${locale}/orders`, variant: "secondary" },
      ]}
    />
  );
}
