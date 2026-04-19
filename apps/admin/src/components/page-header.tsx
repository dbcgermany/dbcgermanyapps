import type { ReactNode } from "react";
import { PageBack } from "@dbc/ui";

/**
 * SSOT page header for every admin page.
 * Renders: optional back link + H1 title + optional description + optional top-right CTA.
 *
 * Usage:
 *   <PageHeader title="Events" description="Manage events." cta={<Button>New</Button>} />
 *   <PageHeader
 *     title="New event"
 *     back={{ href: `/${locale}/events`, label: tBack("events") }}
 *   />
 *
 * The back affordance comes from the @dbc/ui PageBack atom so the
 * visual is shared with site / tickets when they adopt it.
 */
export function PageHeader({
  title,
  description,
  cta,
  back,
  className,
}: {
  title: string;
  description?: string;
  cta?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={className}>
      {back && <PageBack href={back.href} label={back.label} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
    </div>
  );
}
