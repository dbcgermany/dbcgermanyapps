"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@dbc/ui";
import {
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPE_VALUES,
  type NotificationType,
} from "@dbc/types";
import {
  updateNotificationPreferences,
  type NotificationPreferenceRow,
} from "@/actions/account";

// Friendly labels per locale for each notification type. Keeping these
// inline (not in i18n JSON) because the list grows alongside the SSOT
// enum — adding a type here is where it actually gets used.
const LABELS: Record<
  "en" | "de" | "fr",
  Record<NotificationType, { title: string; desc: string }>
> = {
  en: {
    new_order:             { title: "New order",                desc: "A ticket has been purchased." },
    payment_failed:        { title: "Payment failed",           desc: "Stripe declined a card or the session failed." },
    refund_issued:         { title: "Refund issued",            desc: "A ticket order has been refunded." },
    tier_sold_out:         { title: "Tier sold out",            desc: "A ticket tier just ran out of seats." },
    low_inventory:         { title: "Low inventory warning",    desc: "A tier dropped below 20 / 10 / 5 seats left." },
    new_application:       { title: "New application",          desc: "Someone submitted an incubation or job application." },
    contact_form_received: { title: "New contact form message", desc: "A visitor submitted the site contact form." },
    newsletter_subscriber: { title: "Newsletter subscriber",    desc: "A visitor confirmed their newsletter subscription." },
    check_in_milestone:    { title: "Check-in milestone",       desc: "Event crossed 25% / 50% / 75% / 100% check-in." },
    waitlist_available:    { title: "Waitlist spot available",  desc: "A waitlisted buyer can now purchase." },
    admin_event_reminder:  { title: "Event coming up",          desc: "30 / 7 / 1 days before a published event." },
    door_sale:             { title: "Door sale recorded",       desc: "A ticket was sold manually at the door." },
    transfer:              { title: "Ticket transferred",       desc: "A ticket was transferred to a new holder." },
    daily_digest:          { title: "Daily digest",             desc: "A summary of yesterday's activity, every morning." },
  },
  de: {
    new_order:             { title: "Neue Bestellung",          desc: "Ein Ticket wurde gekauft." },
    payment_failed:        { title: "Zahlung fehlgeschlagen",   desc: "Stripe hat eine Karte abgelehnt oder die Session ist fehlgeschlagen." },
    refund_issued:         { title: "Rückerstattung",           desc: "Eine Ticket-Bestellung wurde erstattet." },
    tier_sold_out:         { title: "Kategorie ausverkauft",    desc: "Eine Ticket-Kategorie ist ausverkauft." },
    low_inventory:         { title: "Warnung: Wenig Lager",     desc: "Eine Kategorie ist unter 20 / 10 / 5 Plätze gefallen." },
    new_application:       { title: "Neue Bewerbung",           desc: "Jemand hat eine Bewerbung eingereicht (Inkubation / Job)." },
    contact_form_received: { title: "Neue Kontaktnachricht",    desc: "Eine:r hat das Kontaktformular der Website abgeschickt." },
    newsletter_subscriber: { title: "Newsletter-Abonnent:in",   desc: "Ein:e Besucher:in hat das Newsletter-Abo bestätigt." },
    check_in_milestone:    { title: "Check-in-Meilenstein",     desc: "Event hat 25% / 50% / 75% / 100% Check-in überschritten." },
    waitlist_available:    { title: "Warteliste verfügbar",     desc: "Ein:e Wartelisten-Käufer:in kann jetzt buchen." },
    admin_event_reminder:  { title: "Event kommt bald",         desc: "30 / 7 / 1 Tage vor einem veröffentlichten Event." },
    door_sale:             { title: "Verkauf am Einlass",       desc: "Ein Ticket wurde manuell am Einlass verkauft." },
    transfer:              { title: "Ticket übertragen",        desc: "Ein Ticket wurde an eine:n neue:n Inhaber:in übertragen." },
    daily_digest:          { title: "Tägliche Zusammenfassung", desc: "Eine Übersicht der Aktivität vom Vortag, jeden Morgen." },
  },
  fr: {
    new_order:             { title: "Nouvelle commande",        desc: "Un billet vient d'être acheté." },
    payment_failed:        { title: "Paiement échoué",          desc: "Stripe a refusé une carte ou la session a échoué." },
    refund_issued:         { title: "Remboursement",            desc: "Une commande de billet a été remboursée." },
    tier_sold_out:         { title: "Catégorie épuisée",        desc: "Une catégorie de billets n'a plus de places." },
    low_inventory:         { title: "Alerte stock bas",         desc: "Une catégorie est passée sous 20 / 10 / 5 places restantes." },
    new_application:       { title: "Nouvelle candidature",     desc: "Quelqu'un a soumis une candidature (incubation / emploi)." },
    contact_form_received: { title: "Nouveau message contact",  desc: "Un·e visiteur·euse a envoyé le formulaire de contact." },
    newsletter_subscriber: { title: "Abonné·e newsletter",      desc: "Un·e visiteur·euse a confirmé son abonnement." },
    check_in_milestone:    { title: "Jalon de check-in",        desc: "L'événement a passé 25% / 50% / 75% / 100% de check-in." },
    waitlist_available:    { title: "Place liste d'attente",    desc: "Un·e acheteur·euse en liste d'attente peut maintenant acheter." },
    admin_event_reminder:  { title: "Événement à venir",        desc: "30 / 7 / 1 jours avant un événement publié." },
    door_sale:             { title: "Vente à l'entrée",         desc: "Un billet vient d'être vendu manuellement à l'entrée." },
    transfer:              { title: "Billet transféré",         desc: "Un billet a été transféré à un·e nouveau·elle détenteur·trice." },
    daily_digest:          { title: "Résumé quotidien",         desc: "Un récapitulatif de l'activité de la veille, chaque matin." },
  },
};

const COPY = {
  en: { heading: "Notifications", inApp: "In-app", email: "Email", save: "Save notification preferences", saving: "Saving…", saved: "Notification preferences saved.", reset: "Reset to defaults", masterNote: "The master \"Email notifications\" toggle above overrides all email rows below." },
  de: { heading: "Benachrichtigungen", inApp: "In-App", email: "E-Mail", save: "Einstellungen speichern", saving: "Wird gespeichert…", saved: "Einstellungen gespeichert.", reset: "Standard wiederherstellen", masterNote: "Der obige Schalter \"E-Mail-Benachrichtigungen\" überschreibt alle E-Mail-Zeilen unten." },
  fr: { heading: "Notifications", inApp: "In-app", email: "E-mail", save: "Enregistrer les préférences", saving: "Enregistrement…", saved: "Préférences enregistrées.", reset: "Rétablir les valeurs par défaut", masterNote: "Le bouton \"Notifications e-mail\" ci-dessus remplace toutes les lignes e-mail ci-dessous." },
};

type Prefs = Record<NotificationType, { in_app: boolean; email: boolean }>;

function buildInitialPrefs(rows: NotificationPreferenceRow[]): Prefs {
  const out = {} as Prefs;
  for (const type of NOTIFICATION_TYPE_VALUES) {
    const stored = rows.find((r) => r.notification_type === type);
    const def = NOTIFICATION_DEFAULTS[type];
    out[type] = stored
      ? { in_app: stored.in_app, email: stored.email }
      : { ...def };
  }
  return out;
}

export function NotificationsPreferencesForm({
  locale,
  initialRows,
}: {
  locale: string;
  initialRows: NotificationPreferenceRow[];
}) {
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = COPY[l];
  const labels = LABELS[l];
  const [prefs, setPrefs] = useState<Prefs>(() => buildInitialPrefs(initialRows));
  const [isPending, startTransition] = useTransition();

  function togglePref(
    type: NotificationType,
    channel: "in_app" | "email",
    value: boolean
  ) {
    setPrefs((p) => ({ ...p, [type]: { ...p[type], [channel]: value } }));
  }

  function resetDefaults() {
    const defaults = {} as Prefs;
    for (const type of NOTIFICATION_TYPE_VALUES) {
      defaults[type] = { ...NOTIFICATION_DEFAULTS[type] };
    }
    setPrefs(defaults);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs);
      if ("error" in result && result.error) toast.error(result.error);
      else toast.success(t.saved);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t border-border">
      <div>
        <h3 className="text-base font-heading font-semibold">{t.heading}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.masterNote}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Type</span>
          <span className="w-16 text-center">{t.inApp}</span>
          <span className="w-16 text-center">{t.email}</span>
        </div>
        <ul className="divide-y divide-border">
          {NOTIFICATION_TYPE_VALUES.map((type) => {
            const l = labels[type];
            const p = prefs[type];
            return (
              <li
                key={type}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <label className="flex w-16 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={p.in_app}
                    onChange={(e) => togglePref(type, "in_app", e.target.checked)}
                    className="h-4 w-4 accent-primary cursor-pointer"
                    aria-label={`${l.title} — ${t.inApp}`}
                  />
                </label>
                <label className="flex w-16 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={p.email}
                    onChange={(e) => togglePref(type, "email", e.target.checked)}
                    className="h-4 w-4 accent-primary cursor-pointer"
                    aria-label={`${l.title} — ${t.email}`}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={resetDefaults}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {t.reset}
        </button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.save}
        </Button>
      </div>
    </form>
  );
}
