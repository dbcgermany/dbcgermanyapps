"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transferTicket } from "@/actions/transfer";

export function TransferForm({
  ticketId,
  locale,
}: {
  ticketId: string;
  locale: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await transferTicket({
        ticketId,
        newAttendeeName: name,
        newAttendeeEmail: email,
        locale,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Return to orders after a short delay
        setTimeout(() => router.push(`/${locale}/orders`), 2000);
      }
    });
  }

  const t = {
    en: {
      newName: "New attendee name",
      newEmail: "New attendee email",
      confirm: "Transfer ticket",
      transferring: "Transferring...",
      success: "Ticket transferred. A new PDF has been sent to the new attendee.",
      confirmWarning: "This action cannot be undone. The current QR code will stop working immediately.",
    },
    de: {
      newName: "Name des neuen Teilnehmers",
      newEmail: "E-Mail des neuen Teilnehmers",
      confirm: "Ticket \u00FCbertragen",
      transferring: "Wird \u00FCbertragen...",
      success: "Ticket \u00FCbertragen. Ein neues PDF wurde an den neuen Teilnehmer gesendet.",
      confirmWarning: "Diese Aktion kann nicht r\u00FCckg\u00E4ngig gemacht werden. Der aktuelle QR-Code wird sofort ung\u00FCltig.",
    },
    fr: {
      newName: "Nom du nouveau participant",
      newEmail: "E-mail du nouveau participant",
      confirm: "Transf\u00E9rer le billet",
      transferring: "Transfert en cours...",
      success: "Billet transf\u00E9r\u00E9. Un nouveau PDF a \u00E9t\u00E9 envoy\u00E9 au nouveau participant.",
      confirmWarning: "Cette action est irr\u00E9versible. Le code QR actuel cessera imm\u00E9diatement de fonctionner.",
    },
  }[locale] ?? { newName: "Name", newEmail: "Email", confirm: "Transfer", transferring: "...", success: "Done", confirmWarning: "" };

  if (success) {
    return (
      <div className="mt-6 rounded-md bg-green-50 p-6 text-center dark:bg-green-900/20">
        <p className="text-2xl">&#x2713;</p>
        <p className="mt-2 font-medium text-green-700 dark:text-green-400">
          {t.success}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">{t.newName}</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t.newEmail}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <p className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        {t.confirmWarning}
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.transferring : t.confirm}
      </button>
    </form>
  );
}
