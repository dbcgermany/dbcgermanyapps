"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import { createRunsheetItem } from "@/actions/runsheet";
import type {
  ProgramItemOwnerSpeaker,
  ProgramItemOwnerTeamMember,
  ProgramItemOwnerContact,
} from "@dbc/types";

const RF_T = {
  en: {
    success: "Run-sheet item added",
    title: "Title (EN) *",
    titleHint: "Required. Shown on the run-sheet PDF + emails to assigned staff. Add DE/FR below for the public agenda.",
    titleDe: "Title (DE)",
    titleFr: "Title (FR)",
    startTime: "Start time *",
    endTime: "End time (optional)",
    owner: "Owner",
    ownerHint: "Pick from team / speakers / vendors so we don't duplicate people.",
    ownerNone: "— No specific owner —",
    ownerTeamGroup: "DBC team",
    ownerSpeakerGroup: "Event speakers",
    ownerSpeakerAllGroup: "All speakers (not yet booked for this event)",
    ownerContactGroup: "Vendors / service providers",
    responsibleFallback: "Or type a generic role (e.g. Security)",
    assignedTo: "Auth user (for status updates)",
    unassigned: "Unassigned",
    location: "Location",
    isPublic: "Show on public agenda + attendee PDF",
    isPublicHint: "Leave off for internal-only operational rows (setup, transitions, VIP arrival, debrief, etc.).",
    notes: "Public description (shown to attendees)",
    notesDe: "Description (DE)",
    notesFr: "Description (FR)",
    privateNotes: "Internal notes (team only — not on PDF or in emails)",
    languagesExpand: "Other languages (optional)",
    adding: "Adding…",
    addItem: "Add item",
  },
  de: {
    success: "Eintrag hinzugefügt",
    title: "Titel (EN) *",
    titleHint: "Erforderlich. Wird im Ablauf-PDF und in E-Mails an das zugewiesene Team gezeigt. DE/FR unten für das öffentliche Programm ergänzen.",
    titleDe: "Titel (DE)",
    titleFr: "Titel (FR)",
    startTime: "Startzeit *",
    endTime: "Endzeit (optional)",
    owner: "Verantwortlich",
    ownerHint: "Wähle aus Team / Speakern / Dienstleistern, damit wir niemanden doppelt anlegen.",
    ownerNone: "— Niemand bestimmtes —",
    ownerTeamGroup: "DBC Team",
    ownerSpeakerGroup: "Event-Speaker",
    ownerSpeakerAllGroup: "Alle Speaker (nicht für dieses Event gebucht)",
    ownerContactGroup: "Dienstleister",
    responsibleFallback: "Oder generische Rolle eintippen (z. B. Security)",
    assignedTo: "Auth-User (für Status-Updates)",
    unassigned: "Nicht zugewiesen",
    location: "Ort",
    isPublic: "Im öffentlichen Programm + Teilnehmer-PDF",
    isPublicHint: "Aus lassen für interne operative Zeilen (Aufbau, Übergänge, VIP-Ankunft, Debrief usw.).",
    notes: "Öffentliche Beschreibung (für Teilnehmende sichtbar)",
    notesDe: "Beschreibung (DE)",
    notesFr: "Beschreibung (FR)",
    privateNotes: "Interne Notizen (nur fürs Team — nicht im PDF oder in E-Mails)",
    languagesExpand: "Andere Sprachen (optional)",
    adding: "Wird hinzugefügt…",
    addItem: "Eintrag hinzufügen",
  },
  fr: {
    success: "Élément ajouté",
    title: "Titre (EN) *",
    titleHint: "Obligatoire. Affiché sur la feuille de route PDF et dans les e-mails au personnel assigné. Ajouter DE/FR ci-dessous pour le programme public.",
    titleDe: "Titre (DE)",
    titleFr: "Titre (FR)",
    startTime: "Heure de début *",
    endTime: "Heure de fin (optionnel)",
    owner: "Responsable",
    ownerHint: "Choisis dans équipe / intervenants / prestataires pour ne pas doublonner.",
    ownerNone: "— Pas de responsable —",
    ownerTeamGroup: "Équipe DBC",
    ownerSpeakerGroup: "Intervenants de l’événement",
    ownerSpeakerAllGroup: "Tous les intervenants (non encore liés à cet événement)",
    ownerContactGroup: "Prestataires",
    responsibleFallback: "Ou saisir un rôle générique (ex. Sécurité)",
    assignedTo: "Compte (pour les mises à jour de statut)",
    unassigned: "Non assigné",
    location: "Lieu",
    isPublic: "Dans le programme public + PDF participant",
    isPublicHint: "Laisser désactivé pour les lignes opérationnelles internes (installation, transitions, arrivée VIP, débrief…).",
    notes: "Description publique (visible par les participants)",
    notesDe: "Description (DE)",
    notesFr: "Description (FR)",
    privateNotes: "Notes internes (équipe uniquement — pas dans le PDF ni les e-mails)",
    languagesExpand: "Autres langues (facultatif)",
    adding: "Ajout…",
    addItem: "Ajouter",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function RunsheetForm({
  eventId,
  locale,
  staff,
  speakerOptions,
  teamMemberOptions,
  contactOptions,
}: {
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  speakerOptions: (ProgramItemOwnerSpeaker & { is_event_speaker?: boolean })[];
  teamMemberOptions: ProgramItemOwnerTeamMember[];
  contactOptions: ProgramItemOwnerContact[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const t = RF_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof RF_T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      for (const field of ["starts_at", "ends_at"] as const) {
        const raw = formData.get(field);
        if (typeof raw === "string" && raw) {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) {
            formData.set(field, d.toISOString());
          }
        }
      }
      // The single `_owner` select carries "kind:id"; fan it out into the
      // three FK columns and drop the umbrella key before sending.
      const owner = (formData.get("_owner") as string) || "";
      formData.delete("_owner");
      formData.delete("speaker_id");
      formData.delete("team_member_id");
      formData.delete("contact_id");
      if (owner) {
        const [kind, id] = owner.split(":");
        if (kind === "speaker") formData.set("speaker_id", id);
        if (kind === "team_member") formData.set("team_member_id", id);
        if (kind === "contact") formData.set("contact_id", id);
      }
      return createRunsheetItem(eventId, formData);
    },
    null
  );

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t.success);
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router, t.success]);

  const eventSpeakers = speakerOptions.filter((s) => s.is_event_speaker);
  const otherSpeakers = speakerOptions.filter((s) => !s.is_event_speaker);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-6"
    >
      <FormField label={t.title} required hint={t.titleHint}>
        <Input name="title" required />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.startTime} required>
          <Input name="starts_at" type="datetime-local" required />
        </FormField>
        <FormField label={t.endTime}>
          <Input name="ends_at" type="datetime-local" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.owner} hint={t.ownerHint}>
          <Select name="_owner" defaultValue="">
            <option value="">{t.ownerNone}</option>
            {teamMemberOptions.length > 0 && (
              <optgroup label={t.ownerTeamGroup}>
                {teamMemberOptions.map((tm) => (
                  <option key={`tm-${tm.id}`} value={`team_member:${tm.id}`}>
                    {tm.name}
                  </option>
                ))}
              </optgroup>
            )}
            {eventSpeakers.length > 0 && (
              <optgroup label={t.ownerSpeakerGroup}>
                {eventSpeakers.map((sp) => (
                  <option key={`sp-${sp.id}`} value={`speaker:${sp.id}`}>
                    {sp.first_name} {sp.last_name}
                  </option>
                ))}
              </optgroup>
            )}
            {otherSpeakers.length > 0 && (
              <optgroup label={t.ownerSpeakerAllGroup}>
                {otherSpeakers.map((sp) => (
                  <option key={`sp-${sp.id}`} value={`speaker:${sp.id}`}>
                    {sp.first_name} {sp.last_name}
                  </option>
                ))}
              </optgroup>
            )}
            {contactOptions.length > 0 && (
              <optgroup label={t.ownerContactGroup}>
                {contactOptions.map((c) => (
                  <option key={`c-${c.id}`} value={`contact:${c.id}`}>
                    {c.full_name ?? c.email}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </FormField>
        <FormField label={t.responsibleFallback}>
          <Input name="responsible_person" />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.assignedTo}>
          <Select name="assigned_to" defaultValue="">
            <option value="">{t.unassigned}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.location}>
          <Input name="location_note" />
        </FormField>
      </div>

      <FormField hint={t.isPublicHint}>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="is_public" className="size-4" />
          {t.isPublic}
        </label>
      </FormField>

      <FormField label={t.notes}>
        <Textarea name="description" rows={2} />
      </FormField>

      <details className="rounded-md border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {t.languagesExpand}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FormField label={t.titleDe}>
            <Input name="title_de" />
          </FormField>
          <FormField label={t.titleFr}>
            <Input name="title_fr" />
          </FormField>
          <FormField label={t.notesDe}>
            <Textarea name="description_de" rows={2} />
          </FormField>
          <FormField label={t.notesFr}>
            <Textarea name="description_fr" rows={2} />
          </FormField>
        </div>
      </details>

      <FormField label={t.privateNotes}>
        <Textarea name="notes" rows={2} />
      </FormField>

      <Button type="submit" disabled={isPending}>
        {isPending ? t.adding : t.addItem}
      </Button>
    </form>
  );
}
