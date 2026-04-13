import { render } from "@react-email/components";
import React from "react";
import { createEmailClient } from "./client";
import { TransferConfirmationEmail } from "./templates/transfer-confirmation";
import { WaitlistNotificationEmail } from "./templates/waitlist-notification";
import { OrderReceiptEmail } from "./templates/order-receipt";
import { AftercareSequenceEmail } from "./templates/aftercare-sequence";
import { AdminAlertEmail } from "./templates/admin-alert";

type Locale = "en" | "de" | "fr";

function fromAddress() {
  return (
    process.env.RESEND_FROM_ADDRESS ?? "DBC Germany <tickets@dbc-germany.com>"
  );
}

export interface SendTransferConfirmationInput {
  to: string;
  recipientName: string;
  previousHolderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  tierName: string;
  ticketShortId: string;
  orderUrl: string;
  locale: Locale;
}

const TRANSFER_SUBJECT = {
  en: "Your ticket for {event} has been transferred",
  de: "Ihr Ticket f\u00FCr {event} wurde \u00FCbertragen",
  fr: "Votre billet pour {event} a \u00E9t\u00E9 transf\u00E9r\u00E9",
};

export async function sendTransferConfirmation(
  input: SendTransferConfirmationInput
) {
  const html = await render(
    React.createElement(TransferConfirmationEmail, {
      recipientName: input.recipientName,
      recipientEmail: input.to,
      previousHolderName: input.previousHolderName,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      venueName: input.venueName,
      tierName: input.tierName,
      ticketShortId: input.ticketShortId,
      orderUrl: input.orderUrl,
      locale: input.locale,
    })
  );
  const subject = TRANSFER_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendWaitlistNotificationInput {
  to: string;
  eventTitle: string;
  tierName: string;
  expiresAt: string;
  checkoutUrl: string;
  locale: Locale;
}

const WAITLIST_SUBJECT = {
  en: "A ticket just opened up for {event}",
  de: "Ein Ticket f\u00FCr {event} ist freigeworden",
  fr: "Un billet vient de se lib\u00E9rer pour {event}",
};

export async function sendWaitlistNotification(
  input: SendWaitlistNotificationInput
) {
  const html = await render(
    React.createElement(WaitlistNotificationEmail, {
      recipientEmail: input.to,
      eventTitle: input.eventTitle,
      tierName: input.tierName,
      expiresAt: input.expiresAt,
      checkoutUrl: input.checkoutUrl,
      locale: input.locale,
    })
  );
  const subject = WAITLIST_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendOrderReceiptInput {
  to: string;
  recipientName: string;
  orderShortId: string;
  eventTitle: string;
  subtotalFormatted: string;
  discountFormatted: string | null;
  totalFormatted: string;
  paymentMethod: string | null;
  orderUrl: string;
  lineItems: Array<{ description: string; amount: string }>;
  locale: Locale;
}

const RECEIPT_SUBJECT = {
  en: "Receipt for your {event} order",
  de: "Quittung f\u00FCr Ihre Bestellung \u2013 {event}",
  fr: "Re\u00E7u pour votre commande \u2013 {event}",
};

export async function sendOrderReceipt(input: SendOrderReceiptInput) {
  const html = await render(
    React.createElement(OrderReceiptEmail, {
      recipientName: input.recipientName,
      orderShortId: input.orderShortId,
      eventTitle: input.eventTitle,
      subtotalFormatted: input.subtotalFormatted,
      discountFormatted: input.discountFormatted,
      totalFormatted: input.totalFormatted,
      paymentMethod: input.paymentMethod,
      orderUrl: input.orderUrl,
      lineItems: input.lineItems,
      locale: input.locale,
    })
  );
  const subject = RECEIPT_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendAftercareSequenceInput {
  to: string;
  subject: string;
  body: string;
  eventTitle: string;
  galleryUrl?: string | null;
  locale: Locale;
}

export async function sendAftercareSequence(input: SendAftercareSequenceInput) {
  const html = await render(
    React.createElement(AftercareSequenceEmail, {
      subject: input.subject,
      body: input.body,
      eventTitle: input.eventTitle,
      galleryUrl: input.galleryUrl ?? null,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendAdminAlertInput {
  to: string | string[];
  subject: string;
  headline: string;
  body: string;
  details?: Record<string, string>;
  dashboardUrl?: string;
  severity?: "info" | "warning" | "critical";
  locale: Locale;
}

export async function sendAdminAlert(input: SendAdminAlertInput) {
  const html = await render(
    React.createElement(AdminAlertEmail, {
      subject: input.subject,
      headline: input.headline,
      body: input.body,
      details: input.details,
      dashboardUrl: input.dashboardUrl,
      severity: input.severity,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}
