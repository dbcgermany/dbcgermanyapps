import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  SpeakerQuestionsPdf,
  type SpeakerQuestionsPdfProps,
  type SpeakerQuestionsPdfSpeakerGroup,
} from "./speaker-questions-pdf";

export interface GenerateSpeakerQuestionsInput {
  eventTitle: string;
  eventStartsAt: Date;
  groups: SpeakerQuestionsPdfSpeakerGroup[];
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateSpeakerQuestionsPdf(
  input: GenerateSpeakerQuestionsInput
): Promise<Buffer> {
  const eventDate = input.eventStartsAt.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const generatedDate = new Date().toLocaleString(input.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const props: SpeakerQuestionsPdfProps = {
    eventTitle: input.eventTitle,
    eventDate,
    groups: input.groups,
    locale: input.locale,
    generatedDate,
    brandName: input.brandName || "DBC Germany",
    legalName: input.legalName || "DBC Germany",
    supportEmail: input.supportEmail || "info@dbc-germany.com",
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(SpeakerQuestionsPdf, props) as any
  );

  return pdfBuffer;
}
