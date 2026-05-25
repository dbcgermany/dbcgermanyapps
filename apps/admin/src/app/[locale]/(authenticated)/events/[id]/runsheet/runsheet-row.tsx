"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge, Button, FormField, Input, Select, Textarea } from "@dbc/ui";
import {
  updateRunsheetItem,
  deleteRunsheetItem,
  toggleRunsheetItemPublic,
} from "@/actions/runsheet";
import type {
  ProgramItem,
  ProgramItemOwnerSpeaker,
  ProgramItemOwnerTeamMember,
  ProgramItemOwnerContact,
} from "@dbc/types";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";

const STATUS_CYCLE: Record<string, "pending" | "in_progress" | "done"> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  pending: "default",
  in_progress: "warning",
  done: "success",
};

const RR_T = {
  en: {
    title: "Title (EN)", titleDe: "Title (DE)", titleFr: "Title (FR)",
    unassigned: "Unassigned", location: "Location",
    notes: "Public description (shown on agenda + attendee PDF)",
    notesDe: "Description (DE)", notesFr: "Description (FR)",
    privateNotes: "Internal notes (team-only — not on PDF or in emails)",
    privateNotesHint: "Internal-only. Won't appear on the run-sheet PDF or in any attendee email.",
    privateNotesDisplay: "Team note",
    owner: "Owner",
    ownerHint: "Pick from team / speakers / vendors so we don't duplicate people. Leave blank if the slot has no single owner.",
    ownerNone: "— No specific owner —",
    ownerTeamGroup: "DBC team",
    ownerSpeakerGroup: "Event speakers",
    ownerSpeakerAllGroup: "All speakers (not yet booked for this event)",
    ownerContactGroup: "Vendors / service providers",
    responsibleFallback: "Or type a generic role (e.g. Security, Hostesses)",
    isPublic: "On public agenda",
    isPublicHint: "Public rows appear on the marketing site agenda and in the attendee PDF. Internal rows stay on the staff run-sheet only.",
    pillPublic: "Public",
    pillInternal: "Internal",
    saving: "Saving…", save: "Save", cancel: "Cancel",
    savedToast: "Saved",
    languagesExpand: "Other languages (optional)",
    advance: "Advance", delete: "Delete", deleteConfirm: 'Delete "{title}"?',
    deletedToast: "Item deleted",
    statuses: { pending: "Pending", in_progress: "In progress", done: "Done" } as Record<string, string>,
  },
  de: {
    title: "Titel (EN)", titleDe: "Titel (DE)", titleFr: "Titel (FR)",
    unassigned: "Nicht zugewiesen", location: "Ort",
    notes: "Öffentliche Beschreibung (Programm + Teilnehmer-PDF)",
    notesDe: "Beschreibung (DE)", notesFr: "Beschreibung (FR)",
    privateNotes: "Interne Notizen (nur fürs Team — nicht im PDF oder in E-Mails)",
    privateNotesHint: "Nur intern. Erscheint weder im Ablaufplan-PDF noch in E-Mails an Teilnehmende.",
    privateNotesDisplay: "Team-Notiz",
    owner: "Verantwortlich",
    ownerHint: "Wähle aus Team / Speakern / Dienstleistern, damit wir niemanden doppelt anlegen. Leer lassen, wenn kein:e Einzelverantwortliche:r.",
    ownerNone: "— Niemand bestimmtes —",
    ownerTeamGroup: "DBC Team",
    ownerSpeakerGroup: "Event-Speaker",
    ownerSpeakerAllGroup: "Alle Speaker (nicht für dieses Event gebucht)",
    ownerContactGroup: "Dienstleister",
    responsibleFallback: "Oder generische Rolle eintippen (z. B. Security, Hostessen)",
    isPublic: "Im öffentlichen Programm",
    isPublicHint: "Öffentliche Zeilen erscheinen im Website-Programm und im Teilnehmer-PDF. Interne Zeilen nur im Team-Ablaufplan.",
    pillPublic: "Öffentlich",
    pillInternal: "Intern",
    saving: "Wird gespeichert…", save: "Speichern", cancel: "Abbrechen",
    savedToast: "Gespeichert",
    languagesExpand: "Andere Sprachen (optional)",
    advance: "Weiter", delete: "Löschen", deleteConfirm: "„{title}“ löschen?",
    deletedToast: "Eintrag gelöscht",
    statuses: { pending: "Offen", in_progress: "Läuft", done: "Erledigt" } as Record<string, string>,
  },
  fr: {
    title: "Titre (EN)", titleDe: "Titre (DE)", titleFr: "Titre (FR)",
    unassigned: "Non assigné", location: "Lieu",
    notes: "Description publique (programme + PDF participants)",
    notesDe: "Description (DE)", notesFr: "Description (FR)",
    privateNotes: "Notes internes (équipe uniquement — pas dans le PDF ni les e-mails)",
    privateNotesHint: "Visible uniquement par l’équipe. N’apparaît ni dans la feuille de route PDF ni dans les e-mails aux participants.",
    privateNotesDisplay: "Note équipe",
    owner: "Responsable",
    ownerHint: "Choisis dans équipe / intervenants / prestataires pour ne pas doublonner. Laisser vide s’il n’y a pas de responsable unique.",
    ownerNone: "— Pas de responsable —",
    ownerTeamGroup: "Équipe DBC",
    ownerSpeakerGroup: "Intervenants de l’événement",
    ownerSpeakerAllGroup: "Tous les intervenants (non encore liés à cet événement)",
    ownerContactGroup: "Prestataires",
    responsibleFallback: "Ou saisir un rôle générique (ex. Sécurité, Hôtesses)",
    isPublic: "Dans le programme public",
    isPublicHint: "Les lignes publiques apparaissent sur le programme du site et dans le PDF participant. Les internes restent sur la feuille de route équipe.",
    pillPublic: "Public",
    pillInternal: "Interne",
    saving: "Enregistrement…", save: "Enregistrer", cancel: "Annuler",
    savedToast: "Enregistré",
    languagesExpand: "Autres langues (facultatif)",
    advance: "Avancer", delete: "Supprimer", deleteConfirm: "Supprimer « {title} » ?",
    deletedToast: "Élément supprimé",
    statuses: { pending: "En attente", in_progress: "En cours", done: "Terminé" } as Record<string, string>,
  },
} as const;

type Locale = keyof typeof RR_T;

function pickLocale(locale: string): Locale {
  return (locale === "de" || locale === "fr" ? locale : "en") as Locale;
}

function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromLocal(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function ownerDisplayName(
  item: ProgramItem,
  locale: Locale
): string | null {
  if (item.speaker) {
    const t = item.speaker[`title_${locale}` as const] ?? item.speaker.title_en;
    const name = `${item.speaker.first_name} ${item.speaker.last_name}`.trim();
    return t ? `${name} — ${t}` : name;
  }
  if (item.team_member) {
    const role =
      item.team_member[`role_${locale}` as const] ?? item.team_member.role_en;
    return role
      ? `${item.team_member.name} — ${role}`
      : item.team_member.name;
  }
  if (item.contact) {
    return item.contact.full_name ?? item.contact.email;
  }
  return item.assignee?.display_name || item.responsible_person || null;
}

export function RunsheetRow({
  item,
  eventId,
  locale,
  staff,
  speakerOptions,
  teamMemberOptions,
  contactOptions,
  dragHandle,
}: {
  item: ProgramItem;
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  speakerOptions: (ProgramItemOwnerSpeaker & { is_event_speaker?: boolean })[];
  teamMemberOptions: ProgramItemOwnerTeamMember[];
  contactOptions: ProgramItemOwnerContact[];
  dragHandle?: ReactNode;
}) {
  const router = useRouter();
  const tCommon = useTranslations("admin.common");
  const [isPending, startTransition] = useTransition();
  const t = RR_T[pickLocale(locale)];

  const [optimisticPublic, setOptimisticPublic] = useOptimistic(
    item.is_public,
    (_, next: boolean) => next
  );
  const [isTogglingPublic, startToggleTransition] = useTransition();

  function handleStatusAdvance() {
    const next = STATUS_CYCLE[item.status] ?? "pending";
    const fd = new FormData();
    fd.set("event_id", eventId);
    fd.set("locale", locale);
    fd.set("status", next);
    startTransition(async () => {
      const res = await updateRunsheetItem(item.id, fd);
      if (res?.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        return;
      }
      toast.success(tCommon("savedToast"));
      router.refresh();
    });
  }

  function handleTogglePublic() {
    const next = !optimisticPublic;
    startToggleTransition(async () => {
      setOptimisticPublic(next);
      const res = await toggleRunsheetItemPublic(item.id, eventId, locale, next);
      if ("error" in res && res.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        // Server-state-driven revert: re-fetch happens via revalidatePath in
        // the action; the useOptimistic reducer reverts on next render.
      }
    });
  }

  const ownerName = ownerDisplayName(item, pickLocale(locale));

  const timeRange = (() => {
    const start = new Date(item.starts_at).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!item.ends_at) return start;
    const end = new Date(item.ends_at).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} – ${end}`;
  })();

  return (
    <InlineEditRow
      dragHandle={dragHandle}
      title={item.title}
      badges={
        <>
          <button
            type="button"
            onClick={handleTogglePublic}
            disabled={isTogglingPublic}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors disabled:cursor-wait ${
              optimisticPublic
                ? "border-success-strong/40 bg-success-soft text-success-strong hover:bg-success-soft/80"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
            aria-pressed={optimisticPublic}
            title={t.isPublicHint}
          >
            <span aria-hidden>{optimisticPublic ? "👁" : "🔒"}</span>
            {optimisticPublic ? t.pillPublic : t.pillInternal}
          </button>
          <Badge variant={STATUS_VARIANT[item.status] ?? "default"}>
            {t.statuses[item.status] ?? item.status.replace("_", " ")}
          </Badge>
        </>
      }
      meta={
        <>
          <div>
            <span>{timeRange}</span>
            {(ownerName || item.location_note) && (
              <span>
                {" · "}
                {ownerName}
                {ownerName && item.location_note && " · "}
                {item.location_note}
              </span>
            )}
          </div>
          {item.description && (
            <div className="mt-1">{item.description}</div>
          )}
          {item.notes && (
            <div className="mt-2 rounded-md border-l-2 border-warning-strong bg-warning-soft px-2 py-1 text-xs">
              <span className="font-medium text-warning-strong">
                {t.privateNotesDisplay}:
              </span>{" "}
              <span className="whitespace-pre-wrap text-foreground/80">
                {item.notes}
              </span>
            </div>
          )}
        </>
      }
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStatusAdvance}
          disabled={isPending}
        >
          {t.advance}
        </Button>
      }
      deleteAction={
        <DeleteButton
          action={async () => deleteRunsheetItem(item.id, eventId, locale)}
          confirmTitle={t.deleteConfirm.replace("{title}", item.title)}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          label={t.delete}
          successToast={t.deletedToast}
          compact
        />
      }
      renderEdit={({ close }) => (
        <RunsheetEditForm
          item={item}
          eventId={eventId}
          locale={locale}
          staff={staff}
          speakerOptions={speakerOptions}
          teamMemberOptions={teamMemberOptions}
          contactOptions={contactOptions}
          t={t}
          onSaved={close}
        />
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

type RunsheetT = (typeof RR_T)[keyof typeof RR_T];
type ActionResult = { error?: string; success?: boolean } | null;

type OwnerKind = "speaker" | "team_member" | "contact" | "";

function deriveInitialOwner(item: ProgramItem): { kind: OwnerKind; id: string } {
  if (item.speaker_id) return { kind: "speaker", id: item.speaker_id };
  if (item.team_member_id) return { kind: "team_member", id: item.team_member_id };
  if (item.contact_id) return { kind: "contact", id: item.contact_id };
  return { kind: "", id: "" };
}

function RunsheetEditForm({
  item,
  eventId,
  locale,
  staff,
  speakerOptions,
  teamMemberOptions,
  contactOptions,
  t,
  onSaved,
}: {
  item: ProgramItem;
  eventId: string;
  locale: string;
  staff: { id: string; name: string }[];
  speakerOptions: (ProgramItemOwnerSpeaker & { is_event_speaker?: boolean })[];
  teamMemberOptions: ProgramItemOwnerTeamMember[];
  contactOptions: ProgramItemOwnerContact[];
  t: RunsheetT;
  onSaved: () => void;
}) {
  const router = useRouter();
  const initialOwner = deriveInitialOwner(item);
  const [ownerValue, setOwnerValue] = useState<string>(
    initialOwner.kind ? `${initialOwner.kind}:${initialOwner.id}` : ""
  );

  const [state, formAction, isSaving] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      // datetime-local inputs submit a tz-less string ("2026-06-13T18:30").
      // Convert to UTC ISO so the timestamptz column stores the actual
      // wall-clock instant the operator picked.
      for (const field of ["starts_at", "ends_at"] as const) {
        const raw = formData.get(field);
        if (typeof raw === "string") {
          formData.set(field, fromLocal(raw) ?? "");
        }
      }
      // Owner combobox: serialize the single picked owner into the three
      // mutually-exclusive FK columns. Server action then clears the other
      // two automatically via its owner-exclusivity guard.
      formData.delete("speaker_id");
      formData.delete("team_member_id");
      formData.delete("contact_id");
      if (ownerValue) {
        const [kind, id] = ownerValue.split(":");
        if (kind === "speaker") formData.set("speaker_id", id);
        if (kind === "team_member") formData.set("team_member_id", id);
        if (kind === "contact") formData.set("contact_id", id);
      } else {
        // Explicit nulls so the server clears any previously-set FK.
        formData.set("speaker_id", "");
        formData.set("team_member_id", "");
        formData.set("contact_id", "");
      }
      return updateRunsheetItem(item.id, formData);
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
      toast.success(t.savedToast);
      onSaved();
      router.refresh();
    }
  }, [state, t.savedToast, onSaved, router]);

  const eventSpeakers = speakerOptions.filter((s) => s.is_event_speaker);
  const otherSpeakers = speakerOptions.filter((s) => !s.is_event_speaker);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label={t.title} required>
        <Input name="title" defaultValue={item.title} required />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start" required>
          <Input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocal(item.starts_at)}
            required
          />
        </FormField>
        <FormField label="End">
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocal(item.ends_at)}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.owner} hint={t.ownerHint}>
          <Select
            value={ownerValue}
            onChange={(e) => setOwnerValue(e.target.value)}
          >
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
          <Input
            name="responsible_person"
            defaultValue={item.responsible_person ?? ""}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Status">
          <Select name="status" defaultValue={item.status}>
            {Object.entries(t.statuses).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.location}>
          <Input name="location_note" defaultValue={item.location_note ?? ""} />
        </FormField>
      </div>
      <FormField label="Auth user (for status updates)">
        <Select name="assigned_to" defaultValue={item.assigned_to ?? ""}>
          <option value="">{t.unassigned}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={t.notes}>
        <Textarea name="description" defaultValue={item.description ?? ""} rows={2} />
      </FormField>
      <details className="rounded-md border border-border bg-muted/20 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {t.languagesExpand}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FormField label={t.titleDe}>
            <Input name="title_de" defaultValue={item.title_de ?? ""} />
          </FormField>
          <FormField label={t.titleFr}>
            <Input name="title_fr" defaultValue={item.title_fr ?? ""} />
          </FormField>
          <FormField label={t.notesDe}>
            <Textarea name="description_de" defaultValue={item.description_de ?? ""} rows={2} />
          </FormField>
          <FormField label={t.notesFr}>
            <Textarea name="description_fr" defaultValue={item.description_fr ?? ""} rows={2} />
          </FormField>
        </div>
      </details>
      <FormField label={t.privateNotes} hint={t.privateNotesHint}>
        <Textarea name="notes" defaultValue={item.notes ?? ""} rows={2} />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t.saving : t.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onSaved}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
