import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "@dbc/ui";
import type { PipelineStatus } from "@dbc/types";

const VARIANT: Record<PipelineStatus, NonNullable<BadgeProps["variant"]>> = {
  new: "default",
  engaged: "success",
  considering: "warning",
  declined: "error",
};

/**
 * Colour-coded pipeline-status pill. Labels come from i18n
 * (admin.contacts.pipeline.statuses.*) — never hardcoded.
 *
 * A null status (no `contact_user_state` row yet for this operator) is
 * rendered identically to "new" — every contact starts in the pipeline
 * the moment it lands in the CRM, and the operator promotes it to
 * engaged / considering / declined once they touch it.
 */
export function PipelineBadge({
  status,
  className,
}: {
  status: PipelineStatus | null;
  className?: string;
}) {
  const t = useTranslations("admin.contacts.pipeline");
  const effective: PipelineStatus = status ?? "new";
  return (
    <Badge variant={VARIANT[effective]} className={className}>
      {t(`statuses.${effective}`)}
    </Badge>
  );
}
