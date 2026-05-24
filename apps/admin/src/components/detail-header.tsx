import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";

/**
 * Detail-page header for resources with rich metadata (contact detail,
 * news detail, event hub). Composes PageHeader with an optional
 * metadata/badge row directly underneath, so detail pages don't reach for
 * bespoke `<div className="flex items-start justify-between">` layouts.
 *
 * Usage:
 *   <DetailHeader
 *     back={{ href: `/${locale}/contacts`, label: tBack("contacts") }}
 *     title={displayName}
 *     description={contact.email}
 *     actions={<><ComposeDialog ... /><DeleteContactButton ... /></>}
 *     meta={
 *       <>
 *         {badges.map((b) => <Badge key={b}>{b}</Badge>)}
 *         <PipelineSelect ... />
 *       </>
 *     }
 *   />
 */
export function DetailHeader({
  back,
  title,
  description,
  actions,
  meta,
}: {
  back?: { href: string; label: string };
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div>
      <PageHeader
        back={back}
        title={title}
        description={description}
        cta={actions}
      />
      {meta && (
        <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>
      )}
    </div>
  );
}
