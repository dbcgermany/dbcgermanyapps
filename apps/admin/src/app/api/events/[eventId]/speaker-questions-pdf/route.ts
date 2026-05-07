import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  generateSpeakerQuestionsPdf,
  type SpeakerQuestionsPdfSpeakerGroup,
} from "@dbc/email";

interface QuestionRow {
  question: string;
  attendee_name: string;
  created_at: string;
  status: string;
  speaker_id: string;
}

interface SpeakerJoinRow {
  speaker_id: string;
  role_label_en: string | null;
  role_label_de: string | null;
  role_label_fr: string | null;
  is_featured: boolean;
  sort_order: number;
  speakers:
    | {
        id: string;
        first_name: string;
        last_name: string;
        photo_url: string | null;
        title_en: string | null;
        title_de: string | null;
        title_fr: string | null;
      }
    | Array<{
        id: string;
        first_name: string;
        last_name: string;
        photo_url: string | null;
        title_en: string | null;
        title_de: string | null;
        title_fr: string | null;
      }>
    | null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  await requireRole("manager");

  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale = (
    localeParam === "de" || localeParam === "fr" ? localeParam : "en"
  ) as "en" | "de" | "fr";

  // Optional ?status=new,shortlisted to limit which questions are printed.
  // Default: include everything except 'declined' so the brief stays signal-rich.
  const statusParam = url.searchParams.get("status");
  const allowedStatuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["new", "shortlisted", "answered"];

  const supabase = await createServerClient();

  const [eventRes, joinsRes, questionsRes, companyRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title_en, title_de, title_fr, starts_at")
      .eq("id", eventId)
      .single(),
    supabase
      .from("event_speakers")
      .select(
        "speaker_id, role_label_en, role_label_de, role_label_fr, is_featured, sort_order, speakers ( id, first_name, last_name, photo_url, title_en, title_de, title_fr )"
      )
      .eq("event_id", eventId)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("speaker_questions")
      .select("question, attendee_name, created_at, status, speaker_id")
      .eq("event_id", eventId)
      .in("status", allowedStatuses)
      .order("created_at", { ascending: true }),
    supabase
      .from("company_info")
      .select(
        "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (eventRes.error || !eventRes.data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = eventRes.data;
  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const joins = (joinsRes.data ?? []) as SpeakerJoinRow[];
  const questions = (questionsRes.data ?? []) as QuestionRow[];

  const questionsBySpeaker = new Map<
    string,
    Array<{ question: string; attendeeName: string; createdAt: string }>
  >();
  for (const q of questions) {
    const list = questionsBySpeaker.get(q.speaker_id) ?? [];
    list.push({
      question: q.question,
      attendeeName: q.attendee_name,
      createdAt: q.created_at,
    });
    questionsBySpeaker.set(q.speaker_id, list);
  }

  const groups: SpeakerQuestionsPdfSpeakerGroup[] = joins.flatMap((row) => {
    const sp = Array.isArray(row.speakers) ? row.speakers[0] : row.speakers;
    if (!sp) return [];
    const roleLabel =
      (row[`role_label_${locale}` as keyof typeof row] as string | null) ||
      row.role_label_en ||
      (sp[`title_${locale}` as keyof typeof sp] as string | null) ||
      sp.title_en ||
      "";
    return [
      {
        speakerId: sp.id,
        speakerName: `${sp.first_name} ${sp.last_name}`.trim(),
        roleLabel,
        photoUrl: sp.photo_url ?? null,
        questions: questionsBySpeaker.get(sp.id) ?? [],
      },
    ];
  });

  const company = companyRes.data;
  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";

  const pdfBuffer = await generateSpeakerQuestionsPdf({
    eventTitle,
    eventStartsAt: new Date(event.starts_at),
    groups,
    locale,
    brandName: company?.brand_name ?? "DBC Germany",
    legalName,
    supportEmail: company?.support_email ?? "info@dbc-germany.com",
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="speaker-questions-${eventId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
