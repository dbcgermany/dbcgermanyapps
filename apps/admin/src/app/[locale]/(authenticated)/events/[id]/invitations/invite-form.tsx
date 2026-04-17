"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { createInvitation } from "@/actions/invitations";

const DEFAULT_INVITATION_BODY: Record<string, string> = {
  en: "We are pleased to invite you to {event} on {date} at {venue}.\n\nYour complimentary ticket is attached to this email as a PDF. Please present the QR code at the entrance for check-in.\n\nWe look forward to welcoming you.",
  de: "Wir freuen uns, Sie zu {event} am {date} in {venue} einladen zu dürfen.\n\nIhr persönliches Ticket liegt dieser E-Mail als PDF bei. Bitte zeigen Sie den QR-Code am Eingang vor.\n\nWir freuen uns auf Ihren Besuch.",
  fr: "Nous avons le plaisir de vous inviter à {event} le {date} à {venue}.\n\nVotre billet est joint à cet e-mail au format PDF. Veuillez présenter le code QR à l'entrée.\n\nNous nous réjouissons de vous accueillir.",
};

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
  const [gender, setGender] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [inviteLocale, setInviteLocale] = useState(
    locale === "de" || locale === "fr" ? locale : "en"
  );
  const [showCustomBody, setShowCustomBody] = useState(false);
  const [customBody, setCustomBody] = useState(
    DEFAULT_INVITATION_BODY[inviteLocale] ?? DEFAULT_INVITATION_BODY.en
  );
  const [isPending, startTransition] = useTransition();

  // Update default body text when locale changes (only if user hasn't customised)
  useEffect(() => {
    if (!showCustomBody) {
      setCustomBody( // eslint-disable-line react-hooks/set-state-in-effect
        DEFAULT_INVITATION_BODY[inviteLocale] ?? DEFAULT_INVITATION_BODY.en
      );
    }
  }, [inviteLocale, showCustomBody]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tierId) {
      toast.error("Pick a tier.");
      return;
    }
    const effectiveTitle = title === "custom" ? customTitle : title;
    startTransition(async () => {
      const result = await createInvitation({
        eventId,
        tierId,
        firstName,
        lastName,
        email,
        note,
        locale: inviteLocale,
        gender: gender || undefined,
        title: effectiveTitle || undefined,
        customBody: showCustomBody ? customBody : undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Invitation sent to ${email}.`);
        setFirstName("");
        setLastName("");
        setEmail("");
        setNote("");
        setGender("");
        setTitle("");
        setCustomTitle("");
        setShowCustomBody(false);
        setCustomBody(
          DEFAULT_INVITATION_BODY[inviteLocale] ?? DEFAULT_INVITATION_BODY.en
        );
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

      {/* Gender + Title row */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Gender</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={input}
          >
            <option value="">-- Select --</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="diverse">Diverse</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Title (optional)
          </span>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={input}
          >
            <option value="">None</option>
            <option value="mr">Mr.</option>
            <option value="mrs">Mrs.</option>
            <option value="ms">Ms.</option>
            <option value="dr">Dr.</option>
            <option value="prof">Prof.</option>
            <option value="custom">Custom...</option>
          </select>
        </label>
      </div>

      {/* Custom title input */}
      {title === "custom" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Custom title</span>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className={input}
            placeholder="e.g. HRH, Amb., etc."
          />
        </label>
      )}

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

      {/* Locale selector */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Invitation language
        </span>
        <select
          value={inviteLocale}
          onChange={(e) => setInviteLocale(e.target.value)}
          className={input}
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Fran\u00E7ais</option>
        </select>
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

      {/* Collapsible custom body section */}
      <div className="rounded-md border border-border">
        <button
          type="button"
          onClick={() => setShowCustomBody(!showCustomBody)}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span>Customize invitation text</span>
          <span className="text-xs">{showCustomBody ? "\u25B2" : "\u25BC"}</span>
        </button>
        {showCustomBody && (
          <div className="border-t border-border px-3 pb-3 pt-2">
            <textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              className={`${input} min-h-30 resize-y`}
              rows={6}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Available placeholders: {"{event}"}, {"{date}"}, {"{venue}"}
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !tierId}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? "Sending\u2026" : "Send invitation"}
      </button>
    </form>
  );
}
