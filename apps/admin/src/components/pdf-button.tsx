import { Download } from "lucide-react";
import { LinkButton } from "@dbc/ui";

/**
 * Standard "Download PDF" secondary CTA used in PageHeader actions.
 * Replaces the 4+ hand-rolled `<a>` styles that previously decorated
 * /catering, /questions, /runsheet, /budget, /ticket-preview. One look,
 * one position, one download affordance across every page.
 *
 * Usage:
 *   <PdfButton href={`/api/runsheet/${eventId}?locale=${locale}`} label={t("downloadPdf")} />
 */
export function PdfButton({
  href,
  label,
  variant = "secondary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <LinkButton
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
    >
      <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      {label}
    </LinkButton>
  );
}
