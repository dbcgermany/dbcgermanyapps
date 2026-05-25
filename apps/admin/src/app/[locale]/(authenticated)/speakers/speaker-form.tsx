"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AssetUpload, Button, Input, NameFields, Select, Textarea } from "@dbc/ui";
import {
  createSpeaker,
  updateSpeaker,
  uploadSpeakerPhoto,
  type LinkedTeamMemberPreview,
  type Speaker,
} from "@/actions/speakers";

type Mode = "create" | "edit";

type FormState = { error?: string; success?: boolean } | null;

const T = {
  en: {
    photoUploaded: "Photo uploaded.",
    saved: "Saved.",
    slug: "URL slug",
    slugHelp: "Shown in public profile URLs. Leave unchanged to keep the current one.",
    email: "Email",
    linkedin: "LinkedIn URL",
    twitter: "Twitter URL",
    website: "Website URL",
    sortOrder: "Sort order (within event)",
    visibility: "Visibility",
    visPublic: "Public (shown on event funnel pages)",
    visInternal: "Internal (admin-only preview)",
    visHidden: "Hidden (archived)",
    linkedTeam: "Linked team member",
    linkedNone: "None (external speaker)",
    linkedHint:
      "If this speaker is also on the DBC Germany team, link them. Bio, photo, role, email and LinkedIn are inherited from the team profile when the fields below are blank.",
    linkBannerTitle: "Linked to team profile",
    linkBannerBody:
      "When the corresponding speaker fields below are blank, the public funnel page falls back to this team member's bio, photo, role, email and LinkedIn. Override per-event by filling them in.",
    linkBannerEdit: "Edit team profile →",
    photo: "Photo",
    photoHint: "JPG / PNG / WebP up to 5 MB. Square crops look best.",
    photoInherits: "Inherits from team profile when left blank.",
    orPasteUrl: "Or paste a CDN URL",
    titleTri: "Title (trilingual)",
    companyTri: "Company (trilingual)",
    bioTri: "Bio (trilingual, markdown OK)",
    titleHint: "Public title shown next to the speaker's name (e.g. \"Founder · DBC Group\").",
    inheritedFromTeam: "Inherits from team:",
    saving: "Saving…",
    create: "Create speaker",
    save: "Save",
  },
  de: {
    photoUploaded: "Foto hochgeladen.",
    saved: "Gespeichert.",
    slug: "URL-Kennung",
    slugHelp: "Teil der öffentlichen Profil-URL. Unverändert lassen, um die aktuelle beizubehalten.",
    email: "E-Mail",
    linkedin: "LinkedIn-URL",
    twitter: "Twitter-URL",
    website: "Website-URL",
    sortOrder: "Sortierung (im Event)",
    visibility: "Sichtbarkeit",
    visPublic: "Öffentlich (auf Event-Funnel-Seiten sichtbar)",
    visInternal: "Intern (nur Admin-Vorschau)",
    visHidden: "Ausgeblendet (archiviert)",
    linkedTeam: "Verknüpftes Teammitglied",
    linkedNone: "Keines (externer Speaker)",
    linkedHint:
      "Wenn dieser Speaker auch im DBC-Germany-Team ist, hier verknüpfen. Bio, Foto, Rolle, E-Mail und LinkedIn werden vom Team-Profil übernommen, wenn die Felder unten leer sind.",
    linkBannerTitle: "Mit Team-Profil verknüpft",
    linkBannerBody:
      "Wenn die entsprechenden Speaker-Felder unten leer sind, übernimmt die öffentliche Funnel-Seite Bio, Foto, Rolle, E-Mail und LinkedIn von diesem Teammitglied. Pro Event durch Ausfüllen überschreiben.",
    linkBannerEdit: "Team-Profil bearbeiten →",
    photo: "Foto",
    photoHint: "JPG / PNG / WebP bis 5 MB. Quadratische Ausschnitte wirken am besten.",
    photoInherits: "Übernimmt das Team-Foto, wenn leer.",
    orPasteUrl: "Oder CDN-URL einfügen",
    titleTri: "Titel (dreisprachig)",
    companyTri: "Unternehmen (dreisprachig)",
    bioTri: "Bio (dreisprachig, Markdown möglich)",
    titleHint: "Öffentlicher Titel neben dem Namen (z.B. „Gründer · DBC Group“).",
    inheritedFromTeam: "Übernimmt vom Team:",
    saving: "Wird gespeichert…",
    create: "Speaker erstellen",
    save: "Speichern",
  },
  fr: {
    photoUploaded: "Photo téléversée.",
    saved: "Enregistré.",
    slug: "Identifiant d’URL",
    slugHelp: "Visible dans l’URL du profil public. Laissez inchangé pour conserver l’actuel.",
    email: "E-mail",
    linkedin: "URL LinkedIn",
    twitter: "URL Twitter",
    website: "URL du site web",
    sortOrder: "Ordre (dans l’événement)",
    visibility: "Visibilité",
    visPublic: "Public (visible sur les pages funnel des événements)",
    visInternal: "Interne (aperçu admin uniquement)",
    visHidden: "Masqué (archivé)",
    linkedTeam: "Membre d’équipe lié",
    linkedNone: "Aucun (intervenant externe)",
    linkedHint:
      "Si cet intervenant fait aussi partie de l’équipe DBC Germany, liez-le. Bio, photo, rôle, e-mail et LinkedIn sont hérités du profil d’équipe quand les champs ci-dessous sont vides.",
    linkBannerTitle: "Lié au profil d’équipe",
    linkBannerBody:
      "Quand les champs correspondants ci-dessous sont vides, la page funnel publique reprend la bio, photo, rôle, e-mail et LinkedIn de ce membre d’équipe. Remplir pour surcharger par événement.",
    linkBannerEdit: "Modifier le profil d’équipe →",
    photo: "Photo",
    photoHint: "JPG / PNG / WebP jusqu’à 5 Mo. Les cadrages carrés rendent mieux.",
    photoInherits: "Reprend la photo d’équipe si vide.",
    orPasteUrl: "Ou coller une URL CDN",
    titleTri: "Titre (trilingue)",
    companyTri: "Société (trilingue)",
    bioTri: "Bio (trilingue, markdown autorisé)",
    titleHint: "Titre public à côté du nom (ex. « Fondateur · DBC Group »).",
    inheritedFromTeam: "Hérité de l’équipe :",
    saving: "Enregistrement…",
    create: "Créer l’intervenant",
    save: "Enregistrer",
  },
} as const;

export function SpeakerForm({
  mode,
  locale,
  speaker,
  teamMembers,
  linkedTeam,
}: {
  mode: Mode;
  locale: string;
  speaker?: Speaker;
  teamMembers: { id: string; name: string; slug: string }[];
  linkedTeam: LinkedTeamMemberPreview | null;
}) {
  const router = useRouter();
  const tPerson = useTranslations("person");
  const t =
    T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [photoUrl, setPhotoUrl] = useState(speaker?.photo_url ?? "");
  const [firstName, setFirstName] = useState(speaker?.first_name ?? "");
  const [lastName, setLastName] = useState(speaker?.last_name ?? "");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      formData.set("photo_url", photoUrl);
      if (mode === "create") return (await createSpeaker(formData)) ?? null;
      return (await updateSpeaker(speaker!.id, formData)) ?? null;
    },
    null,
  );

  async function handlePhotoUpload(file: File): Promise<string> {
    const result = await uploadSpeakerPhoto(file, speaker?.id ?? null);
    if ("error" in result) throw new Error(result.error);
    setPhotoUrl(result.url);
    toast.success(t.photoUploaded);
    return result.url;
  }

  useEffect(() => {
    if (state?.success && mode === "edit") {
      router.refresh();
    }
  }, [state, router, mode]);

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  // Inherited values for placeholders — show what the public page will fall
  // back to when the speaker's own field is blank.
  const inh = linkedTeam;

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state?.error && (
        <div className="rounded-md bg-danger-soft p-4 text-sm text-danger">
          {state.error}
        </div>
      )}
      {state?.success && mode === "edit" && (
        <div className="rounded-md bg-success-soft p-4 text-sm text-success">
          {t.saved}
        </div>
      )}

      {linkedTeam && (
        <div className="rounded-md border border-info-strong/30 bg-info-soft p-4 text-sm">
          <p className="font-semibold text-info-strong">{t.linkBannerTitle}</p>
          <p className="mt-1 text-foreground/80">{t.linkBannerBody}</p>
          <Link
            href={`/${locale}/team/${linkedTeam.id}`}
            className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80"
          >
            {t.linkBannerEdit}
          </Link>
        </div>
      )}

      {/* Profile header — photo + name lifted to the top so the form
          immediately reads as a profile editor. Photo upload here is the
          primary entry point; the "or paste a CDN URL" fallback below is
          for when admins already have a hosted image. */}
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <div>
          <AssetUpload
            label={t.photo}
            description={
              inh?.photo_url
                ? `${t.photoHint} ${t.photoInherits}`
                : t.photoHint
            }
            value={photoUrl || inh?.photo_url || null}
            onUpload={handlePhotoUpload}
            onChange={setPhotoUrl}
            onRemove={() => setPhotoUrl("")}
          />
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              {t.orPasteUrl}
            </span>
            <Input
              type="url"
              name="photo_url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder={inh?.photo_url ?? "https://…"}
              className={`${inputClass} font-mono text-xs`}
            />
          </label>
        </div>

        <div className="space-y-4">
          <NameFields
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            firstNameLabel={tPerson("firstName")}
            lastNameLabel={tPerson("lastName")}
            required
          />
          <Field
            label={t.slug}
            name="slug"
            defaultValue={speaker?.slug ?? ""}
            hint={t.slugHelp}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.email}
          name="email"
          type="email"
          defaultValue={speaker?.email ?? ""}
          placeholder={inh?.email ?? undefined}
          inheritedHint={inh?.email ? `${t.inheritedFromTeam} ${inh.email}` : undefined}
        />
        <Field
          label={t.linkedin}
          name="linkedin_url"
          type="url"
          defaultValue={speaker?.linkedin_url ?? ""}
          placeholder={inh?.linkedin_url ?? undefined}
          inheritedHint={
            inh?.linkedin_url
              ? `${t.inheritedFromTeam} ${inh.linkedin_url}`
              : undefined
          }
        />
        <Field
          label={t.twitter}
          name="twitter_url"
          type="url"
          defaultValue={speaker?.twitter_url ?? ""}
        />
        <Field
          label={t.website}
          name="website_url"
          type="url"
          defaultValue={speaker?.website_url ?? ""}
        />
        <div>
          <label htmlFor="visibility" className="mb-1 block text-sm font-medium">
            {t.visibility}
          </label>
          <Select
            id="visibility"
            name="visibility"
            defaultValue={speaker?.visibility ?? "public"}
            className={inputClass}
          >
            <option value="public">{t.visPublic}</option>
            <option value="internal">{t.visInternal}</option>
            <option value="hidden">{t.visHidden}</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="team_member_id" className="mb-1 block text-sm font-medium">
            {t.linkedTeam}
          </label>
          <Select
            id="team_member_id"
            name="team_member_id"
            defaultValue={speaker?.team_member_id ?? ""}
            className={inputClass}
          >
            <option value="">{t.linkedNone}</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <span className="mt-1 block text-xs text-muted-foreground">
            {t.linkedHint}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.titleTri}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t.titleHint}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field
            label="EN"
            name="title_en"
            defaultValue={speaker?.title_en ?? ""}
            placeholder={inh?.role_en ?? undefined}
          />
          <Field
            label="DE"
            name="title_de"
            defaultValue={speaker?.title_de ?? ""}
            placeholder={inh?.role_de ?? undefined}
          />
          <Field
            label="FR"
            name="title_fr"
            defaultValue={speaker?.title_fr ?? ""}
            placeholder={inh?.role_fr ?? undefined}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.companyTri}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="EN" name="company_en" defaultValue={speaker?.company_en ?? ""} />
          <Field label="DE" name="company_de" defaultValue={speaker?.company_de ?? ""} />
          <Field label="FR" name="company_fr" defaultValue={speaker?.company_fr ?? ""} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.bioTri}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field
            label="EN"
            name="bio_en"
            defaultValue={speaker?.bio_en ?? ""}
            textarea
            rows={6}
            placeholder={inh?.bio_en ?? undefined}
          />
          <Field
            label="DE"
            name="bio_de"
            defaultValue={speaker?.bio_de ?? ""}
            textarea
            rows={6}
            placeholder={inh?.bio_de ?? undefined}
          />
          <Field
            label="FR"
            name="bio_fr"
            defaultValue={speaker?.bio_fr ?? ""}
            textarea
            rows={6}
            placeholder={inh?.bio_fr ?? undefined}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.saving : mode === "create" ? t.create : t.save}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type,
  required,
  textarea,
  rows,
  hint,
  placeholder,
  inheritedHint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
  inheritedHint?: string;
}) {
  const className =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {textarea ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 4}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type ?? "text"}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={className}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {inheritedHint && (
        <span className="mt-1 block text-xs text-info-strong">{inheritedHint}</span>
      )}
    </label>
  );
}
