import type { ReactNode } from "react";

/**
 * SSOT page header for every admin page.
 * Renders: H1 title + optional description + optional top-right CTA.
 *
 * Usage:
 *   <PageHeader title="Events" description="Manage events." cta={<Button>New</Button>} />
 */
export function PageHeader({
  title,
  description,
  cta,
  className,
}: {
  title: string;
  description?: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className ?? ""}`}>
      <div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}
