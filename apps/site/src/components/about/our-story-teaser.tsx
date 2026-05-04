import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";

// Small teaser block mounted on /team below the intro paragraph.
// Gives the Team page an entry point into the company narrative
// without stealing focus from the member roster.
export async function OurStoryTeaser({ locale }: { locale: string }) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = await getTranslations({ locale: l, namespace: "site.about.storyTeaser" });
  return (
    <Reveal delay={120}>
      <div className="mt-10 max-w-3xl rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </p>
        <p className="mt-2 text-base leading-7 text-muted-foreground">
          {t("body")}{" "}
          <Link
            href={`/${locale}/about`}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("cta")}
            <span aria-hidden className="ml-1">
              →
            </span>
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
