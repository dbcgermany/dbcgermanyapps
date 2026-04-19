"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  BirthdayField,
  CountrySelect,
  TITLE_VALUES,
  TitleGenderFields,
  type Gender,
  type Title,
} from "@dbc/ui";
import { createInvitation } from "@/actions/invitations";

const DEFAULT_INVITATION_BODY: Record<string, string> = {
  en: "We are pleased to invite you to {event} on {date} at {venue}.\n\nYour complimentary ticket is attached to this email as a PDF. Please present the QR code at the entrance for check-in.\n\nWe look forward to welcoming you.",
  de: "Wir freuen uns, Sie zu {event} am {date} in {venue} einladen zu dürfen.\n\nIhr persönliches Ticket liegt dieser E-Mail als PDF bei. Bitte zeigen Sie den QR-Code am Eingang vor.\n\nWir freuen uns auf Ihren Besuch.",
  fr: "Nous avons le plaisir de vous inviter à {event} le {date} à {venue}.\n\nVotre billet est joint à cet e-mail au format PDF. Veuillez présenter le code QR à l'entrée.\n\nNous nous réjouissons de vous accueillir.",
};

const T = {
  en: {
    pickTier: "Pick a tier.",
    sent: "Invitation sent to {email}.",
    delivery: "Delivery",
    justTicket: "Just the ticket",
    justTicketDesc: "Informal email, ticket PDF only.",
    ticketWithLetter: "Ticket + formal invitation letter",
    ticketWithLetterDesc: "Formal email with salutation, both PDFs attached.",
    recipientType: "Recipient type",
    invitedGuest: "Invited guest",
    preAssigned: "Pre-assigned ticket",
    tier: "Tier", left: "left",
    gender: "Gender", select: "-- Select --",
    female: "Female", male: "Male", diverse: "Diverse",
    titleOpt: "Title (optional)", none: "None",
    mr: "Mr.", mrs: "Mrs.", ms: "Ms.", dr: "Dr.", prof: "Prof.", custom: "Custom…",
    customTitle: "Custom title", customTitlePh: "e.g. HRH, Amb., etc.",
    firstName: "First name", lastName: "Last name", email: "Email",
    inviteLang: "Invitation language",
    internalNote: "Internal note (optional)",
    notePh: "Why this person is invited — for the audit log",
    customize: "Customize invitation text", bodyLabel: "Email body text",
    placeholdersHint: "Available placeholders: {event}, {date}, {venue}",
    sending: "Sending…", sendInvitation: "Send invitation",
  },
  de: {
    pickTier: "Kategorie auswählen.",
    sent: "Einladung gesendet an {email}.",
    delivery: "Versand",
    justTicket: "Nur das Ticket",
    justTicketDesc: "Informelle E-Mail, nur Ticket-PDF.",
    ticketWithLetter: "Ticket + formeller Einladungsbrief",
    ticketWithLetterDesc: "Formelle E-Mail mit Anrede, beide PDFs angehängt.",
    recipientType: "Empfängertyp",
    invitedGuest: "Eingeladener Gast",
    preAssigned: "Vorab zugewiesenes Ticket",
    tier: "Kategorie", left: "übrig",
    gender: "Geschlecht", select: "-- Auswählen --",
    female: "Weiblich", male: "Männlich", diverse: "Divers",
    titleOpt: "Titel (optional)", none: "Keiner",
    mr: "Herr", mrs: "Frau", ms: "Frau", dr: "Dr.", prof: "Prof.", custom: "Individuell…",
    customTitle: "Individueller Titel", customTitlePh: "z. B. HRH, Botschafter usw.",
    firstName: "Vorname", lastName: "Nachname", email: "E-Mail",
    inviteLang: "Sprache der Einladung",
    internalNote: "Interne Notiz (optional)",
    notePh: "Warum diese Person eingeladen wird — fürs Audit-Log",
    customize: "Einladungstext anpassen", bodyLabel: "E-Mail-Text",
    placeholdersHint: "Verfügbare Platzhalter: {event}, {date}, {venue}",
    sending: "Wird gesendet…", sendInvitation: "Einladung senden",
  },
  fr: {
    pickTier: "Sélectionnez une catégorie.",
    sent: "Invitation envoyée à {email}.",
    delivery: "Envoi",
    justTicket: "Uniquement le billet",
    justTicketDesc: "E-mail informel, uniquement le PDF du billet.",
    ticketWithLetter: "Billet + lettre d’invitation formelle",
    ticketWithLetterDesc: "E-mail formel avec salutation, les deux PDF joints.",
    recipientType: "Type de destinataire",
    invitedGuest: "Invité",
    preAssigned: "Billet pré-attribué",
    tier: "Catégorie", left: "restants",
    gender: "Genre", select: "-- Sélectionner --",
    female: "Femme", male: "Homme", diverse: "Divers",
    titleOpt: "Titre (optionnel)", none: "Aucun",
    mr: "M.", mrs: "Mme", ms: "Mme", dr: "Dr.", prof: "Pr.", custom: "Personnalisé…",
    customTitle: "Titre personnalisé", customTitlePh: "ex. HRH, Amb., etc.",
    firstName: "Prénom", lastName: "Nom", email: "E-mail",
    inviteLang: "Langue de l’invitation",
    internalNote: "Note interne (optionnelle)",
    notePh: "Pourquoi cette personne est invitée — pour le journal d’audit",
    customize: "Personnaliser le texte", bodyLabel: "Corps de l’e-mail",
    placeholdersHint: "Variables disponibles : {event}, {date}, {venue}",
    sending: "Envoi…", sendInvitation: "Envoyer l’invitation",
  },
} as const;

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
  const [gender, setGender] = useState<Gender | "">("");
  const [title, setTitle] = useState<Title | "">("");
  const [birthday, setBirthday] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const tPerson = useTranslations("person");
  const titleLabels = Object.fromEntries(
    TITLE_VALUES.map((v) => [
      v,
      tPerson(
        `title${v.charAt(0).toUpperCase() + v.slice(1)}` as
          | "titleMr"
          | "titleMs"
          | "titleMrs"
          | "titleMx"
          | "titleDr"
          | "titleProf"
          | "titleExcellency"
          | "titleHonourable"
          | "titleRev"
      ),
    ])
  ) as Record<Title, string>;
  const genderLabels: Record<Gender, string> = {
    female: tPerson("genderFemale"),
    male: tPerson("genderMale"),
    non_binary: tPerson("genderNonBinary"),
    prefer_not_to_say: tPerson("genderPreferNotToSay"),
  };
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
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

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
      toast.error(t.pickTier);
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
        locale: inviteLocale,
        gender: gender || undefined,
        title: title || undefined,
        birthday: birthday || null,
        country: country || null,
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
        toast.success(t.sent.replace("{email}", email));
        setFirstName("");
        setLastName("");
        setEmail("");
        setNote("");
        setGender("");
        setTitle("");
        setBirthday("");
        setCountry("");
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
          {t.delivery}
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
              <span className="block font-medium">{t.justTicket}</span>
              <span className="block text-xs text-muted-foreground">
                {t.justTicketDesc}
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
                {t.ticketWithLetter}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t.ticketWithLetterDesc}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* Acquisition type */}
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.recipientType}
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
            {t.invitedGuest}
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="acquisition_type"
              checked={acquisitionType === "assigned"}
              onChange={() => setAcquisitionType("assigned")}
              className="accent-primary"
            />
            {t.preAssigned}
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.tier}</span>
        <select
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className={input}
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name}
              {tier.remaining !== null ? ` (${tier.remaining} ${t.left})` : ""}
            </option>
          ))}
        </select>
      </label>

      {/* Title + Gender (coupled for Mr/Ms/Mrs) */}
      <TitleGenderFields
        title={title}
        gender={gender}
        onTitleChange={setTitle}
        onGenderChange={setGender}
        titleLabel={tPerson("title")}
        genderLabel={tPerson("gender")}
        titleOptionLabels={titleLabels}
        genderOptionLabels={genderLabels}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tPerson("firstName")}</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={input}
            autoComplete="given-name"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tPerson("lastName")}</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={input}
            autoComplete="family-name"
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BirthdayField
          value={birthday}
          onChange={(iso) => setBirthday(iso ?? "")}
          label={tPerson("birthday")}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{tPerson("country")}</span>
          <CountrySelect
            locale={locale}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.email}</span>
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
          {t.inviteLang}
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
          {t.internalNote}
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={input}
          placeholder={t.notePh}
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
            <span>{t.customize}</span>
            <span className="text-xs">
              {showCustomBody ? "\u25B2" : "\u25BC"}
            </span>
          </button>
          {showCustomBody && (
            <div className="border-t border-border px-4 pb-4 pt-3">
              <label className="mb-1.5 block text-sm font-medium">
                {t.bodyLabel}
              </label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className={`${input} min-h-48 resize-y`}
                rows={10}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {t.placeholdersHint}
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
        {isPending ? t.sending : t.sendInvitation}
      </button>
    </form>
  );
}
