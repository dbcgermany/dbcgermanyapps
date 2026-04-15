"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendTicketEmail } from "@dbc/email";
import { revalidatePath } from "next/cache";

export interface AttendeeSearchResult {
  ticket_id: string;
  ticket_token: string;
  event_id: string;
  event_title: string;
  event_starts_at: string;
  attendee_first_name: string | null;
  attendee_last_name: string | null;
  attendee_name: string;
  attendee_email: string;
  tier_name: string;
  checked_in_at: string | null;
  checked_in_by_name: string | null;
  acquisition_type: string;
  order_status: string;
}

/**
 * Fuzzy search tickets by attendee name / email. Optionally scope to one
 * event so scan staff only see the currently-running event.
 */
export async function searchAttendees(params: {
  query: string;
  eventId?: string;
  limit?: number;
}): Promise<AttendeeSearchResult[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const q = params.query.trim();
  if (q.length < 2) return [];

  let query = supabase
    .from("tickets")
    .select(
      `id, ticket_token, event_id, attendee_first_name, attendee_last_name,
       attendee_name, attendee_email, checked_in_at,
       tier:ticket_tiers(name_en),
       event:events(title_en, starts_at),
       checked_in_by_profile:profiles!tickets_checked_in_by_fkey(display_name),
       order:orders(acquisition_type, status)`
    )
    .or(
      `attendee_email.ilike.%${q}%,attendee_first_name.ilike.%${q}%,attendee_last_name.ilike.%${q}%,attendee_name.ilike.%${q}%`
    )
    .limit(params.limit ?? 20);

  if (params.eventId) {
    query = query.eq("event_id", params.eventId);
  }

  const { data } = await query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((t) => ({
    ticket_id: t.id,
    ticket_token: t.ticket_token,
    event_id: t.event_id,
    event_title: t.event?.title_en ?? "",
    event_starts_at: t.event?.starts_at ?? "",
    attendee_first_name: t.attendee_first_name,
    attendee_last_name: t.attendee_last_name,
    attendee_name: t.attendee_name,
    attendee_email: t.attendee_email,
    tier_name: t.tier?.name_en ?? "Ticket",
    checked_in_at: t.checked_in_at,
    checked_in_by_name: t.checked_in_by_profile?.display_name ?? null,
    acquisition_type: t.order?.acquisition_type ?? "purchased",
    order_status: t.order?.status ?? "paid",
  }));
}

/**
 * Resend the ticket PDF to the original attendee email, or to an override
 * email if the visitor lost access to their inbox. Logs to audit_log.
 */
export async function resendTicketPdf(
  ticketId: string,
  overrideEmail?: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  // Fetch ticket + event + tier + company_info in parallel
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `id, order_id, event_id, ticket_token, attendee_name, attendee_email,
       tier:ticket_tiers(name_en, name_de, name_fr),
       event:events(title_en, title_de, title_fr, event_type, starts_at, ends_at,
                    venue_name, venue_address, city, timezone),
       order:orders(locale, acquisition_type)`
    )
    .eq("id", ticketId)
    .single();

  if (error || !ticket) return { error: "Ticket not found." };

  const { data: companyInfo } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = ticket as any;
  const locale = (tAny.order?.locale as "en" | "de" | "fr") ?? "en";
  const eventTitle =
    tAny.event[`title_${locale}`] || tAny.event.title_en;
  const tierName =
    tAny.tier[`name_${locale}`] || tAny.tier.name_en;

  const legalName = companyInfo
    ? [companyInfo.legal_name, companyInfo.legal_form]
        .filter(Boolean)
        .join(" ")
    : undefined;

  const recipient = overrideEmail?.trim() || tAny.attendee_email;

  try {
    await sendTicketEmail({
      attendeeName: tAny.attendee_name,
      attendeeEmail: recipient,
      eventTitle,
      eventType: tAny.event.event_type,
      startsAt: new Date(tAny.event.starts_at),
      endsAt: new Date(tAny.event.ends_at),
      venueName: tAny.event.venue_name ?? "",
      venueAddress: tAny.event.venue_address ?? "",
      city: tAny.event.city ?? "",
      timezone: tAny.event.timezone,
      tierName,
      ticketToken: tAny.ticket_token,
      locale,
      orderUrl: `${
        process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com"
      }/${locale}/confirmation/${tAny.order_id}`,
      brandName: companyInfo?.brand_name ?? undefined,
      legalName,
      supportEmail: companyInfo?.support_email ?? undefined,
      primaryColor: companyInfo?.primary_color ?? undefined,
      logoUrl: companyInfo?.logo_light_url ?? undefined,
      isInvitation:
        tAny.order?.acquisition_type === "invited" ||
        tAny.order?.acquisition_type === "assigned",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "resend_ticket",
    entity_type: "tickets",
    entity_id: ticketId,
    details: { to: recipient, overridden: Boolean(overrideEmail) },
  });

  revalidatePath("/[locale]/contacts", "layout");
  return { success: true };
}

/**
 * Mark a ticket as checked in manually (same atomic RPC the camera scanner
 * uses). Used from the contact profile Tickets tab and from the scan page's
 * quick-find fallback.
 */
export async function manualCheckIn(
  ticketToken: string,
  eventId: string
): Promise<
  | { success: true; attendee_name: string }
  | { error: string; alreadyAt?: string; alreadyBy?: string }
> {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("check_in_ticket", {
    p_ticket_token: ticketToken,
    p_event_id: eventId,
    p_staff_id: user.userId,
  });

  if (error) return { error: error.message };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (data ?? {}) as any;
  if (result.success === false) {
    return {
      error: "Already checked in.",
      alreadyAt: result.already_checked_in_at,
      alreadyBy: result.already_checked_in_by_name,
    };
  }

  revalidatePath("/[locale]/contacts", "layout");
  revalidatePath("/[locale]/scan", "layout");
  return { success: true, attendee_name: result.attendee_name ?? "" };
}
