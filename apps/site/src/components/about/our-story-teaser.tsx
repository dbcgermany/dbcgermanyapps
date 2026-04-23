import Link from "next/link";
import { Reveal } from "@dbc/ui";

// Small teaser block mounted on /team below the intro paragraph.
// Gives the Team page an entry point into the company narrative
// without stealing focus from the member roster. Content is in this
// file (not i18n JSON) because the copy is tightly coupled to the
// composition — one paragraph + one inline CTA.
const COPY = {
  en: {
    eyebrow: "Our story",
    body: "Behind every face above is the company story that brought them here — the mission, the years across Lubumbashi, Düsseldorf, and Paris, and the operators who bet on it before anyone else.",
    cta: "Read how DBC Germany came to be",
  },
  de: {
    eyebrow: "Unsere Geschichte",
    body: "Hinter jedem Gesicht hier oben steht die Firmengeschichte, die sie hergebracht hat — die Mission, die Jahre zwischen Lubumbashi, Düsseldorf und Paris, und die Operator:innen, die vor allen anderen daran geglaubt haben.",
    cta: "So ist DBC Germany entstanden",
  },
  fr: {
    eyebrow: "Notre histoire",
    body: "Derrière chaque visage ci-dessus, il y a l'histoire d'entreprise qui les a amenés ici — la mission, les années entre Lubumbashi, Düsseldorf et Paris, et les opérateurs·trices qui y ont cru avant tout le monde.",
    cta: "Découvrir comment DBC Germany est né",
  },
} as const;

export function OurStoryTeaser({ locale }: { locale: string }) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = COPY[l];
  return (
    <Reveal delay={120}>
      <div className="mt-10 max-w-3xl rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t.eyebrow}
        </p>
        <p className="mt-2 text-base leading-7 text-muted-foreground">
          {t.body}{" "}
          <Link
            href={`/${locale}/about`}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t.cta}
            <span aria-hidden className="ml-1">
              →
            </span>
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
