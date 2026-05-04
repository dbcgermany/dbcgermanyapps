"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { resendOrderTickets } from "@/actions/resend-confirmation";

interface Props {
  orderId: string;
  orderEmailSentAt: string | null;
  ticketCountUnsent: number;
  locale: "en" | "de" | "fr";
}

export function RecoveryPanel({
  orderId,
  orderEmailSentAt,
  ticketCountUnsent,
  locale: _locale,
}: Props) {
  const t = useTranslations("tickets.confirmation.recovery");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  const fullySent = orderEmailSentAt && ticketCountUnsent === 0;

  async function handleClick() {
    setPending(true);
    setFeedback(null);
    const result = await resendOrderTickets(orderId);
    setPending(false);
    if (result.error) {
      setFeedback({ kind: "err", message: result.error });
      return;
    }
    if ((result.sent ?? 0) === 0) {
      setFeedback({ kind: "ok", message: t("nothingToResend") });
      return;
    }
    setFeedback({
      kind: "ok",
      message: t("sent", { count: result.sent ?? 0 }),
    });
  }

  return (
    <div
      className={`mt-8 rounded-xl border p-4 text-sm ${
        fullySent
          ? "border-success-border bg-success-soft"
          : "border-warning-border bg-warning-soft"
      }`}
    >
      <p className={fullySent ? "text-success" : "text-warning"}>
        {fullySent ? t("allSent") : t("someUnsent")}
      </p>
      {!fullySent && (
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="mt-3 rounded-md border border-warning-border bg-background px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning-soft disabled:opacity-50"
        >
          {pending ? t("sending") : t("resend")}
        </button>
      )}
      {feedback && (
        <p
          className={`mt-2 text-xs ${feedback.kind === "ok" ? "text-success" : "text-danger"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
