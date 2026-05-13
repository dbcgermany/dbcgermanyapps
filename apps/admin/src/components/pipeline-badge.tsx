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
 */
export function PipelineBadge({
  status,
  className,
}: {
  status: PipelineStatus | null;
  className?: string;
}) {
  const t = useTranslations("admin.contacts.pipeline");
  if (!status) {
    return (
      <span className={`text-xs text-muted-foreground ${className ?? ""}`}>
        {t("placeholder")}
      </span>
    );
  }
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {t(`statuses.${status}`)}
    </Badge>
  );
}
