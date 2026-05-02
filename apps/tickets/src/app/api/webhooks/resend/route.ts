import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Resend signs webhooks via Svix-compatible HMAC. Secret format: whsec_xxxx.
//
// Headers:
//   svix-id        unique event id
//   svix-timestamp unix seconds
//   svix-signature space-separated list of "v1,<base64(hmac)>" entries
//
// To enable: in Resend Dashboard -> Webhooks add an endpoint pointing at
// https://tickets.dbc-germany.com/api/webhooks/resend, copy the signing
// secret, set as RESEND_WEBHOOK_SECRET on the tickets Vercel project.
// Subscribed events: email.bounced, email.complained.

interface ResendEventBase {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    to?: string[];
    bounce?: { reason?: string; type?: string };
    complaint?: { reason?: string };
  };
}

function verifySignature(
  secretEnv: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  body: string
): boolean {
  // Strip whsec_ prefix and base64-decode the secret bytes (Svix convention).
  const raw = secretEnv.startsWith("whsec_") ? secretEnv.slice(6) : secretEnv;
  let keyBytes: Buffer;
  try {
    keyBytes = Buffer.from(raw, "base64");
  } catch {
    return false;
  }
  const signedPayload = `${svixId}.${svixTimestamp}.${body}`;
  const expected = createHmac("sha256", keyBytes).update(signedPayload).digest();

  // svix-signature can carry multiple sigs separated by spaces, each
  // formatted as "v1,<base64>".
  const sigs = svixSignature.split(" ");
  for (const sig of sigs) {
    const idx = sig.indexOf(",");
    if (idx === -1) continue;
    const candidate = sig.slice(idx + 1);
    let candidateBytes: Buffer;
    try {
      candidateBytes = Buffer.from(candidate, "base64");
    } catch {
      continue;
    }
    if (
      candidateBytes.length === expected.length &&
      timingSafeEqual(candidateBytes, expected)
    ) {
      return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Webhook hasn't been wired yet on Resend side. Accept-and-discard would
    // mask deliverability bugs, so we 503 visibly.
    return NextResponse.json(
      { error: "webhook not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  // Replay protection: reject events older than 5 min.
  const ts = parseInt(svixTimestamp, 10);
  if (
    !Number.isFinite(ts) ||
    Math.abs(Date.now() / 1000 - ts) > 5 * 60
  ) {
    return NextResponse.json({ error: "stale signature" }, { status: 400 });
  }
  if (!verifySignature(secret, svixId, svixTimestamp, svixSignature, body)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: ResendEventBase;
  try {
    event = JSON.parse(body) as ResendEventBase;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Idempotency: dedupe by Svix event id.
  const { data: existing } = await supabase
    .from("processed_webhooks")
    .select("id")
    .eq("id", svixId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  await supabase
    .from("processed_webhooks")
    .insert({ id: svixId, source: "resend" });

  const recipients = (event.data?.to ?? []).map((s) => s.toLowerCase());
  if (recipients.length === 0) {
    return NextResponse.json({ received: true, skipped: "no recipient" });
  }

  if (event.type === "email.bounced") {
    const reason =
      event.data.bounce?.reason ?? event.data.bounce?.type ?? null;
    for (const email of recipients) {
      await supabase
        .from("contacts")
        .update({
          email_status: "bounced",
          bounced_at: event.created_at ?? new Date().toISOString(),
          bounced_reason: reason,
        })
        .eq("email", email);
    }
    await supabase.from("audit_log").insert({
      action: "email_bounced",
      entity_type: "contacts",
      entity_id: null,
      details: {
        source: "resend_webhook",
        svix_event_id: svixId,
        recipients,
        reason,
      },
    });
    return NextResponse.json({ received: true, marked: recipients.length });
  }

  if (event.type === "email.complained") {
    for (const email of recipients) {
      await supabase
        .from("contacts")
        .update({
          email_status: "complained",
          complained_at: event.created_at ?? new Date().toISOString(),
        })
        .eq("email", email);
    }
    await supabase.from("audit_log").insert({
      action: "email_complained",
      entity_type: "contacts",
      entity_id: null,
      details: {
        source: "resend_webhook",
        svix_event_id: svixId,
        recipients,
      },
    });
    return NextResponse.json({ received: true, marked: recipients.length });
  }

  // Unhandled event types are accepted to avoid Resend retry storms.
  return NextResponse.json({ received: true, ignored: event.type });
}
