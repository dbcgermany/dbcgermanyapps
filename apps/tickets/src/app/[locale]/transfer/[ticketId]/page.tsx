import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import { TransferForm } from "./transfer-form";

export default async function TransferPage({
  params,
}: {
  params: Promise<{ locale: string; ticketId: string }>;
}) {
  const { locale, ticketId } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth?redirect=/${locale}/transfer/${ticketId}`);
  }

  // Fetch ticket + verify ownership + load event details
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, attendee_name, attendee_email, checked_in_at, is_transferred, tier_id, event_id, order_id"
    )
    .eq("id", ticketId)
    .single();

  if (!ticket) notFound();

  // Verify ownership
  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id")
    .eq("id", ticket.order_id)
    .single();

  if (!order || order.buyer_id !== user.id) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">
          {locale === "de" ? "Nicht autorisiert" : locale === "fr" ? "Non autoris\u00E9" : "Not authorized"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "de"
            ? "Sie sind nicht berechtigt, dieses Ticket zu \u00FCbertragen."
            : locale === "fr"
              ? "Vous n\u2019\u00EAtes pas autoris\u00E9 \u00E0 transf\u00E9rer ce billet."
              : "You are not authorized to transfer this ticket."}
        </p>
      </main>
    );
  }

  // Fetch event + tier for display
  const [{ data: event }, { data: tier }] = await Promise.all([
    supabase
      .from("events")
      .select("title_en, title_de, title_fr, ends_at")
      .eq("id", ticket.event_id)
      .single(),
    supabase
      .from("ticket_tiers")
      .select("name_en, name_de, name_fr")
      .eq("id", ticket.tier_id)
      .single(),
  ]);

  const eventEnded = event ? new Date(event.ends_at) < new Date() : false;
  const eventTitle = event
    ? ((event[`title_${locale}` as keyof typeof event] as string) ||
      event.title_en)
    : "";
  const tierName = tier
    ? ((tier[`name_${locale}` as keyof typeof tier] as string) || tier.name_en)
    : "";

  const t = {
    en: {
      title: "Transfer ticket",
      description: "Transfer this ticket to a new attendee. The current QR code will be invalidated immediately and a new ticket PDF will be sent to the new attendee.",
      currentAttendee: "Current attendee",
      blockedCheckedIn: "This ticket has already been checked in and cannot be transferred.",
      blockedEnded: "This event has already ended.",
      back: "Back to orders",
    },
    de: {
      title: "Ticket \u00FCbertragen",
      description: "\u00DCbertragen Sie dieses Ticket auf einen neuen Teilnehmer. Der aktuelle QR-Code wird sofort ung\u00FCltig und ein neues Ticket-PDF wird an den neuen Teilnehmer gesendet.",
      currentAttendee: "Aktueller Teilnehmer",
      blockedCheckedIn: "Dieses Ticket wurde bereits eingecheckt und kann nicht \u00FCbertragen werden.",
      blockedEnded: "Diese Veranstaltung ist bereits vorbei.",
      back: "Zur\u00FCck zu Bestellungen",
    },
    fr: {
      title: "Transf\u00E9rer le billet",
      description: "Transf\u00E9rez ce billet \u00E0 un nouveau participant. Le code QR actuel sera imm\u00E9diatement invalid\u00E9 et un nouveau PDF de billet sera envoy\u00E9 au nouveau participant.",
      currentAttendee: "Participant actuel",
      blockedCheckedIn: "Ce billet a d\u00E9j\u00E0 \u00E9t\u00E9 enregistr\u00E9 et ne peut pas \u00EAtre transf\u00E9r\u00E9.",
      blockedEnded: "Cet \u00E9v\u00E9nement est d\u00E9j\u00E0 termin\u00E9.",
      back: "Retour aux commandes",
    },
  }[locale] ?? {
    title: "Transfer ticket", description: "", currentAttendee: "Current attendee", blockedCheckedIn: "Already checked in.", blockedEnded: "Event ended.", back: "Back",
  };

  const blocked = Boolean(ticket.checked_in_at) || eventEnded;
  const blockedReason = ticket.checked_in_at
    ? t.blockedCheckedIn
    : eventEnded
      ? t.blockedEnded
      : null;

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Link
        href={`/${locale}/orders`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t.back}
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>

      {/* Current ticket card */}
      <div className="mt-6 rounded-lg border border-border p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t.currentAttendee}
        </p>
        <p className="mt-1 font-medium">{ticket.attendee_name}</p>
        <p className="text-sm text-muted-foreground">{ticket.attendee_email}</p>
        {eventTitle && (
          <p className="mt-3 text-sm">
            {eventTitle}
            {tierName && (
              <span className="text-muted-foreground"> &middot; {tierName}</span>
            )}
          </p>
        )}
      </div>

      {blocked ? (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {blockedReason}
        </div>
      ) : (
        <TransferForm ticketId={ticketId} locale={locale} />
      )}
    </main>
  );
}
