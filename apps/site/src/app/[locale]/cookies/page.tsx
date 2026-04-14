import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de"
        ? "Cookie-Richtlinie"
        : locale === "fr"
          ? "Politique cookies"
          : "Cookie Policy",
  };
}

type Row = {
  name: string;
  purpose: { en: string; de: string; fr: string };
  duration: string;
  category: "necessary" | "preferences" | "analytics";
};

const COOKIES: Row[] = [
  {
    name: "locale",
    purpose: {
      en: "Remembers the language you selected so you stay in the same language across visits.",
      de: "Merkt sich die gewählte Sprache, damit Sie bei jedem Besuch in derselben Sprache bleiben.",
      fr: "Mémorise la langue choisie pour que vous restiez dans la même langue à chaque visite.",
    },
    duration: "1 year",
    category: "preferences",
  },
  {
    name: "dbc-theme (localStorage)",
    purpose: {
      en: "Remembers your light / dark / auto theme choice.",
      de: "Merkt sich Ihre Auswahl für Hell / Dunkel / Auto.",
      fr: "Mémorise votre choix clair / sombre / auto.",
    },
    duration: "until manually cleared",
    category: "preferences",
  },
  {
    name: "sb-<project>-auth-token",
    purpose: {
      en: "Supabase authentication — keeps you logged in after a magic link or password sign-in.",
      de: "Supabase-Authentifizierung — hält Sie nach einem Magic Link oder Passwort-Login eingeloggt.",
      fr: "Authentification Supabase — vous maintient connecté après un magic link ou un login.",
    },
    duration: "1 hour (access) + 60 days (refresh)",
    category: "necessary",
  },
  {
    name: "cookie-consent",
    purpose: {
      en: "Records your response to the cookie banner.",
      de: "Speichert Ihre Antwort auf das Cookie-Banner.",
      fr: "Enregistre votre réponse à la bannière cookies.",
    },
    duration: "1 year",
    category: "necessary",
  },
];

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const copy = {
    title: {
      en: "Cookie Policy",
      de: "Cookie-Richtlinie",
      fr: "Politique cookies",
    }[l],
    intro: {
      en: "This policy explains what cookies and local-storage items we set on dbc-germany.com and ticket.dbc-germany.com. We do not set third-party analytics or advertising cookies.",
      de: "Diese Richtlinie erläutert, welche Cookies und Local-Storage-Einträge wir auf dbc-germany.com und ticket.dbc-germany.com setzen. Wir setzen keine Drittanbieter-Analyse- oder Werbecookies.",
      fr: "Cette politique explique quels cookies et éléments localStorage nous utilisons sur dbc-germany.com et ticket.dbc-germany.com. Nous ne posons aucun cookie d'analyse ou de publicité tiers.",
    }[l],
    categoryNecessary: {
      en: "Necessary",
      de: "Notwendig",
      fr: "Nécessaires",
    }[l],
    categoryPreferences: {
      en: "Preferences",
      de: "Einstellungen",
      fr: "Préférences",
    }[l],
    categoryAnalytics: {
      en: "Analytics",
      de: "Analyse",
      fr: "Analyse",
    }[l],
    analyticsNote: {
      en: "We do not currently load analytics scripts. If this changes, this page and the cookie banner will be updated before any new cookie is set.",
      de: "Wir laden derzeit keine Analyseskripte. Sollte sich das ändern, werden diese Seite und das Cookie-Banner aktualisiert, bevor neue Cookies gesetzt werden.",
      fr: "Nous ne chargeons actuellement aucun script d'analyse. En cas de changement, cette page et la bannière seront mises à jour avant toute nouvelle pose de cookie.",
    }[l],
    name: { en: "Name", de: "Name", fr: "Nom" }[l],
    purpose: { en: "Purpose", de: "Zweck", fr: "Finalité" }[l],
    duration: {
      en: "Duration",
      de: "Dauer",
      fr: "Durée",
    }[l],
    manage: {
      en: "How to manage",
      de: "Verwaltung",
      fr: "Gestion",
    }[l],
    manageBody: {
      en: "All modern browsers let you inspect and delete cookies from the site address bar. Clearing localStorage is done from your browser's developer tools (Application → Local storage). Rejecting non-essential cookies in the banner prevents us from storing preference cookies, but necessary cookies remain active.",
      de: "Jeder moderne Browser erlaubt es, Cookies über die Adressleiste zu prüfen und zu löschen. Local-Storage-Einträge löschen Sie über die Entwicklertools Ihres Browsers (Anwendung → Local Storage). Durch Ablehnen nicht notwendiger Cookies im Banner verhindern Sie die Speicherung von Einstellungs-Cookies; notwendige Cookies bleiben aktiv.",
      fr: "Les navigateurs modernes permettent d'inspecter et de supprimer les cookies depuis la barre d'adresse. Pour le localStorage, utilisez les outils de développement (Application → Local storage). Refuser les cookies non essentiels empêche la pose des cookies de préférence ; les cookies nécessaires restent actifs.",
    }[l],
  };

  function catLabel(cat: Row["category"]) {
    if (cat === "necessary") return copy.categoryNecessary;
    if (cat === "preferences") return copy.categoryPreferences;
    return copy.categoryAnalytics;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        {copy.intro}
      </p>

      <div className="mt-12 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{copy.name}</th>
              <th className="px-4 py-3">{copy.purpose}</th>
              <th className="px-4 py-3">{copy.duration}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COOKIES.map((c) => (
              <tr key={c.name}>
                <td className="px-4 py-4 align-top">
                  <p className="font-mono text-xs font-semibold">{c.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {catLabel(c.category)}
                  </p>
                </td>
                <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                  {c.purpose[l]}
                </td>
                <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                  {c.duration}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-bold">
          {copy.categoryAnalytics}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.analyticsNote}</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-bold">{copy.manage}</h2>
        <p className="text-sm text-muted-foreground">{copy.manageBody}</p>
      </section>
    </div>
  );
}
