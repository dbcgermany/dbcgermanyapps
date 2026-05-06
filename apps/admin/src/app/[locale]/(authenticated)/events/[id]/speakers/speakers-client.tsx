"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input, Label, Select } from "@dbc/ui";
import { SortableList } from "@/components/sortable-list";
import {
  attachSpeakerToEvent,
  detachSpeakerFromEvent,
  reorderEventSpeakers,
  updateEventSpeaker,
  type EventSpeakerRow,
} from "@/actions/speakers";
import { FeaturedSelect } from "./featured-select";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Inherit avatar / email from team_members when the speaker row's own
// fields are blank — same fallback the public funnel uses, surfaced here so
// admins immediately see the photo without re-uploading per speaker.
function effectivePhoto(es: EventSpeakerRow): string | null {
  return es.speakers.photo_url || es.speakers.team_members?.photo_url || null;
}

function effectiveEmail(es: EventSpeakerRow): string | null {
  return es.speakers.email || es.speakers.team_members?.email || null;
}

const T = {
  en: {
    addSpeaker: "Add speaker",
    cancel: "Cancel",
    pickSpeaker: "— pick a speaker —",
    sortHint:
      "Drag the handle on the left to reorder. The order here is exactly the order shown on the public event page. Saves automatically.",
    needSpeaker: "Need a speaker who isn't in the library yet?",
    createOne: "Create one →",
    rolePlaceholderEn: "EN role label (e.g. Keynote)",
    rolePlaceholderDe: "DE role label",
    rolePlaceholderFr: "FR role label",
    sortOrder: "Sort order",
    save: "Save",
    saving: "Saving…",
    editRole: "Edit role label",
    editProfile: "Edit profile",
    remove: "Remove",
    confirmRemove: "Remove this speaker from the event?",
    emptyTitle: "No speakers on this event yet.",
    emptyHint:
      "Use \"Add speaker\" above to attach someone from the global library, or create a brand-new speaker.",
    attachedSummary: "{count} attached · {avail} more in library",
    addingTitle: "Add a speaker to this event",
    saved: "Saved.",
  },
  de: {
    addSpeaker: "Speaker hinzufügen",
    cancel: "Abbrechen",
    pickSpeaker: "— Speaker auswählen —",
    sortHint:
      "Mit dem Griff links die Reihenfolge per Drag & Drop ändern. Diese Reihenfolge entspricht exakt der öffentlichen Eventseite. Wird automatisch gespeichert.",
    needSpeaker: "Speaker noch nicht in der Bibliothek?",
    createOne: "Jetzt anlegen →",
    rolePlaceholderEn: "EN Rollenbezeichnung (z. B. Keynote)",
    rolePlaceholderDe: "DE Rollenbezeichnung",
    rolePlaceholderFr: "FR Rollenbezeichnung",
    sortOrder: "Sortierung",
    save: "Speichern",
    saving: "Wird gespeichert…",
    editRole: "Rollenbezeichnung bearbeiten",
    editProfile: "Profil bearbeiten",
    remove: "Entfernen",
    confirmRemove: "Diesen Speaker vom Event entfernen?",
    emptyTitle: "Noch keine Speaker auf diesem Event.",
    emptyHint:
      "„Speaker hinzufügen“ nutzen, um jemanden aus der Bibliothek zu verknüpfen, oder einen neuen anlegen.",
    attachedSummary: "{count} verknüpft · {avail} weitere in der Bibliothek",
    addingTitle: "Speaker zu diesem Event hinzufügen",
    saved: "Gespeichert.",
  },
  fr: {
    addSpeaker: "Ajouter un intervenant",
    cancel: "Annuler",
    pickSpeaker: "— choisir un intervenant —",
    sortHint:
      "Glissez la poignée à gauche pour réorganiser. L'ordre ici est exactement celui affiché sur la page publique de l'événement. Enregistré automatiquement.",
    needSpeaker: "Un intervenant qui n'est pas encore dans la bibliothèque ?",
    createOne: "En créer un →",
    rolePlaceholderEn: "EN libellé du rôle (p. ex. Keynote)",
    rolePlaceholderDe: "DE libellé du rôle",
    rolePlaceholderFr: "FR libellé du rôle",
    sortOrder: "Ordre",
    save: "Enregistrer",
    saving: "Enregistrement…",
    editRole: "Modifier le libellé du rôle",
    editProfile: "Modifier le profil",
    remove: "Retirer",
    confirmRemove: "Retirer cet intervenant de l'événement ?",
    emptyTitle: "Aucun intervenant sur cet événement.",
    emptyHint:
      "Utilisez « Ajouter un intervenant » ci-dessus pour en lier un depuis la bibliothèque, ou créez-en un nouveau.",
    attachedSummary: "{count} liés · {avail} de plus dans la bibliothèque",
    addingTitle: "Ajouter un intervenant à cet événement",
    saved: "Enregistré.",
  },
} as const;

export function EventSpeakersClient({
  eventId,
  locale,
  attached,
  available,
}: {
  eventId: string;
  locale: string;
  attached: EventSpeakerRow[];
  available: { id: string; name: string }[];
}) {
  const router = useRouter();
  const t =
    T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  const [showAdd, setShowAdd] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleAdd(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await attachSpeakerToEvent(eventId, formData);
      if (res?.error) alert(res.error);
      else {
        setShowAdd(false);
        refresh();
      }
    });
  }

  function handleEditRole(speakerId: string, formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await updateEventSpeaker(eventId, speakerId, formData);
      if (res?.error) alert(res.error);
      else {
        setEditingRoleId(null);
        refresh();
      }
    });
  }

  function handleRemove(speakerId: string) {
    if (!confirm(t.confirmRemove)) return;
    startTransition(async () => {
      const res = await detachSpeakerFromEvent(eventId, speakerId, locale);
      if (res?.error) alert(res.error);
      else refresh();
    });
  }

  // SortableList expects items keyed by `id`. event_speakers' identity is
  // (event_id, speaker_id), so we key on speaker_id (unique within an event).
  const sortableItems = attached.map((es) => ({ ...es, id: es.speaker_id }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t.attachedSummary
            .replace("{count}", String(attached.length))
            .replace("{avail}", String(available.length))}
        </p>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)}>{t.addSpeaker}</Button>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {t.needSpeaker}{" "}
        <Link
          href={`/${locale}/speakers/new`}
          className="font-semibold text-primary hover:text-primary/80"
        >
          {t.createOne}
        </Link>
      </p>

      {showAdd && (
        <Card className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.addingTitle}
          </p>
          <form
            className="mt-3 grid gap-4 sm:grid-cols-2"
            action={(fd) => handleAdd(fd)}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="speaker_id">Speaker</Label>
              <Select id="speaker_id" name="speaker_id" required defaultValue="">
                <option value="" disabled>
                  {t.pickSpeaker}
                </option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <RoleLabelFields t={t} />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="sort_order">{t.sortOrder}</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={(attached.length + 1) * 10}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  name="is_featured"
                  className="h-4 w-4 rounded border-border"
                />
                Featured
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? t.saving : t.addSpeaker}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-8">
        {attached.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">{t.emptyTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.emptyHint}</p>
          </div>
        ) : (
          <SortableList
            items={sortableItems}
            caption={t.sortHint}
            onReorder={async (ids) => {
              const res = await reorderEventSpeakers(eventId, ids, locale);
              if (res?.error) return { error: res.error };
            }}
            renderItem={(es, handle) => {
              const fullName =
                `${es.speakers.first_name} ${es.speakers.last_name}`.trim();
              const photo = effectivePhoto(es);
              const email = effectiveEmail(es);
              const roleLabel =
                es[`role_label_${(locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr"}` as const] ||
                es.role_label_en;
              const isLinkedToTeam = !!es.speakers.team_member_id;
              const isEditingRole = editingRoleId === es.speaker_id;

              return (
                <div
                  ref={handle.setNodeRef}
                  style={handle.style}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Drag to reorder"
                        className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted active:cursor-grabbing"
                        {...handle.attributes}
                        {...handle.listeners}
                      >
                        <span aria-hidden>⋮⋮</span>
                      </button>
                      {photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={photo}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                          {initialsOf(fullName)}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${locale}/speakers/${es.speaker_id}`}
                            className="font-medium hover:text-primary"
                          >
                            {fullName}
                          </Link>
                          {es.is_featured && (
                            <Badge variant="accent">Featured</Badge>
                          )}
                          {isLinkedToTeam && (
                            <Badge variant="info">team-linked</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {roleLabel ?? "—"} · sort {es.sort_order}
                          {email && ` · ${email}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FeaturedSelect
                        eventId={eventId}
                        speakerId={es.speaker_id}
                        current={es.is_featured}
                        locale={locale}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRoleId(isEditingRole ? null : es.speaker_id)
                        }
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        {t.editRole}
                      </button>
                      <Link
                        href={`/${locale}/speakers/${es.speaker_id}`}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        {t.editProfile}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(es.speaker_id)}
                        className="text-xs text-danger hover:text-danger/80"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>

                  {isEditingRole && (
                    <form
                      className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3"
                      action={(fd) => handleEditRole(es.speaker_id, fd)}
                    >
                      <input
                        type="hidden"
                        name="is_featured"
                        value={es.is_featured ? "on" : ""}
                      />
                      <FieldText
                        label="EN"
                        name="role_label_en"
                        defaultValue={es.role_label_en ?? ""}
                        placeholder={t.rolePlaceholderEn}
                      />
                      <FieldText
                        label="DE"
                        name="role_label_de"
                        defaultValue={es.role_label_de ?? ""}
                        placeholder={t.rolePlaceholderDe}
                      />
                      <FieldText
                        label="FR"
                        name="role_label_fr"
                        defaultValue={es.role_label_fr ?? ""}
                        placeholder={t.rolePlaceholderFr}
                      />
                      <div>
                        <Label htmlFor={`sort_${es.speaker_id}`}>
                          {t.sortOrder}
                        </Label>
                        <Input
                          id={`sort_${es.speaker_id}`}
                          name="sort_order"
                          type="number"
                          defaultValue={es.sort_order}
                        />
                      </div>
                      <div className="sm:col-span-3 flex gap-3">
                        <Button type="submit" disabled={pending}>
                          {pending ? t.saving : t.save}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingRoleId(null)}
                        >
                          {t.cancel}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

function RoleLabelFields({ t }: { t: (typeof T)[keyof typeof T] }) {
  return (
    <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
      <FieldText label="EN" name="role_label_en" placeholder={t.rolePlaceholderEn} />
      <FieldText label="DE" name="role_label_de" placeholder={t.rolePlaceholderDe} />
      <FieldText label="FR" name="role_label_fr" placeholder={t.rolePlaceholderFr} />
    </div>
  );
}

function FieldText({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  );
}
