import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";

/**
 * SSOT layout shell for list pages. Composes PageHeader (back + title +
 * description + actions) with consistent content + create-form spacing,
 * so every list page picks up the same paddings, the same gap above the
 * list, and the same gap above the "create new X" form below.
 *
 * Use this in place of the bespoke `<div><PageHeader ... /><div className="mt-6">...</div></div>`
 * pattern repeated in 20+ pages.
 *
 * Usage:
 *   <ListShell
 *     back={{ href: `/${locale}/events`, label: tBack("events") }}
 *     title={t("title")}
 *     description={t("description", { count })}
 *     actions={<AddButton href="..." label={t("newX")} />}
 *     createForm={<TierForm eventId={id} />}
 *   >
 *     <EditableList ...>{rows}</EditableList>
 *   </ListShell>
 */
export function ListShell({
  back,
  title,
  description,
  actions,
  children,
  createForm,
}: {
  back?: { href: string; label: string };
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  createForm?: ReactNode;
}) {
  return (
    <div>
      <PageHeader
        back={back}
        title={title}
        description={description}
        cta={actions}
      />
      <div className="mt-6">{children}</div>
      {createForm && (
        <div className="mt-8 border-t border-border pt-6">{createForm}</div>
      )}
    </div>
  );
}
