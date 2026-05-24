/**
 * Sponsor-page i18n. Kept as a single source of truth used by:
 *  - the list (sponsors-client.tsx)
 *  - the detail page ([sponsorId]/page.tsx)
 *  - the create page (new/page.tsx)
 *  - the shared form (sponsor-form.tsx)
 *
 * Hardcoded locale objects (rather than next-intl messages) because the
 * tier + status enum labels are already enum-shaped on the server, and
 * moving them into messages/{en,de,fr}.json is a separate i18n-cleanup
 * pass tracked in the SSOT plan.
 */
export const SP_T = {
  en: {
    listTitle: "Sponsors",
    listDescription:
      "Manage sponsorship deals and partners for this event. Track status, deal value, contact info, and deliverables.",
    empty: "No sponsors yet. Click + Add sponsor to create the first.",
    deliverables: "Deliverables",
    delete: "Delete",
    deleteConfirm: "Delete this sponsor?",
    deleteToast: "Sponsor deleted",
    addSponsor: "New sponsor",
    newSponsorTitle: "New sponsor",
    editSponsorTitle: "Edit sponsor",
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
    notesLabel: "Notes",
    adding: "Adding…",
    saving: "Saving…",
    save: "Save",
    add: "Add",
    cancel: "Cancel",
    backToSponsors: "Sponsors",
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
    listTitle: "Sponsoren",
    listDescription:
      "Sponsoring-Deals und Partner für diese Veranstaltung verwalten.",
    empty:
      "Noch keine Sponsoren. Klicken Sie + Sponsor hinzufügen, um den ersten anzulegen.",
    deliverables: "Leistungen",
    delete: "Löschen",
    deleteConfirm: "Diesen Sponsor löschen?",
    deleteToast: "Sponsor gelöscht",
    addSponsor: "Neuer Sponsor",
    newSponsorTitle: "Neuer Sponsor",
    editSponsorTitle: "Sponsor bearbeiten",
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
    notesLabel: "Notizen",
    adding: "Wird hinzugefügt…",
    saving: "Wird gespeichert…",
    save: "Speichern",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    backToSponsors: "Sponsoren",
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
    listTitle: "Sponsors",
    listDescription:
      "Gérer les accords de parrainage et les partenaires de cet événement.",
    empty:
      "Aucun sponsor pour le moment. Cliquez + Ajouter un sponsor pour créer le premier.",
    deliverables: "Livrables",
    delete: "Supprimer",
    deleteConfirm: "Supprimer ce sponsor ?",
    deleteToast: "Sponsor supprimé",
    addSponsor: "Nouveau sponsor",
    newSponsorTitle: "Nouveau sponsor",
    editSponsorTitle: "Modifier le sponsor",
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
    notesLabel: "Notes",
    adding: "Ajout…",
    saving: "Enregistrement…",
    save: "Enregistrer",
    add: "Ajouter",
    cancel: "Annuler",
    backToSponsors: "Sponsors",
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

export type SponsorT = (typeof SP_T)[keyof typeof SP_T];

export function pickSponsorT(locale: string): SponsorT {
  return SP_T[
    (locale === "de" || locale === "fr" ? locale : "en") as keyof typeof SP_T
  ];
}
