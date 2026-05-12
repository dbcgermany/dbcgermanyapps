import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import { RegisterForm } from "./register-form";

const T = {
  en: {
    title: "Chapter delegate registration",
    intro:
      "Register yourself as a DBC team member from outside Germany for the event below. Tickets are issued only after the DBC Germany team confirms your registration.",
    accessWarning:
      "Important: anyone who is NOT registered will be denied entry at the venue. Make sure every team member who plans to attend is registered through this form.",
    closed:
      "Chapter delegate registration is not open for this event right now.",
  },
  de: {
    title: "Anmeldung als Sektions-Delegierte:r",
    intro:
      "Melde dich als DBC-Team-Mitglied außerhalb Deutschlands für die unten genannte Veranstaltung an. Tickets werden erst nach Freigabe durch das DBC Germany Team versendet.",
    accessWarning:
      "Wichtig: Wer NICHT registriert ist, wird am Einlass abgewiesen. Bitte stelle sicher, dass jedes Team-Mitglied, das teilnehmen möchte, über dieses Formular angemeldet ist.",
    closed: "Die Anmeldung für Sektions-Delegierte ist aktuell geschlossen.",
  },
  fr: {
    title: "Inscription en tant que délégué·e d’antenne",
    intro:
      "Inscrivez-vous en tant que membre de l’équipe DBC d’un autre pays pour l’événement ci-dessous. Les billets sont émis uniquement après confirmation de l’équipe DBC Allemagne.",
    accessWarning:
      "Important : toute personne NON inscrite se verra refuser l’accès au lieu. Assurez-vous que chaque membre de l’équipe qui souhaite participer est inscrit via ce formulaire.",
    closed: "L’inscription des délégué·e·s d’antenne est actuellement fermée.",
  },
} as const;

export default async function ChapterDelegateRegisterPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  const lang = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const t = T[lang];

  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title_en, title_de, title_fr, starts_at, ends_at, city, venue_name, chapter_delegate_program_enabled"
    )
    .eq("slug", eventSlug)
    .maybeSingle();
  if (!event) notFound();

  const eventTitle =
    (event[`title_${lang}` as keyof typeof event] as string) ||
    event.title_en ||
    eventSlug;
  const startsAt = new Date(event.starts_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        {t.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong>{eventTitle}</strong> · {startsAt}
        {event.city ? ` · ${event.city}` : ""}
      </p>
      <p className="mt-4 text-sm leading-6 text-foreground">{t.intro}</p>

      <div className="mt-4 rounded-md border-l-4 border-warning bg-warning-soft/40 p-4 text-sm text-foreground">
        <p>
          <strong>⚠ </strong>
          {t.accessWarning}
        </p>
      </div>

      {!event.chapter_delegate_program_enabled ? (
        <div className="mt-6 rounded-md border border-warning-border bg-warning-soft/40 p-4 text-sm">
          {t.closed}
        </div>
      ) : (
        <RegisterForm
          locale={lang}
          eventSlug={eventSlug}
          turnstileSiteKey={turnstileSiteKey}
        />
      )}
    </main>
  );
}
