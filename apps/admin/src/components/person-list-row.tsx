// PersonListRow has been merged into AdminListRow (inline-edit-row.tsx).
// This file remains as a thin alias so existing imports keep compiling.
// New code: import { AdminListRow } from "@/components/inline-edit-row".

import type { ReactNode } from "react";
import {
  AdminListRow,
  type AdminListRowAvatar,
} from "./inline-edit-row";

/** @deprecated Use AdminListRow with `avatar` + `titleHref` directly. */
export interface PersonListRowProps {
  id: string;
  dragHandle?: ReactNode;
  photoUrl: string | null;
  initialsName: string;
  name: string;
  nameHref?: string;
  badges?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  outerRef?: (node: HTMLElement | null) => void;
  outerStyle?: React.CSSProperties;
}

/**
 * @deprecated Thin alias for AdminListRow. Pass `avatar` + `titleHref` +
 * `detailHref` (or `inlineEdit`) on AdminListRow directly in new code.
 */
export function PersonListRow({
  dragHandle,
  photoUrl,
  initialsName,
  name,
  nameHref,
  badges,
  subtitle,
  actions,
  footer,
  outerRef,
  outerStyle,
}: PersonListRowProps) {
  const avatar: AdminListRowAvatar = { photoUrl, initialsName };
  return (
    <AdminListRow
      title={name}
      titleHref={nameHref}
      avatar={avatar}
      badges={badges}
      subtitle={subtitle}
      dragHandle={dragHandle}
      actions={actions}
      footer={footer}
      outerRef={outerRef}
      outerStyle={outerStyle}
    />
  );
}
