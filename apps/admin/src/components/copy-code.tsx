"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { cn } from "@dbc/ui";
import { toast } from "sonner";

/**
 * CopyCode — the canonical click-to-copy display for any short code, token,
 * or identifier shown to operators (coupon codes, team-friend invite codes,
 * affiliate codes, …). Clicking the value writes it to the clipboard and
 * shows a toast; a copy glyph appears on hover and flips to a check on
 * success.
 *
 * Use this instead of hand-rolling `navigator.clipboard.writeText` + toast
 * per page. Pass `className` to match the surrounding type scale (e.g.
 * `text-xs`); the monospace family and hover colour are baked in.
 */
export function CopyCode({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("copiedToast"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copyFailedToast"));
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={t("clickToCopy")}
      aria-label={`${t("clickToCopy")}: ${value}`}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 align-baseline font-mono hover:text-primary",
        className
      )}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check
          className="h-3.5 w-3.5 shrink-0 text-success"
          strokeWidth={2}
          aria-hidden
        />
      ) : (
        <Copy
          className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-50"
          strokeWidth={1.75}
          aria-hidden
        />
      )}
    </button>
  );
}
