"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AssetUpload } from "@dbc/ui";
import {
  createTeamMember,
  updateTeamMember,
  uploadTeamMemberPhoto,
  type TeamMember,
} from "@/actions/team";

type Mode = "create" | "edit";

type FormState = { error?: string; success?: boolean } | null;

interface StaffAccount {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

const T = {
  en: {
    photoUploaded: "Photo uploaded.", saved: "Saved.",
    slug: "URL slug", slugHelp: "Shown in public profile URLs. Leave unchanged to keep the current one.",
    name: "Name", email: "Email", linkedin: "LinkedIn URL", sortOrder: "Sort order",
    visibility: "Visibility",
    visPublic: "Public (shown on dbc-germany.com/team)",
    visInternal: "Internal (admin-only)",
    visHidden: "Hidden (archived)",
    linkedStaff: "Linked staff account",
    linkedNone: "None (external / no login)",
    linkedCurrent: "Current linked account",
    linkedHint: "Link to a staff member who has admin dashboard access.",
    photo: "Photo", photoHint: "JPG / PNG / WebP up to 5 MB. Square crops look best.",
    orPasteUrl: "Or paste a CDN URL",
    roleTri: "Role (trilingual)", bioTri: "Bio (trilingual)",
    saving: "Saving…", create: "Create", save: "Save",
  },
  de: {
    photoUploaded: "Foto hochgeladen.", saved: "Gespeichert.",
    slug: "URL-Kennung", slugHelp: "Teil der öffentlichen Profil-URL. Unverändert lassen, um die aktuelle beizubehalten.",
    name: "Name", email: "E-Mail", linkedin: "LinkedIn-URL", sortOrder: "Sortierung",
    visibility: "Sichtbarkeit",
    visPublic: "Öffentlich (sichtbar auf dbc-germany.com/team)",
    visInternal: "Intern (nur Admin)",
    visHidden: "Ausgeblendet (archiviert)",
    linkedStaff: "Verknüpftes Mitarbeiterkonto",
    linkedNone: "Keines (extern / kein Login)",
    linkedCurrent: "Aktuell verknüpftes Konto",
    linkedHint: "Mit einem Teammitglied mit Admin-Zugang verknüpfen.",
    photo: "Foto", photoHint: "JPG / PNG / WebP bis 5 MB. Quadratische Ausschnitte wirken am besten.",
    orPasteUrl: "Oder CDN-URL einfügen",
    roleTri: "Rolle (dreisprachig)", bioTri: "Bio (dreisprachig)",
    saving: "Wird gespeichert…", create: "Erstellen", save: "Speichern",
  },
  fr: {
    photoUploaded: "Photo téléversée.", saved: "Enregistré.",
    slug: "Identifiant d’URL", slugHelp: "Visible dans l’URL du profil public. Laissez inchangé pour conserver l’actuel.",
    name: "Nom", email: "E-mail", linkedin: "URL LinkedIn", sortOrder: "Ordre",
    visibility: "Visibilité",
    visPublic: "Public (visible sur dbc-germany.com/team)",
    visInternal: "Interne (admin uniquement)",
    visHidden: "Masqué (archivé)",
    linkedStaff: "Compte équipe lié",
    linkedNone: "Aucun (externe / sans connexion)",
    linkedCurrent: "Compte actuellement lié",
    linkedHint: "Lier à un membre de l’équipe disposant d’un accès admin.",
    photo: "Photo", photoHint: "JPG / PNG / WebP jusqu’à 5 Mo. Les cadrages carrés rendent mieux.",
    orPasteUrl: "Ou coller une URL CDN",
    roleTri: "Rôle (trilingue)", bioTri: "Biographie (trilingue)",
    saving: "Enregistrement…", create: "Créer", save: "Enregistrer",
  },
} as const;

export function TeamMemberForm({
  locale,
  mode,
  initial,
  staffAccounts = [],
}: {
  locale: string;
  mode: Mode;
  initial?: TeamMember;
  staffAccounts?: StaffAccount[];
}) {
  const router = useRouter();
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      // Ensure the uploader's latest URL wins over any stale defaultValue.
      formData.set("photo_url", photoUrl);
      if (mode === "create") return createTeamMember(formData);
      return updateTeamMember(initial!.id, formData);
    },
    null
  );

  async function handlePhotoUpload(file: File): Promise<string> {
    const result = await uploadTeamMemberPhoto(file, initial?.id ?? null);
    if ("error" in result && result.error) {
      throw new Error(result.error);
    }
    if ("url" in result && result.url) {
      setPhotoUrl(result.url);
      toast.success(t.photoUploaded);
      return result.url;
    }
    throw new Error("Upload returned no URL.");
  }

  useEffect(() => {
    if (state?.success && mode === "edit") {
      router.refresh();
    }
  }, [state, router, mode]);

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && mode === "edit" && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t.saved}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} name="name" defaultValue={initial?.name ?? ""} required />
        <Field
          label={t.slug}
          name="slug"
          defaultValue={initial?.slug ?? ""}
          hint={t.slugHelp}
        />
        <Field label={t.email} name="email" type="email" defaultValue={initial?.email ?? ""} />
        <Field label={t.linkedin} name="linkedin_url" type="url" defaultValue={initial?.linkedin_url ?? ""} />
        <Field label={t.sortOrder} name="sort_order" type="number" defaultValue={initial?.sort_order?.toString() ?? "100"} />
        <div>
          <label htmlFor="visibility" className="mb-1 block text-sm font-medium">
            {t.visibility}
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={initial?.visibility ?? "internal"}
            className={inputClass}
          >
            <option value="public">{t.visPublic}</option>
            <option value="internal">{t.visInternal}</option>
            <option value="hidden">{t.visHidden}</option>
          </select>
        </div>
        <div>
          <label htmlFor="profile_id" className="mb-1 block text-sm font-medium">
            {t.linkedStaff}
          </label>
          <select
            id="profile_id"
            name="profile_id"
            defaultValue={initial?.profile_id ?? ""}
            className={inputClass}
          >
            <option value="">{t.linkedNone}</option>
            {staffAccounts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName || s.email} ({s.role.replace("_", " ")})
              </option>
            ))}
            {initial?.profile_id &&
              !staffAccounts.some((s) => s.id === initial.profile_id) && (
                <option value={initial.profile_id}>
                  {t.linkedCurrent}
                </option>
              )}
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">
            {t.linkedHint}
          </span>
        </div>
        <div className="sm:col-span-2">
          <AssetUpload
            label={t.photo}
            description={t.photoHint}
            value={photoUrl || null}
            onUpload={handlePhotoUpload}
            onChange={setPhotoUrl}
            onRemove={() => setPhotoUrl("")}
          />
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              {t.orPasteUrl}
            </span>
            <input
              type="url"
              name="photo_url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
              className={`${inputClass} font-mono`}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.roleTri}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="EN" name="role_en" defaultValue={initial?.role_en ?? ""} required />
          <Field label="DE" name="role_de" defaultValue={initial?.role_de ?? ""} />
          <Field label="FR" name="role_fr" defaultValue={initial?.role_fr ?? ""} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.bioTri}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="EN" name="bio_en" defaultValue={initial?.bio_en ?? ""} textarea rows={6} />
          <Field label="DE" name="bio_de" defaultValue={initial?.bio_de ?? ""} textarea rows={6} />
          <Field label="FR" name="bio_fr" defaultValue={initial?.bio_fr ?? ""} textarea rows={6} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t.saving : mode === "create" ? t.create : t.save}
      </button>
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  const className =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 4}
          required={required}
          className={className}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type ?? "text"}
          defaultValue={defaultValue}
          required={required}
          className={className}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
