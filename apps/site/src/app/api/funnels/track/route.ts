import { NextResponse } from "next/server";
import { createServerClient } from "@dbc/supabase/server";
import { FUNNEL_EVENT_TYPES, type FunnelEventType } from "@dbc/types";

// Accept both JSON and beacon payloads (which have no content-type). A
// beacon can't set headers, so we just read the body as text and parse.
async function readBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type Payload = {
  funnelId: string;
  eventType: FunnelEventType;
  sessionId: string;
  locale: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
};

function isEventType(v: unknown): v is FunnelEventType {
  return (
    typeof v === "string" &&
    (FUNNEL_EVENT_TYPES as readonly string[]).includes(v)
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await readBody(req)) as Partial<Payload> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }
  if (typeof body.funnelId !== "string" || typeof body.sessionId !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!isEventType(body.eventType)) {
    return NextResponse.json({ error: "bad_event_type" }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.rpc("insert_funnel_event", {
      p_funnel_id: body.funnelId,
      p_event_type: body.eventType,
      p_session_id: body.sessionId,
      p_locale: body.locale ?? null,
      p_utm_source: body.utmSource ?? null,
      p_utm_medium: body.utmMedium ?? null,
      p_utm_campaign: body.utmCampaign ?? null,
      p_referrer: body.referrer ?? null,
    });
    if (error) {
      console.error("[funnels/track] rpc error", error.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[funnels/track] unexpected", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
