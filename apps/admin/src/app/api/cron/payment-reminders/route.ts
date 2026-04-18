import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import React from "react";
import {
  render,
  createEmailClient,
  fromAddressFor,
  PaymentReminderEmail,
} from "@dbc/email";

const CRON_SECRET = process.env.CRON_SECRET;
const TICKETS_URL =
  process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

export async function GET(req: Request) {
  if (
    CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find pending bank_transfer orders older than 3 days with no reminder sent
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total_cents, currency, recipient_name, recipient_email, locale, event:events(title_en, slug)"
    )
    .eq("status", "pending")
    .eq("payment_method", "bank_transfer")
    .lt("created_at", threeDaysAgo)
    .is("reminder_sent_at", null)
    .limit(50);

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const resend = createEmailClient();
  const from = fromAddressFor("tickets");
  let sent = 0;

  const SUBJECT = {
    en: "Payment reminder — DBC Germany",
    de: "Zahlungserinnerung — DBC Germany",
    fr: "Rappel de paiement — DBC Germany",
  };

  for (const order of orders) {
    try {
      const locale = (order.locale === "de" || order.locale === "fr"
        ? order.locale
        : "en") as "en" | "de" | "fr";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eventTitle = (order.event as any)?.title_en ?? "Event";

      const totalFormatted = `${order.currency === "EUR" ? "\u20AC" : order.currency}${(order.total_cents / 100).toFixed(2)}`;

      const html = await render(
        React.createElement(PaymentReminderEmail, {
          recipientName: order.recipient_name || "Customer",
          eventTitle,
          orderShortId: order.id.slice(0, 8).toUpperCase(),
          totalFormatted,
          orderUrl: `${TICKETS_URL}/${locale}/confirmation/${order.id}`,
          locale,
        })
      );

      await resend.emails.send({
        from,
        to: order.recipient_email,
        subject: SUBJECT[locale],
        html,
      });

      await supabase
        .from("orders")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id);

      sent++;
    } catch (err) {
      console.error(`[payment-reminder] failed for order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: orders.length });
}
