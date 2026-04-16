import { complete } from "../client";

export interface DashboardDigestInput {
  eventTitle: string;
  asOf: string; // ISO date
  currentPeriod: {
    revenueCents: number;
    ticketsSold: number;
    refundCents: number;
    checkInCount: number;
  };
  priorPeriod: {
    revenueCents: number;
    ticketsSold: number;
    refundCents: number;
    checkInCount: number;
  };
  capacity: number;
  daysUntilEvent: number;
}

export interface DashboardDigestOutput {
  summary: string; // ≤3 short sentences
  highlights: string[]; // ≤3 bullets
  risks: string[]; // ≤3 bullets
}

const CACHED_SYSTEM = `You are the ops analyst for DBC Germany, an event company running the Richesses d'Afrique Germany 2026 conference. Your job: read daily KPI deltas and return a calm, factual 30-second digest for admins.

Rules:
- Be specific with numbers and deltas (use absolute + %).
- Flag material regressions (>20% drop) and material wins (>20% gain).
- Do not invent numbers. If a field is 0 or absent, say so.
- Never use exclamation marks, emojis, or hype language.
- Output valid JSON only, matching the schema: { summary: string, highlights: string[], risks: string[] }.`;

export async function dashboardDigestPrompt(
  input: DashboardDigestInput
): Promise<DashboardDigestOutput> {
  const userPrompt = `Event: ${input.eventTitle}
As of: ${input.asOf}
Days until event: ${input.daysUntilEvent}
Capacity: ${input.capacity}

Today vs yesterday:
- Revenue: €${(input.currentPeriod.revenueCents / 100).toFixed(2)} (prior: €${(input.priorPeriod.revenueCents / 100).toFixed(2)})
- Tickets sold: ${input.currentPeriod.ticketsSold} (prior: ${input.priorPeriod.ticketsSold})
- Refunds: €${(input.currentPeriod.refundCents / 100).toFixed(2)} (prior: €${(input.priorPeriod.refundCents / 100).toFixed(2)})
- Check-ins: ${input.currentPeriod.checkInCount} (prior: ${input.priorPeriod.checkInCount})

Return JSON with: summary (≤3 short sentences), highlights (≤3 bullets of wins), risks (≤3 bullets of regressions or watch-items).`;

  const raw = await complete({
    model: "claude-sonnet-4-6",
    cachedSystem: CACHED_SYSTEM,
    system: "Output JSON only.",
    userPrompt,
    maxTokens: 800,
  });

  // Extract JSON from response (tolerate wrapping text)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response did not contain JSON");
  }
  const parsed = JSON.parse(match[0]) as DashboardDigestOutput;
  return parsed;
}
