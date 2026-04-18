import Link from "next/link";
import { Badge, Card } from "@dbc/ui";
import { PageHeader } from "@/components/page-header";
import {
  getRunsheetItems,
  createRunsheetItem,
  updateRunsheetItem,
  deleteRunsheetItem,
} from "@/actions/runsheet";

const T = {
  en: {
    back: "Event",
    title: "Run Sheet",
    addTitle: "Add Item",
    startsAt: "Start",
    endsAt: "End",
    itemTitle: "Title",
    responsible: "Responsible person",
    location: "Location note",
    description: "Description",
    save: "Save",
    delete: "Delete",
    pending: "Pending",
    in_progress: "In progress",
    done: "Done",
    noItems: "No run-sheet items yet. Add the first one below.",
    confirmDelete: "Delete this run-sheet item?",
    nextStatus: "Advance status",
  },
  de: {
    back: "Event",
    title: "Ablaufplan",
    addTitle: "Eintrag hinzuf\u00FCgen",
    startsAt: "Beginn",
    endsAt: "Ende",
    itemTitle: "Titel",
    responsible: "Verantwortliche Person",
    location: "Ortshinweis",
    description: "Beschreibung",
    save: "Speichern",
    delete: "L\u00F6schen",
    pending: "Ausstehend",
    in_progress: "In Bearbeitung",
    done: "Erledigt",
    noItems: "Noch keine Eintr\u00E4ge. F\u00FCgen Sie den ersten unten hinzu.",
    confirmDelete: "Diesen Eintrag l\u00F6schen?",
    nextStatus: "Status weiterschalten",
  },
  fr: {
    back: "\u00C9v\u00E9nement",
    title: "Feuille de route",
    addTitle: "Ajouter un \u00E9l\u00E9ment",
    startsAt: "D\u00E9but",
    endsAt: "Fin",
    itemTitle: "Titre",
    responsible: "Personne responsable",
    location: "Note de lieu",
    description: "Description",
    save: "Enregistrer",
    delete: "Supprimer",
    pending: "En attente",
    in_progress: "En cours",
    done: "Termin\u00E9",
    noItems: "Aucun \u00E9l\u00E9ment. Ajoutez le premier ci-dessous.",
    confirmDelete: "Supprimer cet \u00E9l\u00E9ment ?",
    nextStatus: "Avancer le statut",
  },
} as const;

type Locale = keyof typeof T;

const STATUS_CYCLE: Record<string, string> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const STATUS_BADGE: Record<string, "default" | "warning" | "success"> = {
  pending: "default",
  in_progress: "warning",
  done: "success",
};

function fmtTime(iso: string | null) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function RunsheetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: eventId } = await params;
  const l = (["en", "de", "fr"].includes(locale) ? locale : "en") as Locale;
  const t = T[l];
  const items = await getRunsheetItems(eventId);

  async function handleCreate(formData: FormData) {
    "use server";
    formData.set("locale", locale);
    await createRunsheetItem(eventId, formData);
  }

  async function handleToggleStatus(fd: FormData) {
    "use server";
    const itemId = fd.get("item_id") as string;
    const currentStatus = fd.get("current_status") as string;
    const next = STATUS_CYCLE[currentStatus] ?? "pending";
    const patch = new FormData();
    patch.set("status", next);
    patch.set("event_id", eventId);
    patch.set("locale", locale);
    await updateRunsheetItem(itemId, patch);
  }

  async function handleDelete(fd: FormData) {
    "use server";
    const itemId = fd.get("item_id") as string;
    await deleteRunsheetItem(itemId, eventId, locale);
  }

  return (
    <div>
      <Link
        href={`/${locale}/events/${eventId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t.back}
      </Link>

      <PageHeader title={t.title} className="mt-2" />

      {/* Timeline */}
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.noItems}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <Card key={item.id} padding="sm" className="rounded-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: time + content */}
                <div className="flex gap-4">
                  {/* Time column */}
                  <div className="shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    <div>{fmtTime(item.starts_at)}</div>
                    <div className="text-xs">{fmtTime(item.ends_at)}</div>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.responsible_person && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.responsible_person}
                      </p>
                    )}
                    {item.location_note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.location_note}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[item.status] ?? "default"}>
                    {t[item.status as keyof typeof t] ?? item.status}
                  </Badge>

                  <form action={handleToggleStatus}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <input
                      type="hidden"
                      name="current_status"
                      value={item.status}
                    />
                    <button
                      type="submit"
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                      title={t.nextStatus}
                    >
                      {t.nextStatus}
                    </button>
                  </form>

                  <form action={handleDelete}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {t.delete}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add item form */}
      <Card padding="md" className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t.addTitle}</h2>
        <form action={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">{t.startsAt}</label>
            <input
              type="datetime-local"
              name="starts_at"
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.endsAt}</label>
            <input
              type="datetime-local"
              name="ends_at"
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">{t.itemTitle} *</label>
            <input
              type="text"
              name="title"
              required
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.responsible}</label>
            <input
              type="text"
              name="responsible_person"
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.location}</label>
            <input
              type="text"
              name="location_note"
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">{t.description}</label>
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
