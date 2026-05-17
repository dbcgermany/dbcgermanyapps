import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";
import {
  SponsorsPdf,
  type SponsorsPdfProps,
  type SponsorEntry,
  type SponsorTier,
} from "./sponsors-pdf";

/**
 * Loose row shape — accepts whatever the caller's Supabase client returns.
 * Only the fields the PDF actually uses are typed.
 */
export interface SponsorRow {
  id: string;
  company_name: string;
  tier: SponsorTier | string;
  sector: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  logo_url: string | null;
  website_url: string | null;
}

export interface GenerateSponsorsInput {
  eventTitle: string;
  startsAt: Date;
  city: string;
  sponsors: SponsorRow[];
  locale: "en" | "de" | "fr";
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
}

const VALID_TIERS: SponsorTier[] = [
  "title",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "partner",
  "media",
];

function pickDescription(row: SponsorRow, locale: "en" | "de" | "fr"): string | null {
  const localized =
    locale === "de"
      ? row.description_de
      : locale === "fr"
        ? row.description_fr
        : row.description_en;
  // Fall back to English if the requested locale is empty, then null if even
  // English is missing — the template tolerates a missing description.
  return localized || row.description_en || null;
}

function isValidTier(tier: string): tier is SponsorTier {
  return (VALID_TIERS as string[]).includes(tier);
}

export async function generateSponsorsPdf(
  input: GenerateSponsorsInput
): Promise<Buffer> {
  // Batch-generate QR codes (one per sponsor with a website). Sponsors
  // without a website still render — just without a QR.
  const sponsorEntries: SponsorEntry[] = await Promise.all(
    input.sponsors
      .filter((row) => isValidTier(row.tier))
      .map(async (row) => {
        let qrDataUrl: string | null = null;
        if (row.website_url) {
          try {
            qrDataUrl = await QRCode.toDataURL(row.website_url, {
              errorCorrectionLevel: "M",
              width: 240,
              margin: 1,
              color: { dark: "#111111", light: "#ffffff" },
            });
          } catch {
            qrDataUrl = null;
          }
        }
        return {
          id: row.id,
          companyName: row.company_name,
          tier: row.tier as SponsorTier,
          sector: row.sector,
          description: pickDescription(row, input.locale),
          logoUrl: row.logo_url,
          websiteUrl: row.website_url,
          qrDataUrl,
        };
      })
  );

  const eventDate = input.startsAt.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const generatedDate = new Date().toLocaleDateString(input.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const props: SponsorsPdfProps = {
    eventTitle: input.eventTitle,
    eventDate,
    city: input.city,
    sponsors: sponsorEntries,
    locale: input.locale,
    generatedDate,
    brandName: input.brandName,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(SponsorsPdf, props) as any
  );

  return pdfBuffer;
}
