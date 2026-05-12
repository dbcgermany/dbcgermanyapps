import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import { RegisterForm } from "./register-form";

const T = {
  en: {
    title: "Chapter delegate registration",
    intro:
      "Register yourself as a DBC team member from outside Germany for the event below. Your tickets are issued only after the Germany team confirms your registration.",
    closed:
      "Chapter delegate registration is not open for this event right now.",
  },
  de: {
    title: "Registrierung als Chapter-Delegierte:r",
    intro:
      "Registriere dich als DBC-Team-Mitglied außerhalb Deutschlands für die Veranstaltung unten. Tickets werden erst nach Bestätigung durch das Germany-Team versendet.",
    closed: "Die Chapter-Delegierten-Registrierung ist aktuell geschlossen.",
  },
  fr: {
    title: "Inscription en tant que délégué·e de chapitre",
    intro:
      "Inscrivez-vous en tant que membre de l'équipe DBC d'un autre pays. Les billets ne sont émis qu'après confirmation par l'équipe DBC Allemagne.",
    closed: "L'inscription des délégués est actuellement fermée.",
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
