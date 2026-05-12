"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChapterSelect } from "@dbc/ui";
import { submitChapterDelegateRegistration } from "@/actions/chapter-delegate";

// window.turnstile is declared globally by checkout-form.tsx; reuse that type.

const T = {
  en: {
    delegate: "Your details",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    position: "Position / role in your chapter",
    positionPh: "Community lead, treasurer, …",
    chapter: "Chapter (country)",
    pickChapter: "— Select your chapter —",
    leadHeader: "Chapter lead (optional)",
    leadHint:
      "If your chapter lead vouches for you, we'll CC them on the confirmation.",
    leadName: "Chapter lead name",
    leadEmail: "Chapter lead email",
    companionToggle: "I'm bringing a +1",
    companionHeader: "Companion",
    companionFirst: "Companion first name",
    companionLast: "Companion last name",
    companionEmail: "Companion email",
    consent: "I confirm I'm a DBC chapter team member.",
    submit: "Send registration",
    submitting: "Sending…",
    success:
      "Thanks — your registration is being reviewed. The Germany team will email you shortly.",
    botCheck: "Bot check loading…",
  },
  de: {
    delegate: "Deine Daten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    position: "Position / Rolle in deinem Chapter",
    positionPh: "Community Lead, Treasurer, …",
    chapter: "Chapter (Land)",
    pickChapter: "— Wähle dein Chapter —",
    leadHeader: "Chapter Lead (optional)",
    leadHint:
      "Wenn dein Chapter Lead dich bestätigt, setzen wir ihn auf CC.",
    leadName: "Name des Chapter Leads",
    leadEmail: "E-Mail des Chapter Leads",
    companionToggle: "Ich bringe eine +1 mit",
    companionHeader: "Begleitperson",
    companionFirst: "Vorname Begleitung",
    companionLast: "Nachname Begleitung",
    companionEmail: "E-Mail Begleitung",
    consent: "Ich bestätige, dass ich Mitglied eines DBC Chapters bin.",
    submit: "Registrierung absenden",
    submitting: "Wird gesendet…",
    success:
      "Danke — deine Registrierung wird geprüft. Das Germany-Team meldet sich per E-Mail.",
    botCheck: "Bot-Schutz lädt…",
  },
  fr: {
    delegate: "Vos informations",
    firstName: "Prénom",
    lastName: "Nom",
    email: "E-mail",
    position: "Poste / rôle dans votre chapitre",
    positionPh: "Lead communauté, trésorier·ère, …",
    chapter: "Chapitre (pays)",
    pickChapter: "— Sélectionnez votre chapitre —",
    leadHeader: "Lead du chapitre (optionnel)",
    leadHint:
      "Si votre lead vous recommande, nous le mettrons en copie.",
    leadName: "Nom du lead",
    leadEmail: "E-mail du lead",
    companionToggle: "J'amène un·e +1",
    companionHeader: "Accompagnateur·ice",
    companionFirst: "Prénom",
    companionLast: "Nom",
    companionEmail: "E-mail",
    consent: "Je confirme être membre d'un chapitre DBC.",
    submit: "Envoyer l'inscription",
    submitting: "Envoi…",
    success:
      "Merci — votre inscription est en cours d'examen. L'équipe Allemagne vous écrira sous peu.",
    botCheck: "Vérification anti-bot…",
  },
};

export function RegisterForm({
  locale,
  eventSlug,
  turnstileSiteKey,
}: {
  locale: "en" | "de" | "fr";
  eventSlug: string;
  turnstileSiteKey: string | null;
}) {
  const t = T[locale];
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bringsCompanion, setBringsCompanion] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Cloudflare Turnstile widget loader (mirrors checkout-form).
  useEffect(() => {
    if (!turnstileSiteKey) return;
    if (!turnstileRef.current) return;
    function render() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey!,
        callback: (token: string) => setTurnstileToken(token),
      });
    }
    if (window.turnstile) render();
    else {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [turnstileSiteKey]);

  if (success) {
    return (
      <div className="mt-6 rounded-md border border-success-border bg-success-soft/30 p-4 text-sm text-success">
        {t.success}
      </div>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitChapterDelegateRegistration({
        eventSlug,
        firstName: (formData.get("first_name") as string) ?? "",
        lastName: (formData.get("last_name") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        position: (formData.get("position") as string) ?? "",
        chapterCountry: (formData.get("chapter_country") as string) ?? "",
        chapterLeadName:
          (formData.get("chapter_lead_name") as string) || undefined,
        chapterLeadEmail:
          (formData.get("chapter_lead_email") as string) || undefined,
        bringsCompanion,
        companionFirstName:
          (formData.get("companion_first_name") as string) || undefined,
        companionLastName:
          (formData.get("companion_last_name") as string) || undefined,
        companionEmail:
          (formData.get("companion_email") as string) || undefined,
        consent: formData.get("consent") === "on",
        locale,
        honeypot: (formData.get("website") as string) || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });
      if (res.error) setError(res.error);
      else setSuccess(true);
    });
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md border border-danger-border bg-danger-soft/40 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Website (do not fill)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.delegate}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.firstName}
            </label>
            <input
              name="first_name"
              type="text"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.lastName}
            </label>
            <input
              name="last_name"
              type="text"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.email}
            </label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.chapter}
            </label>
            <ChapterSelect
              locale={locale}
              name="chapter_country"
              required
              placeholder={t.pickChapter}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1">
              {t.position}
            </label>
            <input
              name="position"
              type="text"
              required
              placeholder={t.positionPh}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.leadHeader}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.leadHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.leadName}
            </label>
            <input
              name="chapter_lead_name"
              type="text"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t.leadEmail}
            </label>
            <input
              name="chapter_lead_email"
              type="email"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bringsCompanion}
            onChange={(e) => setBringsCompanion(e.target.checked)}
            className="accent-primary"
          />
          <span>{t.companionToggle}</span>
        </label>
        {bringsCompanion && (
          <div className="mt-3 rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.companionHeader}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t.companionFirst}
                </label>
                <input
                  name="companion_first_name"
                  type="text"
                  required={bringsCompanion}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t.companionLast}
                </label>
                <input
                  name="companion_last_name"
                  type="text"
                  required={bringsCompanion}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">
                  {t.companionEmail}
                </label>
                <input
                  name="companion_email"
                  type="email"
                  required={bringsCompanion}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 accent-primary"
        />
        <span>{t.consent}</span>
      </label>

      {turnstileSiteKey && (
        <div>
          <div ref={turnstileRef} />
          {!turnstileToken && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t.botCheck}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (!!turnstileSiteKey && !turnstileToken)}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
