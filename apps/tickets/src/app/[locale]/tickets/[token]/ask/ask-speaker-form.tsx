"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { submitSpeakerQuestion } from "@/actions/submit-speaker-question";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

interface Speaker {
  id: string;
  name: string;
  roleLabel: string;
  photoUrl: string | null;
}

const COPY = {
  en: {
    pickSpeaker: "Pick a speaker",
    yourQuestion: "Your question",
    placeholder: "What would you like to ask on stage?",
    submit: "Submit question",
    submitting: "Submitting…",
    thanksTitle: "Thanks — your question was sent.",
    thanksBody:
      "Our programme team will read every submission. You'll see your question reflected on stage if it's selected.",
    askAnother: "Ask another question",
    doneNoMore: "You've used all your questions for this ticket.",
    counter: (n: number) => `${n} / ${MAX_LENGTH}`,
    needSpeaker: "Please pick a speaker.",
    tooShort: `Please write at least ${MIN_LENGTH} characters.`,
  },
  de: {
    pickSpeaker: "Speaker:in wählen",
    yourQuestion: "Ihre Frage",
    placeholder: "Was möchten Sie auf der Bühne fragen?",
    submit: "Frage senden",
    submitting: "Wird gesendet…",
    thanksTitle: "Danke — Ihre Frage ist eingegangen.",
    thanksBody:
      "Unser Programmteam liest jede Einreichung. Wenn Ihre Frage ausgewählt wird, hören Sie sie auf der Bühne.",
    askAnother: "Noch eine Frage stellen",
    doneNoMore:
      "Für dieses Ticket wurden bereits alle möglichen Fragen verwendet.",
    counter: (n: number) => `${n} / ${MAX_LENGTH}`,
    needSpeaker: "Bitte wählen Sie eine Speaker:in.",
    tooShort: `Bitte schreiben Sie mindestens ${MIN_LENGTH} Zeichen.`,
  },
  fr: {
    pickSpeaker: "Choisir un intervenant",
    yourQuestion: "Votre question",
    placeholder: "Que souhaitez-vous demander sur scène ?",
    submit: "Envoyer la question",
    submitting: "Envoi…",
    thanksTitle: "Merci — votre question est bien envoyée.",
    thanksBody:
      "Notre équipe programmation lit chaque envoi. Si votre question est retenue, vous l'entendrez sur scène.",
    askAnother: "Poser une autre question",
    doneNoMore:
      "Vous avez utilisé toutes vos questions pour ce billet.",
    counter: (n: number) => `${n} / ${MAX_LENGTH}`,
    needSpeaker: "Veuillez choisir un intervenant.",
    tooShort: `Veuillez écrire au moins ${MIN_LENGTH} caractères.`,
  },
} as const;

export function AskSpeakerForm({
  ticketToken,
  speakers,
  locale,
}: {
  ticketToken: string;
  speakers: Speaker[];
  locale: "en" | "de" | "fr";
}) {
  const t = COPY[locale];
  const [speakerId, setSpeakerId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<{ remaining: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setSpeakerId("");
    setQuestion("");
    setError(null);
    setThanks(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!speakerId) {
      setError(t.needSpeaker);
      return;
    }
    const trimmed = question.trim();
    if (trimmed.length < MIN_LENGTH) {
      setError(t.tooShort);
      return;
    }

    startTransition(async () => {
      const res = await submitSpeakerQuestion({
        ticketToken,
        speakerId,
        question: trimmed,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setThanks({ remaining: res.remaining ?? 0 });
    });
  }

  if (thanks) {
    const canAskMore = thanks.remaining > 0;
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
        <h2 className="font-heading text-xl font-semibold text-neutral-900">
          {t.thanksTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">{t.thanksBody}</p>
        {canAskMore ? (
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-[#c8102e] px-4 py-2 text-sm font-medium text-white hover:bg-[#a30d24]"
          >
            {t.askAnother}
          </button>
        ) : (
          <p className="mt-4 text-xs text-neutral-500">{t.doneNoMore}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">
          {t.pickSpeaker}
        </legend>
        <ul className="mt-3 space-y-2">
          {speakers.map((s) => {
            const selected = speakerId === s.id;
            return (
              <li key={s.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selected
                      ? "border-[#c8102e] bg-red-50/40"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="speaker"
                    value={s.id}
                    checked={selected}
                    onChange={() => setSpeakerId(s.id)}
                    className="mt-1 h-4 w-4 accent-[#c8102e]"
                  />
                  {s.photoUrl ? (
                    <Image
                      src={s.photoUrl}
                      alt={s.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="h-12 w-12 shrink-0 rounded-full bg-neutral-200" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-900">
                      {s.name}
                    </span>
                    {s.roleLabel && (
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {s.roleLabel}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-neutral-900"
        >
          {t.yourQuestion}
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LENGTH))}
          rows={6}
          placeholder={t.placeholder}
          className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-6 text-neutral-900 focus:border-[#c8102e] focus:outline-none focus:ring-2 focus:ring-[#c8102e]/40"
          required
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
        />
        <p className="mt-1 text-right text-xs text-neutral-500">
          {t.counter(question.trim().length)}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a30d24] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  );
}
