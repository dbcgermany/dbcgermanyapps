import type { LegalLocale } from "./types";

const BACK_LABEL: Record<LegalLocale, string> = {
  en: "Back to home",
  de: "Zur Startseite",
  fr: "Retour à l'accueil",
};

export function LegalPageShell({
  locale,
  homeHref,
  children,
}: {
  locale: LegalLocale;
  homeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[60vh] bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <nav className="mb-8">
          <a
            href={homeHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span aria-hidden="true">&larr;</span> {BACK_LABEL[locale]}
          </a>
        </nav>

        <div className="legal-prose prose prose-neutral dark:prose-invert prose-headings:font-heading prose-headings:tracking-tight prose-h1:text-3xl prose-h1:sm:text-4xl prose-h1:font-bold prose-h1:text-foreground prose-h2:mt-10 prose-h2:text-xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h3:text-base prose-h3:font-semibold prose-p:leading-7 prose-p:text-foreground/85 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-td:py-2 prose-li:text-foreground/85 prose-hr:border-border max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
