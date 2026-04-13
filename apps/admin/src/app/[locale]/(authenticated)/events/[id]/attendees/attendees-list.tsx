"use client";

import { useState, useMemo, useTransition } from "react";
import { updateAttendeeNotes } from "@/actions/attendees";

interface Attendee {
  id: string;
  name: string;
  email: string;
  ticketToken: string;
  tierName: string;
  acquisitionType: string;
  checkedInAt: string | null;
  notes: string;
}

export function AttendeesList({
  locale,
  eventId,
  attendees,
}: {
  locale: string;
  eventId: string;
  attendees: Attendee[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "checked_in" | "not_checked_in">(
    "all"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (filter === "checked_in" && !a.checkedInAt) return false;
      if (filter === "not_checked_in" && a.checkedInAt) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.ticketToken.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendees, query, filter]);

  function startEditing(attendee: Attendee) {
    setEditingId(attendee.id);
    setNotesDraft(attendee.notes);
  }

  function saveNotes(id: string) {
    startTransition(async () => {
      await updateAttendeeNotes(id, notesDraft, eventId, locale);
      setEditingId(null);
    });
  }

  function exportCsv() {
    const headers = [
      "name",
      "email",
      "tier",
      "acquisition",
      "checked_in_at",
      "notes",
      "ticket_id",
    ];
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.tierName,
      a.acquisitionType,
      a.checkedInAt ?? "",
      a.notes.replace(/"/g, '""'),
      a.ticketToken,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendees-${eventId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const t = {
    en: {
      search: "Search by name, email or ticket ID",
      all: "All",
      checkedIn: "Checked in",
      notCheckedIn: "Not checked in",
      export: "Export CSV",
      name: "Name",
      tier: "Tier",
      status: "Status",
      notes: "Notes",
      addNote: "Add note",
      save: "Save",
      cancel: "Cancel",
      purchased: "Purchased",
      invited: "Invited",
      assigned: "Assigned",
      doorSale: "Door sale",
      notScanned: "Not scanned",
      scannedAt: "Scanned at",
      noResults: "No attendees match your search.",
    },
    de: {
      search: "Nach Name, E-Mail oder Ticket-ID suchen",
      all: "Alle",
      checkedIn: "Eingecheckt",
      notCheckedIn: "Nicht eingecheckt",
      export: "CSV exportieren",
      name: "Name",
      tier: "Tarif",
      status: "Status",
      notes: "Notizen",
      addNote: "Notiz hinzuf\u00FCgen",
      save: "Speichern",
      cancel: "Abbrechen",
      purchased: "Gekauft",
      invited: "Eingeladen",
      assigned: "Zugewiesen",
      doorSale: "Abendkasse",
      notScanned: "Nicht gescannt",
      scannedAt: "Gescannt um",
      noResults: "Keine Teilnehmer gefunden.",
    },
    fr: {
      search: "Rechercher par nom, e-mail ou ID du billet",
      all: "Tous",
      checkedIn: "Enregistr\u00E9s",
      notCheckedIn: "Non enregistr\u00E9s",
      export: "Exporter CSV",
      name: "Nom",
      tier: "Tarif",
      status: "Statut",
      notes: "Notes",
      addNote: "Ajouter une note",
      save: "Enregistrer",
      cancel: "Annuler",
      purchased: "Achet\u00E9",
      invited: "Invit\u00E9",
      assigned: "Attribu\u00E9",
      doorSale: "Sur place",
      notScanned: "Non scann\u00E9",
      scannedAt: "Scann\u00E9 \u00E0",
      noResults: "Aucun participant trouv\u00E9.",
    },
  }[locale] ?? {
    search: "Search", all: "All", checkedIn: "Checked in", notCheckedIn: "Not checked in", export: "Export", name: "Name", tier: "Tier", status: "Status", notes: "Notes", addNote: "Add note", save: "Save", cancel: "Cancel", purchased: "Purchased", invited: "Invited", assigned: "Assigned", doorSale: "Door sale", notScanned: "Not scanned", scannedAt: "Scanned at", noResults: "No results",
  };

  const acqLabels: Record<string, string> = {
    purchased: t.purchased,
    invited: t.invited,
    assigned: t.assigned,
    door_sale: t.doorSale,
  };

  return (
    <div className="mt-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          className="flex-1 min-w-[240px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(
            [
              { value: "all", label: t.all },
              { value: "checked_in", label: t.checkedIn },
              { value: "not_checked_in", label: t.notCheckedIn },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCsv}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t.export}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.noResults}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t.name}</th>
                <th className="px-4 py-3 text-left font-medium">{t.tier}</th>
                <th className="px-4 py-3 text-left font-medium">{t.status}</th>
                <th className="px-4 py-3 text-left font-medium">{t.notes}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-0 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{a.tierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {acqLabels[a.acquisitionType] ?? a.acquisitionType}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {a.checkedInAt ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        &#x2713;{" "}
                        {new Date(a.checkedInAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {t.notScanned}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === a.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotes(a.id)}
                            disabled={isPending}
                            className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                          >
                            {t.save}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-muted-foreground"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(a)}
                        className="text-left text-xs text-muted-foreground hover:text-foreground"
                      >
                        {a.notes || <span className="italic">{t.addNote}</span>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
