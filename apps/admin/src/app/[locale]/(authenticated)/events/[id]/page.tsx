import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Calendar,
  ClipboardList,
  Gift,
  Handshake,
  Image as ImageIcon,
  ListChecks,
  Mail,
  QrCode,
  Radio,
  Scissors,
  Tag,
  TicketCheck,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Button, Card, LinkButton } from "@dbc/ui";
import { getEvent, togglePublish, duplicateEvent } from "@/actions/events";
import { getEventChecklist } from "@/actions/checklist";
import { getLiveEventStats } from "@/actions/live-event";
import { StatCard } from "@/components/stat-card";
import { StatGrid } from "@/components/stat-grid";
import { PageHeader } from "@/components/page-header";
import { DeleteEventButton } from "./delete-button";

const T = {
  en: {
    publish: "Publish",
    unpublish: "Unpublish",
    duplicate: "Duplicate",
    duplicateTitle:
      "Duplicate this event as a new draft (dates shifted +1 year)",
    edit: "Edit",
    published: "Published",
    draft: "Draft",
    ticketsSold: "Tickets sold",
    ofCapacity: "of {n} capacity",
    revenue: "Revenue",
    checkedIn: "Checked in",
    startsIn: "Starts in",
    ended: "Ended",
    today: "Today",
    dayAgo: "day ago",
    daysAgo: "days ago",
    day: "day",
    days: "days",
    dateTime: "Date & Time",
    venue: "Venue",
    venueNotSet: "Not set",
    capacity: "Capacity",
    attendees: "attendees",
    maxPerOrder: "Max {n} tickets per order",
    salesTarget: "Sales target",
    tickets: "tickets",
    paymentMethods: "Payment Methods",
    description: "Description",
    noDescription: "No description yet.",
    setup: "Setup",
    marketing: "Marketing",
    operations: "Operations",
    postEvent: "Post-event",
    ticketTiers: "Ticket Tiers",
    ticketTiersDesc: "Create and manage ticket pricing",
    couponCodes: "Coupon Codes",
    couponCodesDesc: "Create discount codes for this event",
    scheduleSpeakers: "Schedule & Speakers",
    scheduleSpeakersDesc: "Manage the event agenda and speakers",
    ticketPreview: "Ticket Preview",
    ticketPreviewDesc: "Preview the PDF ticket design",
    emailSequences: "Email Sequences",
    emailSequencesDesc: "Automated post-event email campaigns",
    invitations: "Invitations",
    invitationsDesc: "Send formal invitations with comped tickets",
    bulkInvitations: "Bulk Invitations",
    bulkInvitationsDesc: "Import a CSV of invitees",
    checklist: "Checklist",
    checklistOverdueSuffix: "overdue",
    runSheet: "Run Sheet",
    runSheetDesc: "Minute-by-minute event day plan",
    sponsors: "Sponsors",
    sponsorsDesc: "Manage sponsorship deals and partners",
    budgetExpenses: "Budget & Expenses",
    budgetExpensesDesc: "Track costs and calculate profit",
    liveDashboard: "Live Dashboard",
    liveDashboardDesc: "Real-time check-in and sales during event",
    attendeesHub: "Attendees",
    attendeesHubDesc: "View registrations and check-in status",
    media: "Media",
    mediaDesc: "Upload photos and videos after the event",
    posterDoor: "Door-sale Poster",
    posterDoorDesc: "Printable QR poster for venue entrance",
    dangerZone: "Danger zone",
    dangerDesc:
      "Deleting an event is irreversible and removes all associated tickets, orders, and data.",
  },
  de: {
    publish: "Veröffentlichen",
    unpublish: "Zurückziehen",
    duplicate: "Duplizieren",
    duplicateTitle:
      "Diese Veranstaltung als neuen Entwurf duplizieren (Daten +1 Jahr verschoben)",
    edit: "Bearbeiten",
    published: "Veröffentlicht",
    draft: "Entwurf",
    ticketsSold: "Verkaufte Tickets",
    ofCapacity: "von {n} Kapazität",
    revenue: "Umsatz",
    checkedIn: "Eingecheckt",
    startsIn: "Beginnt in",
    ended: "Beendet",
    today: "Heute",
    dayAgo: "Tag her",
    daysAgo: "Tagen her",
    day: "Tag",
    days: "Tagen",
    dateTime: "Datum & Uhrzeit",
    venue: "Veranstaltungsort",
    venueNotSet: "Nicht festgelegt",
    capacity: "Kapazität",
    attendees: "Teilnehmende",
    maxPerOrder: "Max. {n} Tickets pro Bestellung",
    salesTarget: "Verkaufsziel",
    tickets: "Tickets",
    paymentMethods: "Zahlungsarten",
    description: "Beschreibung",
    noDescription: "Noch keine Beschreibung.",
    setup: "Einrichtung",
    marketing: "Marketing",
    operations: "Durchführung",
    postEvent: "Nach der Veranstaltung",
    ticketTiers: "Ticketkategorien",
    ticketTiersDesc: "Ticketpreise erstellen und verwalten",
    couponCodes: "Rabattcodes",
    couponCodesDesc: "Rabattcodes für diese Veranstaltung erstellen",
    scheduleSpeakers: "Programm & Sprecher:innen",
    scheduleSpeakersDesc: "Agenda und Sprecher:innen verwalten",
    ticketPreview: "Ticket-Vorschau",
    ticketPreviewDesc: "Vorschau des PDF-Ticketdesigns",
    emailSequences: "E-Mail-Sequenzen",
    emailSequencesDesc: "Automatisierte Nachsorge-Kampagnen",
    invitations: "Einladungen",
    invitationsDesc: "Formelle Einladungen mit Freitickets versenden",
    bulkInvitations: "Sammel-Einladungen",
    bulkInvitationsDesc: "CSV-Datei mit Eingeladenen importieren",
    checklist: "Checkliste",
    checklistOverdueSuffix: "überfällig",
    runSheet: "Ablaufplan",
    runSheetDesc: "Minutenplan für den Veranstaltungstag",
    sponsors: "Sponsoren",
    sponsorsDesc: "Sponsoring-Verträge und Partner verwalten",
    budgetExpenses: "Budget & Ausgaben",
    budgetExpensesDesc: "Kosten erfassen und Gewinn berechnen",
    liveDashboard: "Live-Dashboard",
    liveDashboardDesc: "Check-in und Verkäufe während der Veranstaltung",
    attendeesHub: "Teilnehmende",
    attendeesHubDesc: "Anmeldungen und Check-in-Status einsehen",
    media: "Medien",
    mediaDesc: "Fotos und Videos nach der Veranstaltung hochladen",
    posterDoor: "Abendkassen-Poster",
    posterDoorDesc: "Druckbares QR-Poster für den Eingang",
    dangerZone: "Gefahrenbereich",
    dangerDesc:
      "Das Löschen einer Veranstaltung ist unwiderruflich und entfernt alle zugehörigen Tickets, Bestellungen und Daten.",
  },
  fr: {
    publish: "Publier",
    unpublish: "Dépublier",
    duplicate: "Dupliquer",
    duplicateTitle:
      "Dupliquer cet événement en tant que nouveau brouillon (dates +1 an)",
    edit: "Modifier",
    published: "Publié",
    draft: "Brouillon",
    ticketsSold: "Billets vendus",
    ofCapacity: "sur {n} de capacité",
    revenue: "Revenus",
    checkedIn: "Enregistrés",
    startsIn: "Commence dans",
    ended: "Terminé",
    today: "Aujourd’hui",
    dayAgo: "jour écoulé",
    daysAgo: "jours écoulés",
    day: "jour",
    days: "jours",
    dateTime: "Date et heure",
    venue: "Lieu",
    venueNotSet: "Non défini",
    capacity: "Capacité",
    attendees: "participants",
    maxPerOrder: "Max. {n} billets par commande",
    salesTarget: "Objectif de vente",
    tickets: "billets",
    paymentMethods: "Moyens de paiement",
    description: "Description",
    noDescription: "Aucune description pour le moment.",
    setup: "Configuration",
    marketing: "Marketing",
    operations: "Opérations",
    postEvent: "Après l’événement",
    ticketTiers: "Catégories de billets",
    ticketTiersDesc: "Créer et gérer la tarification",
    couponCodes: "Codes promo",
    couponCodesDesc: "Créer des codes de réduction pour cet événement",
    scheduleSpeakers: "Programme & intervenants",
    scheduleSpeakersDesc: "Gérer l’agenda et les intervenants",
    ticketPreview: "Aperçu du billet",
    ticketPreviewDesc: "Prévisualiser le design du billet PDF",
    emailSequences: "Séquences e-mail",
    emailSequencesDesc: "Campagnes automatisées d’après-événement",
    invitations: "Invitations",
    invitationsDesc:
      "Envoyer des invitations formelles avec billets offerts",
    bulkInvitations: "Invitations en masse",
    bulkInvitationsDesc: "Importer un CSV d’invités",
    checklist: "Checklist",
    checklistOverdueSuffix: "en retard",
    runSheet: "Plan de déroulement",
    runSheetDesc: "Plan minute par minute du jour J",
    sponsors: "Sponsors",
    sponsorsDesc: "Gérer les accords de parrainage et partenaires",
    budgetExpenses: "Budget & dépenses",
    budgetExpensesDesc: "Suivre les coûts et calculer la marge",
    liveDashboard: "Tableau de bord live",
    liveDashboardDesc:
      "Enregistrements et ventes en temps réel pendant l’événement",
    attendeesHub: "Participants",
    attendeesHubDesc: "Consulter les inscriptions et le statut d’entrée",
    media: "Médias",
    mediaDesc: "Téléverser photos et vidéos après l’événement",
    posterDoor: "Affiche billetterie sur place",
    posterDoorDesc: "Affiche QR imprimable pour l’entrée",
    dangerZone: "Zone à risque",
    dangerDesc:
      "La suppression d’un événement est irréversible et retire tous les billets, commandes et données associés.",
  },
} as const;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = T[l];
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [checklist, liveStats] = await Promise.all([
    getEventChecklist(id),
    getLiveEventStats(id),
  ]);
  const clPct = checklist.progress.total > 0
    ? Math.round((checklist.progress.done / checklist.progress.total) * 100)
    : 0;

  // Sales target progress
  const ticketTarget = event.sales_target_tickets;
  const revenueTarget = event.sales_target_revenue_cents;
  const ticketsSoldForTarget = liveStats.totalTickets;
  const revenueForTarget = liveStats.revenueCents;

  // Days-until computation (server component — Date.now is fine here)
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysUntil = Math.ceil(
    (new Date(event.starts_at).getTime() - nowMs) / 86400000
  );
  const daysLabel =
    daysUntil > 0
      ? `${daysUntil} ${daysUntil === 1 ? t.day : t.days}`
      : daysUntil === 0
        ? t.today
        : `${Math.abs(daysUntil)} ${
            Math.abs(daysUntil) === 1 ? t.dayAgo : t.daysAgo
          }`;
  const ticketProgressPct = ticketTarget && ticketTarget > 0
    ? Math.min(100, Math.round((ticketsSoldForTarget / ticketTarget) * 100))
    : null;
  const revenueProgressPct = revenueTarget && revenueTarget > 0
    ? Math.min(100, Math.round((revenueForTarget / revenueTarget) * 100))
    : null;

  const titleKey = `title_${locale}` as keyof typeof event;
  const descKey = `description_${locale}` as keyof typeof event;

  return (
    <div>
      {/* Header */}
      <div>
        <PageHeader
          title={(event[titleKey] as string) || event.title_en}
          back={{ href: `/${locale}/events`, label: tBack("events") }}
          cta={
            <div className="flex flex-wrap gap-2">
              <form
                action={async () => {
                  "use server";
                  await togglePublish(id, locale);
                }}
              >
                <Button type="submit" variant="secondary">
                  {event.is_published ? t.unpublish : t.publish}
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await duplicateEvent(id, locale);
                }}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  title={t.duplicateTitle}
                >
                  {t.duplicate}
                </Button>
              </form>
              <LinkButton href={`/${locale}/events/${id}/edit`}>
                {t.edit}
              </LinkButton>
            </div>
          }
        />
        <div className="mt-1 flex items-center gap-3">
          <Badge variant={event.is_published ? "success" : "warning"}>
            {event.is_published ? t.published : t.draft}
          </Badge>
          <span className="text-sm text-muted-foreground capitalize">
            {event.event_type}
          </span>
        </div>
      </div>

      {/* Event KPIs — 4 cards */}
      <div className="mt-8">
        <StatGrid cols={4}>
          <StatCard
            label={t.ticketsSold}
            value={liveStats.totalTickets.toLocaleString(locale)}
            sub={
              event.capacity
                ? t.ofCapacity.replace(
                    "{n}",
                    event.capacity.toLocaleString(locale)
                  )
                : undefined
            }
          />
          <StatCard
            label={t.revenue}
            value={`\u20AC${(liveStats.revenueCents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
          />
          <StatCard
            label={t.checkedIn}
            value={`${liveStats.checkedIn.toLocaleString(locale)} (${liveStats.checkedInPct}%)`}
          />
          <StatCard
            label={daysUntil >= 0 ? t.startsIn : t.ended}
            value={daysLabel}
          />
        </StatGrid>
      </div>

      {/* Event Info */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.dateTime}
            </h2>
            <p className="mt-1">
              {new Date(event.starts_at).toLocaleDateString(locale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.starts_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              &ndash;{" "}
              {new Date(event.ends_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({event.timezone})
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.venue}
            </h2>
            <p className="mt-1">{event.venue_name || t.venueNotSet}</p>
            <p className="text-sm text-muted-foreground">
              {event.venue_address}
              {event.city && `, ${event.city}`}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.capacity}
            </h2>
            <p className="mt-1">
              {event.capacity} {t.attendees}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.maxPerOrder.replace(
                "{n}",
                String(event.max_tickets_per_order)
              )}
            </p>
          </section>

          {(ticketProgressPct != null || revenueProgressPct != null) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground">
                {t.salesTarget}
              </h2>
              <div className="mt-2 space-y-3">
                {ticketProgressPct != null && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {ticketsSoldForTarget}/{ticketTarget} {t.tickets}
                      </span>
                      <span className="font-medium">{ticketProgressPct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${ticketProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {revenueProgressPct != null && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {`\u20AC${(revenueForTarget / 100).toLocaleString()} / \u20AC${(revenueTarget! / 100).toLocaleString()}`}
                      </span>
                      <span className="font-medium">{revenueProgressPct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-green-500 transition-all"
                        style={{ width: `${revenueProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.paymentMethods}
            </h2>
            <div className="mt-1 flex gap-2">
              {event.enabled_payment_methods?.map((method: string) => (
                <Badge key={method} variant="default" className="capitalize">
                  {method}
                </Badge>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.description}
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {(event[descKey] as string) || event.description_en || t.noDescription}
            </p>
          </section>
        </div>
      </div>

      {/* Management Hub — all sub-pages grouped */}
      <div className="mt-12 space-y-10 border-t border-border pt-8">
        {/* Setup */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t.setup}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/tiers`} icon={Tag} title={t.ticketTiers} desc={t.ticketTiersDesc} />
            <HubLink href={`/${locale}/events/${id}/coupons`} icon={Scissors} title={t.couponCodes} desc={t.couponCodesDesc} />
            <HubLink href={`/${locale}/events/${id}/schedule`} icon={Calendar} title={t.scheduleSpeakers} desc={t.scheduleSpeakersDesc} />
            <HubLink href={`/${locale}/events/${id}/ticket-preview`} icon={TicketCheck} title={t.ticketPreview} desc={t.ticketPreviewDesc} />
          </div>
        </section>

        {/* Marketing */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t.marketing}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/emails`} icon={Mail} title={t.emailSequences} desc={t.emailSequencesDesc} />
            <HubLink href={`/${locale}/events/${id}/invitations`} icon={Gift} title={t.invitations} desc={t.invitationsDesc} />
            <HubLink href={`/${locale}/events/${id}/invitations/bulk`} icon={Upload} title={t.bulkInvitations} desc={t.bulkInvitationsDesc} />
          </div>
        </section>

        {/* Operations */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t.operations}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink
              href={`/${locale}/events/${id}/checklist`}
              icon={ListChecks}
              title={t.checklist}
              desc={`${checklist.progress.done}/${checklist.progress.total} (${clPct}%)${checklist.progress.overdue > 0 ? ` \u00B7 ${checklist.progress.overdue} ${t.checklistOverdueSuffix}` : ""}`}
            />
            <HubLink href={`/${locale}/events/${id}/runsheet`} icon={ClipboardList} title={t.runSheet} desc={t.runSheetDesc} />
            <HubLink href={`/${locale}/events/${id}/sponsors`} icon={Handshake} title={t.sponsors} desc={t.sponsorsDesc} />
            <HubLink href={`/${locale}/events/${id}/budget`} icon={Wallet} title={t.budgetExpenses} desc={t.budgetExpensesDesc} />
            <HubLink href={`/${locale}/events/${id}/live`} icon={Radio} title={t.liveDashboard} desc={t.liveDashboardDesc} />
          </div>
        </section>

        {/* Post-event */}
        <section>
          <h2 className="font-heading text-base font-semibold text-muted-foreground">
            {t.postEvent}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HubLink href={`/${locale}/events/${id}/attendees`} icon={Users} title={t.attendeesHub} desc={t.attendeesHubDesc} />
            <HubLink href={`/${locale}/events/${id}/media`} icon={ImageIcon} title={t.media} desc={t.mediaDesc} />
            <HubLink href={`/${locale}/events/${id}/poster`} icon={QrCode} title={t.posterDoor} desc={t.posterDoorDesc} />
          </div>
        </section>
      </div>

      {/* Danger zone */}
      <div className="mt-12 rounded-lg border border-red-200 p-6 dark:border-red-900/50">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
          {t.dangerZone}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.dangerDesc}
        </p>
        <DeleteEventButton
          eventId={id}
          eventTitle={event.title_en}
          locale={locale}
        />
      </div>
    </div>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Tag;
  title: string;
  desc: string;
}) {
  // h-full on both the Link and the Card so every card in a grid row
  // stretches to the height of the tallest sibling — otherwise rows
  // with longer descriptions tower over their neighbours.
  return (
    <Link href={href} className="block h-full">
      <Card
        padding="sm"
        className="group h-full rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/50"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" strokeWidth={1.75} />
          <div>
            <p className="font-medium group-hover:text-primary">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
