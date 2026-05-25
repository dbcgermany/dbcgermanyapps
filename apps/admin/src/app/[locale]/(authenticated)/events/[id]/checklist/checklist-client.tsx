"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  ConfirmDialog,
  FormField,
  Input,
  Select,
  Textarea,
} from "@dbc/ui";
import {
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistStatus,
  deleteChecklistItem,
  populateChecklistFromTemplate,
  type ChecklistItem,
  type RunsheetPickerOption,
} from "@/actions/checklist";
import { InlineEditRow } from "@/components/inline-edit-row";
import { DeleteButton } from "@/components/delete-button";
import {
  RunsheetItemPicker,
  runsheetItemPickerHint,
  runsheetItemPickerLabel,
} from "@/components/runsheet-item-picker";

const CATEGORIES = [
  "all",
  "venue",
  "marketing",
  "production",
  "finance",
  "logistics",
  "staffing",
  "content",
  "other",
] as const;

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

interface Props {
  eventId: string;
  items: ChecklistItem[];
  progress: {
    total: number;
    done: number;
    overdue: number;
    categories: Record<string, { total: number; done: number; overdue: number }>;
    estimatedCostCents: number;
    actualCostCents: number;
  };
  staff: { id: string; name: string }[];
  runsheetOptions: RunsheetPickerOption[];
  locale: string;
  eventStartsAt: string;
}

const CL_T = {
  en: {
    budget: "Budget",
    actual: "Actual",
    overdue: "Overdue",
    todo: "To do",
    done: "Done",
    addItem: "Add item",
    populateFromTemplate: "Populate from template",
    populateConfirm:
      "Populate checklist from default template? This adds all template items.",
    deleteConfirm: "Delete this checklist item?",
    deleteLabel: "Delete",
    taskTitle: "Task title",
    description: "Description (optional)",
    privateNotes: "Internal notes (optional)",
    estCost: "Est. cost (€)",
    actualCost: "Actual cost (€)",
    dueDate: "Due date",
    assignedTo: "Assigned to",
    unassigned: "Unassigned",
    adding: "Adding…",
    saving: "Saving…",
    save: "Save",
    add: "Add",
    cancel: "Cancel",
    savedToast: "Saved",
    statuses: {
      pending: "Pending",
      in_progress: "In progress",
      done: "Done",
      skipped: "Skipped",
    } as Record<string, string>,
    statusLabel: "Status",
    categories: {
      all: "All",
      venue: "Venue",
      marketing: "Marketing",
      production: "Production",
      finance: "Finance",
      logistics: "Logistics",
      staffing: "Staffing",
      content: "Content",
      other: "Other",
    } as Record<string, string>,
    notesIndicator: "Internal note",
    linkedRunsheet: "Run-sheet:",
  },
  de: {
    budget: "Budget",
    actual: "Tatsächlich",
    overdue: "Überfällig",
    todo: "Zu erledigen",
    done: "Erledigt",
    addItem: "Eintrag hinzufügen",
    populateFromTemplate: "Aus Vorlage befüllen",
    populateConfirm:
      "Checkliste aus Standardvorlage befüllen? Es werden alle Vorlagen-Einträge hinzugefügt.",
    deleteConfirm: "Diesen Eintrag löschen?",
    deleteLabel: "Löschen",
    taskTitle: "Titel der Aufgabe",
    description: "Beschreibung (optional)",
    privateNotes: "Interne Notizen (optional)",
    estCost: "Geschätzte Kosten (€)",
    actualCost: "Tatsächliche Kosten (€)",
    dueDate: "Fällig am",
    assignedTo: "Zugewiesen an",
    unassigned: "Nicht zugewiesen",
    adding: "Wird hinzugefügt…",
    saving: "Wird gespeichert…",
    save: "Speichern",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    savedToast: "Gespeichert",
    statuses: {
      pending: "Offen",
      in_progress: "Läuft",
      done: "Erledigt",
      skipped: "Übersprungen",
    } as Record<string, string>,
    statusLabel: "Status",
    categories: {
      all: "Alle",
      venue: "Location",
      marketing: "Marketing",
      production: "Produktion",
      finance: "Finanzen",
      logistics: "Logistik",
      staffing: "Personal",
      content: "Inhalt",
      other: "Sonstiges",
    } as Record<string, string>,
    notesIndicator: "Interne Notiz",
    linkedRunsheet: "Ablaufplan:",
  },
  fr: {
    budget: "Budget",
    actual: "Réel",
    overdue: "En retard",
    todo: "À faire",
    done: "Fait",
    addItem: "Ajouter un élément",
    populateFromTemplate: "Remplir depuis le modèle",
    populateConfirm:
      "Remplir la checklist depuis le modèle par défaut ? Tous les éléments seront ajoutés.",
    deleteConfirm: "Supprimer cet élément ?",
    deleteLabel: "Supprimer",
    taskTitle: "Intitulé",
    description: "Description (facultatif)",
    privateNotes: "Notes internes (facultatif)",
    estCost: "Coût estimé (€)",
    actualCost: "Coût réel (€)",
    dueDate: "Échéance",
    assignedTo: "Assigné à",
    unassigned: "Non assigné",
    adding: "Ajout…",
    saving: "Enregistrement…",
    save: "Enregistrer",
    add: "Ajouter",
    cancel: "Annuler",
    savedToast: "Enregistré",
    statuses: {
      pending: "En attente",
      in_progress: "En cours",
      done: "Terminé",
      skipped: "Ignoré",
    } as Record<string, string>,
    statusLabel: "Statut",
    categories: {
      all: "Tous",
      venue: "Lieu",
      marketing: "Marketing",
      production: "Production",
      finance: "Finance",
      logistics: "Logistique",
      staffing: "Personnel",
      content: "Contenu",
      other: "Autre",
    } as Record<string, string>,
    notesIndicator: "Note interne",
    linkedRunsheet: "Feuille de route :",
  },
} as const;

type Locale = keyof typeof CL_T;
function pickLocale(l: string): Locale {
  return (l === "de" || l === "fr" ? l : "en") as Locale;
}

export function ChecklistClient({
  eventId,
  items,
  progress,
  staff,
  runsheetOptions,
  locale,
  eventStartsAt,
}: Props) {
  const router = useRouter();
  const tCommon = useTranslations("admin.common");
  const [isPending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const t = CL_T[pickLocale(locale)];

  const today = new Date().toISOString().slice(0, 10);

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const overdue = filtered.filter(
    (i) =>
      i.due_date &&
      i.due_date < today &&
      i.status !== "done" &&
      i.status !== "skipped"
  );
  const upcoming = filtered.filter(
    (i) => !overdue.includes(i) && i.status !== "done" && i.status !== "skipped"
  );
  const completed = filtered.filter(
    (i) => i.status === "done" || i.status === "skipped"
  );

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  function handleToggle(item: ChecklistItem) {
    const next = STATUS_CYCLE[item.status] ?? "pending";
    startTransition(async () => {
      const res = await toggleChecklistStatus(item.id, next, eventId, locale);
      if (res?.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteChecklistItem(id, eventId, locale);
      if (res?.error) {
        toast.error(tCommon("actionFailedToast", { error: res.error }));
        return;
      }
      toast.success(tCommon("deletedToast"));
      router.refresh();
    });
  }

  function handlePopulate() {
    startTransition(async () => {
      await populateChecklistFromTemplate(eventId, eventStartsAt, locale);
      router.refresh();
    });
  }

  function fmtCost(cents: number) {
    return `€${(cents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Progress bar */}
      <div className="rounded-lg border border-border p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {progress.done}/{progress.total} {t.done.toLowerCase()}
            {progress.overdue > 0 && (
              <span className="ml-2 text-danger">
                {progress.overdue} {t.overdue.toLowerCase()}
              </span>
            )}
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {(progress.estimatedCostCents > 0 || progress.actualCostCents > 0) && (
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>
              {t.budget}: {fmtCost(progress.estimatedCostCents)}
            </span>
            <span>
              {t.actual}: {fmtCost(progress.actualCostCents)}
            </span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => {
          const catProgress = progress.categories[cat];
          const catLabel = t.categories[cat] ?? cat;
          const label =
            cat === "all"
              ? `${catLabel} (${progress.total})`
              : `${catLabel}${catProgress ? ` (${catProgress.done}/${catProgress.total})` : ""}`;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-danger">
            {t.overdue} ({overdue.length})
          </h3>
          <div className="mt-2 space-y-2">
            {overdue.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                eventId={eventId}
                staff={staff}
                runsheetOptions={runsheetOptions}
                locale={locale}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                t={t}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.todo} ({upcoming.length})
          </h3>
          <div className="mt-2 space-y-2">
            {upcoming.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                eventId={eventId}
                staff={staff}
                runsheetOptions={runsheetOptions}
                locale={locale}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                t={t}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.done} ({completed.length})
          </h3>
          <div className="mt-2 space-y-2">
            {completed.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                eventId={eventId}
                staff={staff}
                runsheetOptions={runsheetOptions}
                locale={locale}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                t={t}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setShowAddForm((o) => !o)}>
          {t.addItem}
        </Button>
        {items.length === 0 && (
          <ConfirmDialog
            trigger={
              <button
                type="button"
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {t.populateFromTemplate}
              </button>
            }
            title={t.populateConfirm}
            confirmLabel={t.populateFromTemplate}
            cancelLabel={t.cancel}
            variant="neutral"
            onConfirm={handlePopulate}
          />
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <ChecklistAddForm
          eventId={eventId}
          staff={staff}
          runsheetOptions={runsheetOptions}
          locale={locale}
          t={t}
          onAdded={() => {
            setShowAddForm(false);
            router.refresh();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type ChecklistT = (typeof CL_T)[keyof typeof CL_T];
type ActionResult = { error?: string; success?: boolean } | null;

function ChecklistRow({
  item,
  eventId,
  staff,
  runsheetOptions,
  locale,
  today,
  onToggle,
  onDelete,
  t,
  isPending,
}: {
  item: ChecklistItem;
  eventId: string;
  staff: { id: string; name: string }[];
  runsheetOptions: RunsheetPickerOption[];
  locale: string;
  today: string;
  onToggle: (i: ChecklistItem) => void;
  onDelete: (id: string) => void;
  t: ChecklistT;
  isPending: boolean;
}) {
  const isOverdue =
    item.due_date &&
    item.due_date < today &&
    item.status !== "done" &&
    item.status !== "skipped";

  const dueLabel = item.due_date
    ? new Date(item.due_date + "T00:00:00").toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      })
    : null;

  const costLabel =
    item.estimated_cost_cents != null && item.estimated_cost_cents > 0
      ? `€${(item.estimated_cost_cents / 100).toLocaleString(locale)}${
          item.actual_cost_cents != null
            ? ` / €${(item.actual_cost_cents / 100).toLocaleString(locale)}`
            : ""
        }`
      : null;

  const metaParts = [
    item.category && (t.categories[item.category] ?? item.category),
    dueLabel && (isOverdue ? `⚑ ${dueLabel}` : dueLabel),
    item.assignee?.display_name,
    costLabel,
    item.runsheet_item
      ? `${t.linkedRunsheet} ${item.runsheet_item.title}`
      : null,
    item.description,
  ].filter(Boolean);

  return (
    <InlineEditRow
      title={item.title}
      badges={
        <>
          <Badge variant={STATUS_VARIANT[item.status] ?? "default"}>
            {t.statuses[item.status] ?? item.status.replace("_", " ")}
          </Badge>
          {isOverdue && (
            <Badge variant="warning">{t.overdue}</Badge>
          )}
          {item.notes && (
            <Badge variant="warning" title={item.notes}>
              {t.notesIndicator}
            </Badge>
          )}
        </>
      }
      meta={metaParts.length > 0 ? metaParts.join(" · ") : undefined}
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggle(item)}
          disabled={isPending}
          title={t.statusLabel}
        >
          {STATUS_CYCLE[item.status]
            ? t.statuses[STATUS_CYCLE[item.status]] ?? STATUS_CYCLE[item.status]
            : t.statusLabel}
        </Button>
      }
      deleteAction={
        <DeleteButton
          action={async () => {
            onDelete(item.id);
            return { success: true };
          }}
          confirmTitle={t.deleteConfirm}
          confirmLabel={t.deleteLabel}
          cancelLabel={t.cancel}
          label={t.deleteLabel}
          compact
        />
      }
      renderEdit={({ close }) => (
        <ChecklistEditForm
          item={item}
          eventId={eventId}
          staff={staff}
          runsheetOptions={runsheetOptions}
          locale={locale}
          t={t}
          onSaved={close}
        />
      )}
    />
  );
}

function ChecklistAddForm({
  eventId,
  staff,
  runsheetOptions,
  locale,
  t,
  onAdded,
  onCancel,
}: {
  eventId: string;
  staff: { id: string; name: string }[];
  runsheetOptions: RunsheetPickerOption[];
  locale: string;
  t: ChecklistT;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      return createChecklistItem(eventId, formData);
    },
    null
  );

  const handledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === handledRef.current) return;
    handledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t.savedToast);
      formRef.current?.reset();
      onAdded();
    }
  }, [state, t.savedToast, onAdded]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-4"
    >
      <FormField label={t.taskTitle} required>
        <Input name="title" required />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t.statusLabel}>
          <Select name="category" defaultValue="other">
            {CATEGORIES.filter((c) => c !== "all").map((c) => (
              <option key={c} value={c}>
                {t.categories[c] ?? c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.dueDate}>
          <Input name="due_date" type="date" />
        </FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t.estCost}>
          <Input name="estimated_cost_eur" type="number" step="0.01" min="0" />
        </FormField>
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
      </div>
      <FormField label={t.description}>
        <Textarea name="description" rows={2} />
      </FormField>
      <FormField
        label={runsheetItemPickerLabel(locale)}
        hint={runsheetItemPickerHint(locale)}
      >
        <RunsheetItemPicker
          options={runsheetOptions}
          locale={locale}
        />
      </FormField>
      <FormField label={t.privateNotes}>
        <Textarea name="notes" rows={2} />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t.adding : t.add}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

function ChecklistEditForm({
  item,
  eventId,
  staff,
  runsheetOptions,
  locale,
  t,
  onSaved,
}: {
  item: ChecklistItem;
  eventId: string;
  staff: { id: string; name: string }[];
  runsheetOptions: RunsheetPickerOption[];
  locale: string;
  t: ChecklistT;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isSaving] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return updateChecklistItem(item.id, formData);
    },
    null
  );

  const handledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === handledRef.current) return;
    handledRef.current = state;
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

  return (
    <form action={formAction} className="space-y-4">
      <FormField label={t.taskTitle} required>
        <Input name="title" defaultValue={item.title} required />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t.statusLabel}>
          <Select name="category" defaultValue={item.category}>
            {CATEGORIES.filter((c) => c !== "all").map((c) => (
              <option key={c} value={c}>
                {t.categories[c] ?? c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.dueDate}>
          <Input
            name="due_date"
            type="date"
            defaultValue={item.due_date ?? ""}
          />
        </FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t.estCost}>
          <Input
            name="estimated_cost_eur"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              item.estimated_cost_cents != null
                ? (item.estimated_cost_cents / 100).toString()
                : ""
            }
          />
        </FormField>
        <FormField label={t.actualCost}>
          <Input
            name="actual_cost_eur"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              item.actual_cost_cents != null
                ? (item.actual_cost_cents / 100).toString()
                : ""
            }
          />
        </FormField>
      </div>
      <FormField label={t.assignedTo}>
        <Select name="assigned_to" defaultValue={item.assigned_to ?? ""}>
          <option value="">{t.unassigned}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={t.description}>
        <Textarea
          name="description"
          defaultValue={item.description ?? ""}
          rows={2}
        />
      </FormField>
      <FormField
        label={runsheetItemPickerLabel(locale)}
        hint={runsheetItemPickerHint(locale)}
      >
        <RunsheetItemPicker
          defaultValue={item.runsheet_item_id}
          options={runsheetOptions}
          locale={locale}
        />
      </FormField>
      <FormField label={t.privateNotes}>
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
