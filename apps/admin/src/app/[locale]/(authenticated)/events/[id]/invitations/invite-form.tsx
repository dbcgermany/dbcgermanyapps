"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createInvitation } from "@/actions/invitations";

export function InviteForm({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: { id: string; name: string; remaining: number | null }[];
}) {
  const [tierId, setTierId] = useState(tiers[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tierId) {
      toast.error("Pick a tier.");
      return;
    }
    startTransition(async () => {
      const result = await createInvitation({
        eventId,
        tierId,
        firstName,
        lastName,
        email,
        note,
        locale,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Invitation sent to ${email}.`);
        setFirstName("");
        setLastName("");
        setEmail("");
        setNote("");
      }
    });
  }

  const input =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Tier</span>
        <select
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className={input}
        >
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.remaining !== null ? ` (${t.remaining} left)` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">First name</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={input}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Last name</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={input}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Internal note (optional)
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={input}
          placeholder="Why this person is invited — for the audit log"
        />
      </label>
      <button
        type="submit"
        disabled={isPending || !tierId}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send invitation"}
      </button>
    </form>
  );
}
