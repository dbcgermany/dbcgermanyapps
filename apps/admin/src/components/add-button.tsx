import { Plus } from "lucide-react";
import { LinkButton } from "@dbc/ui";

/**
 * Standard "New / Add / Create X" primary CTA used in PageHeader actions.
 * Renders a primary LinkButton with a leading `+` icon so every list page
 * has the exact same Add affordance — same color, same size, same icon,
 * same position (PageHeader cta slot).
 *
 * Usage:
 *   <AddButton href={`/${locale}/events/new`} label={t("newEvent")} />
 */
export function AddButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <LinkButton href={href} variant={variant}>
      <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      {label}
    </LinkButton>
  );
}
