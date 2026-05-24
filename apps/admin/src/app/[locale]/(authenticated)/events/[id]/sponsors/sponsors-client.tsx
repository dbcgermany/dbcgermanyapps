"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@dbc/ui";
import {
  SPONSOR_STATUS_VALUES,
  SPONSOR_TIER_VALUES,
  type SponsorStatus,
  type SponsorTier,
} from "@dbc/types";
import { createSponsor, deleteSponsor, updateSponsor } from "@/actions/sponsors";
import { InlineEditRow } from "@/components/inline-edit-row";
import { EditableList } from "@/components/editable-list";
import { DeleteButton } from "@/components/delete-button";

interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: SponsorTier;
  deal_value_cents: number | null;
  currency: string;
  status: SponsorStatus;
  logo_url: string | null;
  website_url: string | null;
  deliverables: string | null;
  notes: string | null;
}

const STATUS_VARIANT: Record<
  SponsorStatus,
  "default" | "info" | "warning" | "success" | "accent"
> = {
  lead: "default",
  proposal: "info",
  confirmed: "warning",
  active: "success",
  completed: "accent",
};

const TIER_VARIANT: Record<SponsorTier, "default" | "accent" | "success" | "warning" | "info"> = {
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
    deleteToast: "Sponsor deleted",
    addSponsor: "Add sponsor",
    newSponsor: "New sponsor",
    companyName: "Company name *",
    tier: "Tier",
    status: "Status",
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
    saving: "Saving…",
    save: "Save",
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
    deleteToast: "Sponsor gelöscht",
    addSponsor: "Sponsor hinzufügen",
    newSponsor: "Neuer Sponsor",
    companyName: "Firmenname *",
    tier: "Stufe",
    status: "Status",
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
    saving: "Wird gespeichert…",
    save: "Speichern",
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
    deleteToast: "Sponsor supprimé",
    addSponsor: "Ajouter un sponsor",
    newSponsor: "Nouveau sponsor",
    companyName: "Nom de la société *",
    tier: "Niveau",
    status: "Statut",
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
    saving: "Enregistrement…",
    save: "Enregistrer",
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
  const t = SP_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof SP_T];

  function fmtMoney(cents: number | null, currency: string) {
    if (cents == null) return "—";
    return (cents / 100).toLocaleString(locale, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    });
  }

  return (
    <div className="space-y-8">
      <EditableList
        isEmpty={sponsors.length === 0}
        emptyMessage={t.empty}
      >
        {sponsors.map((s) => (
          <InlineEditRow
            key={s.id}
            title={s.company_name}
            badges={
              <>
                <Badge variant={TIER_VARIANT[s.tier] ?? "default"}>
                  {t.tiers[s.tier] ?? s.tier}
                </Badge>
                <Badge variant={STATUS_VARIANT[s.status] ?? "default"}>
                  {t.statuses[s.status] ?? s.status}
                </Badge>
              </>
            }
            meta={
              <SponsorMeta sponsor={s} deliverablesLabel={t.deliverables} value={fmtMoney(s.deal_value_cents, s.currency)} />
            }
            deleteAction={
              <DeleteButton
                action={async () => deleteSponsor(s.id, eventId, locale)}
                confirmTitle={t.deleteConfirm}
                confirmDescription={s.company_name}
                confirmLabel={t.delete}
                cancelLabel={t.cancel}
                label={t.delete}
                successToast={t.deleteToast}
                compact
              />
            }
            renderEdit={({ close }) => (
              <SponsorForm
                key={s.id}
                eventId={eventId}
                locale={locale}
                t={t}
                editing={s}
                onDone={close}
              />
            )}
          />
        ))}
      </EditableList>

      <CreateSponsorPanel eventId={eventId} locale={locale} t={t} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SponsorMeta({
  sponsor,
  deliverablesLabel,
  value,
}: {
  sponsor: Sponsor;
  deliverablesLabel: string;
  value: string;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="font-medium text-foreground">{value}</span>
        {sponsor.contact_name && <span>{sponsor.contact_name}</span>}
        {sponsor.contact_email && (
          <a
            href={`mailto:${sponsor.contact_email}`}
            className="text-primary hover:text-primary/80"
          >
            {sponsor.contact_email}
          </a>
        )}
        {sponsor.contact_phone && <span>{sponsor.contact_phone}</span>}
        {sponsor.website_url && (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            {sponsor.website_url.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
      {sponsor.deliverables && (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{deliverablesLabel}:</span>{" "}
          {sponsor.deliverables}
        </p>
      )}
      {sponsor.notes && (
        <p className="mt-1 text-xs text-muted-foreground">{sponsor.notes}</p>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

type SponsorT = (typeof SP_T)[keyof typeof SP_T];

function CreateSponsorPanel({
  eventId,
  locale,
  t,
}: {
  eventId: string;
  locale: string;
  t: SponsorT;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          + {t.addSponsor}
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-primary/40 bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">{t.newSponsor}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          {t.cancel}
        </Button>
      </div>
      <SponsorForm
        eventId={eventId}
        locale={locale}
        t={t}
        editing={null}
        onDone={() => setOpen(false)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SponsorForm({
  eventId,
  locale,
  t,
  editing,
  onDone,
}: {
  eventId: string;
  locale: string;
  t: SponsorT;
  editing: Sponsor | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("locale", locale);
    // updateSponsor reads event_id from formData; required for the
    // contact_event_involvements upsert + revalidatePath.
    formData.set("event_id", eventId);
    startTransition(async () => {
      const res = editing
        ? await updateSponsor(editing.id, formData)
        : await createSponsor(eventId, formData);
      if (!res.error) {
        onDone();
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.companyName} name="company_name" defaultValue={editing?.company_name ?? ""} required />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label={t.tier}
            name="tier"
            defaultValue={editing?.tier ?? "partner"}
            options={SPONSOR_TIER_VALUES.map((v) => ({ value: v, label: t.tiers[v] ?? v }))}
          />
          <SelectField
            label={t.status}
            name="status"
            defaultValue={editing?.status ?? "lead"}
            options={SPONSOR_STATUS_VALUES.map((v) => ({ value: v, label: t.statuses[v] ?? v }))}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.contactFirstName} name="contact_first_name" defaultValue={editing?.contact_first_name ?? ""} />
        <Field label={t.contactLastName} name="contact_last_name" defaultValue={editing?.contact_last_name ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.contactEmail} name="contact_email" type="email" defaultValue={editing?.contact_email ?? ""} />
        <Field label={t.phone} name="contact_phone" defaultValue={editing?.contact_phone ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t.dealValue}
          name="deal_value_cents"
          type="number"
          step="0.01"
          defaultValue={
            editing?.deal_value_cents != null
              ? (editing.deal_value_cents / 100).toFixed(2)
              : ""
          }
        />
        <Field label={t.websiteUrl} name="website_url" type="url" defaultValue={editing?.website_url ?? ""} />
      </div>
      <TextareaField label={t.deliverables} name="deliverables" placeholder={t.deliverablesPh} defaultValue={editing?.deliverables ?? ""} />
      <TextareaField label="Notes" name="notes" placeholder={t.notesPh} defaultValue={editing?.notes ?? ""} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (editing ? t.saving : t.adding) : editing ? t.save : t.add}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}

/* -- tiny field helpers — these stay local until Phase 5 replaces them with
      FormField across the whole admin app. Same shape, same paddings. ----- */

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: ReactNode;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: ReactNode;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: ReactNode;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
