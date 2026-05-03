"use client";

import { useState } from "react";
import { resendOrderTickets } from "@/actions/resend-confirmation";

interface Props {
  orderId: string;
  orderEmailSentAt: string | null;
  ticketCountUnsent: number;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    allSent: "Tickets emailed to each attendee.",
    someUnsent:
      "Some tickets haven't been emailed yet. You can retry now or download the PDF directly below.",
    resend: "Resend tickets to attendee emails",
    sending: "Sending…",
    sent: (n: number) =>
      n === 1 ? "1 ticket re-sent." : `${n} tickets re-sent.`,
    nothingToResend: "Nothing to resend — every ticket already shows as sent.",
    error: "Something went wrong. Please try again or contact support.",
  },
  de: {
    allSent: "Tickets wurden an alle Teilnehmer gesendet.",
    someUnsent:
      "Einige Tickets wurden noch nicht per E-Mail versendet. Sie können den Versand jetzt erneut anstoßen oder das PDF unten direkt herunterladen.",
    resend: "Tickets erneut an Teilnehmer senden",
    sending: "Wird gesendet…",
    sent: (n: number) =>
      n === 1 ? "1 Ticket erneut gesendet." : `${n} Tickets erneut gesendet.`,
    nothingToResend:
      "Es ist nichts erneut zu senden — alle Tickets sind bereits als versendet markiert.",
    error:
      "Etwas ist schiefgelaufen. Bitte erneut versuchen oder den Support kontaktieren.",
  },
  fr: {
    allSent: "Billets envoyés à chaque participant.",
    someUnsent:
      "Certains billets n'ont pas encore été envoyés par e-mail. Vous pouvez réessayer maintenant ou télécharger le PDF directement ci-dessous.",
    resend: "Renvoyer les billets aux e-mails des participants",
    sending: "Envoi en cours…",
    sent: (n: number) =>
      n === 1 ? "1 billet renvoyé." : `${n} billets renvoyés.`,
    nothingToResend:
      "Rien à renvoyer — tous les billets sont déjà marqués comme envoyés.",
    error:
      "Quelque chose s'est mal passé. Veuillez réessayer ou contacter le support.",
  },
} as const;

export function RecoveryPanel({
  orderId,
  orderEmailSentAt,
  ticketCountUnsent,
  locale,
}: Props) {
  const t = T[locale] ?? T.en;
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
      setFeedback({ kind: "ok", message: t.nothingToResend });
      return;
    }
    setFeedback({ kind: "ok", message: t.sent(result.sent ?? 0) });
  }

  return (
    <div
      className={`mt-8 rounded-xl border p-4 text-sm ${
        fullySent
          ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10"
          : "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10"
      }`}
    >
      <p className={fullySent ? "text-green-800 dark:text-green-300" : "text-yellow-900 dark:text-yellow-200"}>
        {fullySent ? t.allSent : t.someUnsent}
      </p>
      {!fullySent && (
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="mt-3 rounded-md border border-yellow-700/30 bg-white px-3 py-1.5 text-xs font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-100 dark:hover:bg-yellow-900/50"
        >
          {pending ? t.sending : t.resend}
        </button>
      )}
      {feedback && (
        <p
          className={`mt-2 text-xs ${feedback.kind === "ok" ? "text-green-800 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
