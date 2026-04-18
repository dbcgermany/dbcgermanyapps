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
  const [deliveryMode, setDeliveryMode] = useState<
    "ticket_only" | "ticket_with_letter"
  >("ticket_with_letter");
  const [acquisitionType, setAcquisitionType] = useState<"invited" | "assigned">(
    "invited"
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
        customBody:
          deliveryMode === "ticket_with_letter" && showCustomBody
            ? customBody
            : undefined,
        deliveryMode,
        acquisitionType,
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
      {/* Delivery mode — the core toggle */}
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Delivery
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 text-sm hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="delivery_mode"
              checked={deliveryMode === "ticket_only"}
              onChange={() => setDeliveryMode("ticket_only")}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block font-medium">Just the ticket</span>
              <span className="block text-xs text-muted-foreground">
                Informal email, ticket PDF only.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 text-sm hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="delivery_mode"
              checked={deliveryMode === "ticket_with_letter"}
              onChange={() => setDeliveryMode("ticket_with_letter")}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block font-medium">
                Ticket + formal invitation letter
              </span>
              <span className="block text-xs text-muted-foreground">
                Formal email with salutation, both PDFs attached.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* Acquisition type */}
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recipient type
        </legend>
        <div className="flex gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="acquisition_type"
              checked={acquisitionType === "invited"}
              onChange={() => setAcquisitionType("invited")}
              className="accent-primary"
            />
            Invited guest
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="acquisition_type"
              checked={acquisitionType === "assigned"}
              onChange={() => setAcquisitionType("assigned")}
              className="accent-primary"
            />
            Pre-assigned ticket
          </label>
        </div>
      </fieldset>

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
          <option value="fr">Français</option>
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

      {/* Custom body only matters in formal mode */}
      {deliveryMode === "ticket_with_letter" && (
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setShowCustomBody(!showCustomBody)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Customize invitation text</span>
            <span className="text-xs">
              {showCustomBody ? "\u25B2" : "\u25BC"}
            </span>
          </button>
          {showCustomBody && (
            <div className="border-t border-border px-4 pb-4 pt-3">
              <label className="mb-1.5 block text-sm font-medium">
                Email body text
              </label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className={`${input} min-h-48 resize-y`}
                rows={10}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Available placeholders: {"{event}"}, {"{date}"}, {"{venue}"}
              </p>
            </div>
          )}
        </div>
      )}

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
