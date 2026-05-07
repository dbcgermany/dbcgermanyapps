"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export type SpeakerQuestionStatus =
  | "new"
  | "shortlisted"
  | "answered"
  | "declined";

export interface AdminSpeakerQuestion {
  id: string;
  event_id: string;
  speaker_id: string;
  ticket_id: string;
  attendee_name: string;
  attendee_email: string;
  locale: string;
  question: string;
  status: SpeakerQuestionStatus;
  admin_notes: string | null;
  created_at: string;
  speaker_first_name: string;
  speaker_last_name: string;
  speaker_photo_url: string | null;
  speaker_role_label_en: string | null;
  speaker_role_label_de: string | null;
  speaker_role_label_fr: string | null;
}

interface RawJoinRow {
  id: string;
  event_id: string;
  speaker_id: string;
  ticket_id: string;
  attendee_name: string;
  attendee_email: string;
  locale: string;
  question: string;
  status: SpeakerQuestionStatus;
  admin_notes: string | null;
  created_at: string;
  speakers:
    | { first_name: string; last_name: string; photo_url: string | null }
    | Array<{ first_name: string; last_name: string; photo_url: string | null }>
    | null;
}

interface EventSpeakerLinkRow {
  speaker_id: string;
  role_label_en: string | null;
  role_label_de: string | null;
  role_label_fr: string | null;
}

export async function getEventSpeakerQuestions(
  eventId: string
): Promise<AdminSpeakerQuestion[]> {
  await requireRole("manager");
  const supabase = await createServerClient();

  const [questionsRes, linksRes] = await Promise.all([
    supabase
      .from("speaker_questions")
      .select(
        "id, event_id, speaker_id, ticket_id, attendee_name, attendee_email, locale, question, status, admin_notes, created_at, speakers ( first_name, last_name, photo_url )"
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_speakers")
      .select("speaker_id, role_label_en, role_label_de, role_label_fr")
      .eq("event_id", eventId),
  ]);

  if (questionsRes.error) throw new Error(questionsRes.error.message);

  const linkMap = new Map<string, EventSpeakerLinkRow>(
    ((linksRes.data ?? []) as EventSpeakerLinkRow[]).map((r) => [
      r.speaker_id,
      r,
    ])
  );

  return ((questionsRes.data ?? []) as RawJoinRow[]).map((r) => {
    const sp = Array.isArray(r.speakers) ? r.speakers[0] : r.speakers;
    const link = linkMap.get(r.speaker_id);
    return {
      id: r.id,
      event_id: r.event_id,
      speaker_id: r.speaker_id,
      ticket_id: r.ticket_id,
      attendee_name: r.attendee_name,
      attendee_email: r.attendee_email,
      locale: r.locale,
      question: r.question,
      status: r.status,
      admin_notes: r.admin_notes,
      created_at: r.created_at,
      speaker_first_name: sp?.first_name ?? "",
      speaker_last_name: sp?.last_name ?? "",
      speaker_photo_url: sp?.photo_url ?? null,
      speaker_role_label_en: link?.role_label_en ?? null,
      speaker_role_label_de: link?.role_label_de ?? null,
      speaker_role_label_fr: link?.role_label_fr ?? null,
    };
  });
}

export async function updateSpeakerQuestionStatus(
  questionId: string,
  status: SpeakerQuestionStatus,
  eventId: string,
  locale: string
): Promise<{ success?: true; error?: string }> {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("speaker_questions")
    .update({ status })
    .eq("id", questionId)
    .eq("event_id", eventId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_speaker_question_status",
    entity_type: "speaker_questions",
    entity_id: questionId,
    details: { event_id: eventId, status },
  });

  revalidatePath(`/${locale}/events/${eventId}/questions`);
  return { success: true };
}

export async function updateSpeakerQuestionNotes(
  questionId: string,
  notes: string,
  eventId: string,
  locale: string
): Promise<{ success?: true; error?: string }> {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("speaker_questions")
    .update({ admin_notes: notes })
    .eq("id", questionId)
    .eq("event_id", eventId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_speaker_question_notes",
    entity_type: "speaker_questions",
    entity_id: questionId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/questions`);
  return { success: true };
}
