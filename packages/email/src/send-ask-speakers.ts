import { render } from "@react-email/components";
import React from "react";
import { createEmailClient, fromAddressFor, replyToAddressFor } from "./client";
import {
  AskSpeakersEmail,
  type AskSpeakersEmailSpeaker,
} from "./templates/ask-speakers";

type Locale = "en" | "de" | "fr";

const ASK_SUBJECT = {
  en: "Have a question for our speakers? — {event}",
  de: "Eine Frage an unsere Speaker? — {event}",
  fr: "Une question pour nos intervenants ? — {event}",
};

export interface SendAskSpeakersInput {
  to: string;
  recipientName: string;
  eventTitle: string;
  ticketToken: string;
  speakers: AskSpeakersEmailSpeaker[];
  locale: Locale;
  ticketsBaseUrl: string;
}

export async function sendAskSpeakersEmail(
  input: SendAskSpeakersInput
): Promise<{ id: string }> {
  const askUrl = `${input.ticketsBaseUrl.replace(/\/$/, "")}/${input.locale}/tickets/${input.ticketToken}/ask`;

  const html = await render(
    React.createElement(AskSpeakersEmail, {
      attendeeName: input.recipientName,
      eventTitle: input.eventTitle,
      askUrl,
      speakers: input.speakers,
      locale: input.locale,
    })
  );

  const subject = ASK_SUBJECT[input.locale].replace("{event}", input.eventTitle);

  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddressFor("tickets"),
    replyTo: replyToAddressFor("tickets"),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}
