"use server";

import { createServerClient } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

interface JoinWaitlistInput {
  eventId: string;
  tierId: string;
  email: string;
  eventSlug: string;
  locale: string;
}

/**
 * Adds a buyer's email to the waitlist for a sold-out tier.
 * When inventory opens (via refund/transfer), the cron job notifies them.
 */
export async function joinWaitlist(input: JoinWaitlistInput) {
  const supabase = await createServerClient();

  if (!input.email.trim()) {
    return { error: "Email is required" };
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { error: "Invalid email address" };
  }

  // Verify tier belongs to event (prevent tampering)
  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, is_public")
    .eq("id", input.tierId)
    .single();

  if (!tier || tier.event_id !== input.eventId || !tier.is_public) {
    return { error: "Invalid tier" };
  }

  // Insert (unique constraint on event_id + tier_id + email prevents duplicates)
  const { error } = await supabase.from("waitlist_entries").insert({
    event_id: input.eventId,
    tier_id: input.tierId,
    email: input.email.trim().toLowerCase(),
  });

  if (error) {
    if (error.code === "23505") {
      // Duplicate — treat as idempotent success
      return { success: true };
    }
    return { error: error.message };
  }

  revalidatePath(`/${input.locale}/events/${input.eventSlug}`);
  return { success: true };
}
