import { redirect } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";

/**
 * Legacy /tickets/send route. Replaced by per-event Invitations
 * (with a delivery-mode toggle for ticket-only vs ticket-with-letter).
 * Existing bookmarks land on the most recent published event's invitations.
 */
export default async function LegacySendTicketsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("is_published", true)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (event?.id) {
    redirect(`/${locale}/events/${event.id}/invitations`);
  }
  redirect(`/${locale}/events`);
}
