"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendTicketsForOrder } from "@/lib/send-tickets-for-order";
import { captureServerError } from "@/lib/observe";

// Self-service "resend tickets to my email" from the confirmation page.
//
// The confirmation URL is keyed by order UUID — anyone with the link could
// theoretically trigger this, so we rate-limit aggressively (1 / minute, 5 /
// 24h per order) and rely on the underlying sendTicketsForOrder being
// idempotent at the per-ticket level (only un-sent rows fire unless
// forceResend is set, and we never set it from this action).

const RESEND_WINDOW_SHORT_SECONDS = 60;
const RESEND_WINDOW_LONG_SECONDS = 24 * 60 * 60;
const RESEND_MAX_SHORT = 1;
const RESEND_MAX_LONG = 5;

export async function resendOrderTickets(
  orderId: string
): Promise<{ ok?: boolean; error?: string; sent?: number; skipped?: number }> {
  if (!orderId || !/^[0-9a-fA-F-]{32,40}$/.test(orderId)) {
    return { error: "Invalid order id." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  const sinceShort = new Date(
    Date.now() - RESEND_WINDOW_SHORT_SECONDS * 1000
  ).toISOString();
  const sinceLong = new Date(
    Date.now() - RESEND_WINDOW_LONG_SECONDS * 1000
  ).toISOString();

  const { count: shortHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "ticket_resend")
    .eq("key", orderId)
    .gte("occurred_at", sinceShort);
  if ((shortHits ?? 0) >= RESEND_MAX_SHORT) {
    return {
      error: "Please wait a minute before resending again.",
    };
  }

  const { count: longHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "ticket_resend")
    .eq("key", orderId)
    .gte("occurred_at", sinceLong);
  if ((longHits ?? 0) >= RESEND_MAX_LONG) {
    return {
      error:
        "You've requested resends multiple times today. Please contact support if you still haven't received your tickets.",
    };
  }

  await supabase.from("abuse_events").insert({
    scope: "ticket_resend",
    key: orderId,
    ip,
  });

  try {
    const result = await sendTicketsForOrder(supabase, orderId, {
      forceResend: false,
    });
    return { ok: true, sent: result.sent, skipped: result.skipped };
  } catch (err) {
    captureServerError(err, {
      scope: "ticket_resend_self_service",
      data: { order_id: orderId },
    });
    return {
      error:
        "Could not resend right now. Please try again in a minute or contact support.",
    };
  }
}
