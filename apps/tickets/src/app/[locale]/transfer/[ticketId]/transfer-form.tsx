"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("tickets.transfer.form");

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

  if (success) {
    return (
      <div className="mt-6 rounded-md bg-success-soft p-6 text-center">
        <p className="text-2xl">&#x2713;</p>
        <p className="mt-2 font-medium text-success">
          {t("success")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">{t("newName")}</label>
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
          {t("newEmail")}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <p className="rounded-md bg-warning-soft p-3 text-xs text-warning">
        {t("confirmWarning")}
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t("transferring") : t("confirm")}
      </button>
    </form>
  );
}
