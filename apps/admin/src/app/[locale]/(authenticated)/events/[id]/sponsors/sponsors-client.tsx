"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import { createSponsor, deleteSponsor } from "@/actions/sponsors";

interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: string;
  deal_value_cents: number | null;
  currency: string;
  status: string;
  logo_url: string | null;
  website_url: string | null;
  deliverables: string | null;
  notes: string | null;
}

const TIERS = [
  "title",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "partner",
  "media",
] as const;

const STATUSES = [
  "lead",
  "proposal",
  "confirmed",
  "active",
  "completed",
] as const;

const STATUS_VARIANT: Record<
  string,
  "default" | "info" | "warning" | "success" | "accent"
> = {
  lead: "default",
  proposal: "info",
  confirmed: "warning",
  active: "success",
  completed: "accent",
};

const TIER_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "info"> = {
  title: "accent",
  platinum: "accent",
  gold: "warning",
  silver: "default",
  bronze: "warning",
  partner: "info",
  media: "default",
};

const SP_T = {
  en: {
    empty: "No sponsors yet. Add your first one below.",
    deliverables: "Deliverables",
    delete: "Delete",
    deleteConfirm: "Delete this sponsor?",
    addSponsor: "Add sponsor",
    companyName: "Company name *",
    contactFirstName: "Contact first name",
    contactLastName: "Contact last name",
    contactEmail: "Contact email",
    phone: "Phone",
    dealValue: "Deal value (e.g. 5000.00)",
    websiteUrl: "Website URL",
    deliverablesPh:
      "Deliverables (logo placement, mentions, stage time, etc.)",
    notesPh: "Internal notes",
    adding: "Adding…",
    add: "Add",
    cancel: "Cancel",
    tiers: {
      title: "Title",
      platinum: "Platinum",
      gold: "Gold",
      silver: "Silver",
      bronze: "Bronze",
      partner: "Partner",
      media: "Media",
    } as Record<string, string>,
    statuses: {
      lead: "Lead",
      proposal: "Proposal",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
    } as Record<string, string>,
  },
  de: {
    empty: "Noch keine Sponsoren. Fügen Sie unten Ihren ersten hinzu.",
    deliverables: "Leistungen",
    delete: "Löschen",
    deleteConfirm: "Diesen Sponsor löschen?",
    addSponsor: "Sponsor hinzufügen",
    companyName: "Firmenname *",
    contactFirstName: "Vorname",
    contactLastName: "Nachname",
    contactEmail: "Kontakt-E-Mail",
    phone: "Telefon",
    dealValue: "Vertragswert (z. B. 5000.00)",
    websiteUrl: "Website-URL",
    deliverablesPh:
      "Leistungen (Logo-Platzierung, Erwähnungen, Bühnenzeit usw.)",
    notesPh: "Interne Notizen",
    adding: "Wird hinzugefügt…",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    tiers: {
      title: "Hauptsponsor",
      platinum: "Platin",
      gold: "Gold",
      silver: "Silber",
      bronze: "Bronze",
      partner: "Partner",
      media: "Medien",
    } as Record<string, string>,
    statuses: {
      lead: "Interessent",
      proposal: "Angebot",
      confirmed: "Bestätigt",
      active: "Aktiv",
      completed: "Abgeschlossen",
    } as Record<string, string>,
  },
  fr: {
    empty: "Aucun sponsor pour le moment. Ajoutez-en un ci-dessous.",
    deliverables: "Livrables",
    delete: "Supprimer",
    deleteConfirm: "Supprimer ce sponsor ?",
    addSponsor: "Ajouter un sponsor",
    companyName: "Nom de la société *",
    contactFirstName: "Prénom du contact",
    contactLastName: "Nom du contact",
    contactEmail: "E-mail de contact",
    phone: "Téléphone",
    dealValue: "Valeur du contrat (ex. 5000.00)",
    websiteUrl: "URL du site",
    deliverablesPh:
      "Livrables (placement logo, mentions, temps de scène, etc.)",
    notesPh: "Notes internes",
    adding: "Ajout…",
    add: "Ajouter",
    cancel: "Annuler",
    tiers: {
      title: "Sponsor principal",
      platinum: "Platine",
      gold: "Or",
      silver: "Argent",
      bronze: "Bronze",
      partner: "Partenaire",
      media: "Médias",
    } as Record<string, string>,
    statuses: {
      lead: "Prospect",
      proposal: "Proposition",
      confirmed: "Confirmé",
      active: "Actif",
      completed: "Terminé",
    } as Record<string, string>,
  },
} as const;

export function SponsorsClient({
  eventId,
  locale,
  sponsors,
}: {
  eventId: string;
  locale: string;
  sponsors: Sponsor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const t = SP_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof SP_T];

  function fmtMoney(cents: number | null, currency: string) {
    if (cents == null) return "—";
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    });
  }

  function handleAdd(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await createSponsor(eventId, formData);
      if (!res.error) {
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    startTransition(async () => {
      await deleteSponsor(id, eventId, locale);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Sponsors list */}
      {sponsors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{s.company_name}</p>
                  <Badge variant={TIER_VARIANT[s.tier] ?? "default"}>
                    {t.tiers[s.tier] ?? s.tier}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[s.status] ?? "default"}>
                    {t.statuses[s.status] ?? s.status}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {fmtMoney(s.deal_value_cents, s.currency)}
                  </span>
                  {s.contact_name && <span>{s.contact_name}</span>}
                  {s.contact_email && (
                    <a
                      href={`mailto:${s.contact_email}`}
                      className="text-primary hover:text-primary/80"
                    >
                      {s.contact_email}
                    </a>
                  )}
                  {s.contact_phone && <span>{s.contact_phone}</span>}
                  {s.website_url && (
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      {s.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                {s.deliverables && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">{t.deliverables}:</span>{" "}
                    {s.deliverables}
                  </p>
                )}
                {s.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {t.delete}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button / form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.addSponsor}
        </button>
      ) : (
        <form
          action={handleAdd}
          className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="company_name"
              placeholder={t.companyName}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="tier"
                defaultValue="partner"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t.tiers[tier] ?? tier}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue="lead"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t.statuses[status] ?? status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="contact_first_name"
              placeholder={t.contactFirstName}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="contact_last_name"
              placeholder={t.contactLastName}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="contact_email"
              type="email"
              placeholder={t.contactEmail}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="contact_phone"
              placeholder={t.phone}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="deal_value_cents"
              type="number"
              step="0.01"
              placeholder={t.dealValue}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="website_url"
              type="url"
              placeholder={t.websiteUrl}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="deliverables"
            placeholder={t.deliverablesPh}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            name="notes"
            placeholder={t.notesPh}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-input px-4 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
