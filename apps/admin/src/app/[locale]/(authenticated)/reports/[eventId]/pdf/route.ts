import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole, createServerClient } from "@dbc/supabase/server";
import {
  getEventReportData,
  type EventReportSections,
} from "@/actions/event-report";
import { EventReportPdf } from "@/components/event-report-pdf";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ locale: string; eventId: string }> }
) {
  const user = await requireRole("admin");
  const { locale, eventId } = await ctx.params;

  const url = new URL(req.url);
  const sectionsParam = (url.searchParams.get("sections") ?? "kpis,tiers,demographics,attendees")
    .split(",")
    .map((s) => s.trim());
  const sections: EventReportSections = {
    kpis: sectionsParam.includes("kpis"),
    tiers: sectionsParam.includes("tiers"),
    demographics: sectionsParam.includes("demographics"),
    attendees: sectionsParam.includes("attendees"),
  };

  const data = await getEventReportData({ eventId, locale, sections });

  const element = React.createElement(EventReportPdf, {
    locale,
    sections,
    data,
  });
  // react-pdf's TS types expect a DocumentProps element; our component returns
  // a Document internally — runtime works correctly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = (await renderToBuffer(element as any)) as Buffer;

  const supabase = await createServerClient();
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "export_event_report",
    entity_type: "events",
    entity_id: eventId,
    details: { sections: sectionsParam },
  });

  const fileName = `event-report-${eventId.slice(0, 8)}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
