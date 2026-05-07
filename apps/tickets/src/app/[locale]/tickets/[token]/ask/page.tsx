import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AskSpeakerForm } from "./ask-speaker-form";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

const TOKEN_RE = /^[0-9a-fA-F-]{32,40}$/;
const PER_TICKET_LIFETIME_CAP = 3;

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

const COPY = {
  en: {
    title: "Ask our speakers a question",
    subtitle:
      "Pick a speaker and write your question — we'll route it to our programme team.",
    closedTitle: "Submissions closed",
    closedBody: "This event has ended. Thank you for being part of it.",
    invalidTitle: "Page unavailable",
    notPaidBody:
      "We couldn't find a paid ticket for this link. If you just bought a ticket, give it a moment and refresh.",
    capReachedTitle: "Thanks — you've sent all three.",
    capReachedBody:
      "You've reached the limit of three questions for this ticket. We're looking forward to your visit.",
    remaining: (n: number) =>
      n === 1
        ? "You can ask 1 more question after this."
        : `You can ask ${n} more questions after this.`,
  },
  de: {
    title: "Stellen Sie unseren Speakern eine Frage",
    subtitle:
      "Wählen Sie eine Speaker:in und formulieren Sie Ihre Frage — unser Programmteam leitet sie weiter.",
    closedTitle: "Einreichungen geschlossen",
    closedBody:
      "Diese Veranstaltung ist beendet. Danke, dass Sie dabei waren.",
    invalidTitle: "Seite nicht verfügbar",
    notPaidBody:
      "Wir konnten kein bezahltes Ticket zu diesem Link finden. Wenn Sie gerade gekauft haben, warten Sie kurz und laden Sie die Seite neu.",
    capReachedTitle: "Danke — alle drei Fragen sind eingegangen.",
    capReachedBody:
      "Sie haben das Limit von drei Fragen pro Ticket erreicht. Wir freuen uns auf Ihren Besuch.",
    remaining: (n: number) =>
      n === 1
        ? "Sie können danach noch 1 weitere Frage stellen."
        : `Sie können danach noch ${n} weitere Fragen stellen.`,
  },
  fr: {
    title: "Posez une question à nos intervenants",
    subtitle:
      "Choisissez un intervenant et rédigez votre question — notre équipe programmation se charge de la transmettre.",
    closedTitle: "Soumissions clôturées",
    closedBody:
      "Cet événement est terminé. Merci d'en avoir fait partie.",
    invalidTitle: "Page indisponible",
    notPaidBody:
      "Nous n'avons pas trouvé de billet payé pour ce lien. Si vous venez d'acheter, patientez un instant et rechargez la page.",
    capReachedTitle: "Merci — vos trois questions sont enregistrées.",
    capReachedBody:
      "Vous avez atteint la limite de trois questions par billet. Nous avons hâte de vous accueillir.",
    remaining: (n: number) =>
      n === 1
        ? "Vous pourrez ensuite poser 1 question supplémentaire."
        : `Vous pourrez ensuite poser ${n} questions supplémentaires.`,
  },
} as const;

export default async function AskPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: localeRaw, token } = await params;
  const locale = (
    localeRaw === "de" || localeRaw === "fr" ? localeRaw : "en"
  ) as "en" | "de" | "fr";
  const t = COPY[locale];

  if (!TOKEN_RE.test(token)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, order_id, event_id, attendee_name")
    .eq("ticket_token", token)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", ticket.order_id)
    .maybeSingle();

  if (!order || (order.status !== "paid" && order.status !== "comped")) {
    return (
      <ShellState
        title={t.invalidTitle}
        body={t.notPaidBody}
      />
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, ends_at")
    .eq("id", ticket.event_id)
    .maybeSingle();

  if (!event) notFound();

  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  if (new Date(event.ends_at).getTime() <= nowMs) {
    return <ShellState title={t.closedTitle} body={t.closedBody} eventTitle={eventTitle} />;
  }

  const [{ data: joins }, { count: existingCount }] = await Promise.all([
    supabase
      .from("event_speakers")
      .select(
        "speaker_id, role_label_en, role_label_de, role_label_fr, is_featured, sort_order, speakers ( id, first_name, last_name, photo_url, title_en, title_de, title_fr )"
      )
      .eq("event_id", ticket.event_id)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("speaker_questions")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticket.id),
  ]);

  const used = existingCount ?? 0;
  if (used >= PER_TICKET_LIFETIME_CAP) {
    return (
      <ShellState
        title={t.capReachedTitle}
        body={t.capReachedBody}
        eventTitle={eventTitle}
      />
    );
  }

  const speakers = ((joins ?? []) as SpeakerJoinRow[])
    .map((row) => {
      const sp = Array.isArray(row.speakers) ? row.speakers[0] : row.speakers;
      if (!sp) return null;
      const roleLabel =
        (row[`role_label_${locale}` as keyof typeof row] as string | null) ||
        row.role_label_en ||
        (sp[`title_${locale}` as keyof typeof sp] as string | null) ||
        sp.title_en ||
        "";
      return {
        id: sp.id,
        name: `${sp.first_name} ${sp.last_name}`.trim(),
        roleLabel: roleLabel || "",
        photoUrl: sp.photo_url ?? null,
      };
    })
    .filter(
      (s): s is { id: string; name: string; roleLabel: string; photoUrl: string | null } =>
        Boolean(s)
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {eventTitle}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-neutral-900">
          {t.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          {t.subtitle}
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          {t.remaining(PER_TICKET_LIFETIME_CAP - used)}
        </p>
      </header>

      <AskSpeakerForm
        ticketToken={token}
        speakers={speakers}
        locale={locale}
      />
    </main>
  );
}

function ShellState({
  title,
  body,
  eventTitle,
}: {
  title: string;
  body: string;
  eventTitle?: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      {eventTitle && (
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {eventTitle}
        </p>
      )}
      <h1 className="mt-2 font-heading text-2xl font-semibold text-neutral-900">
        {title}
      </h1>
      <p className="mt-3 text-sm text-neutral-600">{body}</p>
    </main>
  );
}
