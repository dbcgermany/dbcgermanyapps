"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@dbc/ui";
import { FunnelStepper } from "@/components/funnel/funnel-stepper";
import { fireFunnelConversion } from "@/components/funnel/funnel-analytics";
import { submitIncubationApplication } from "@/actions/incubation";
import { INITIAL_ANSWERS } from "./types";
import type { AnswersState, WizardLocale } from "./types";
import { Page1Identity } from "./page-1-identity";
import { Page2Profile } from "./page-2-profile";
import { Page3Idea } from "./page-3-idea";
import { Page4Sectors } from "./page-4-sectors";
import { Page5Expectations } from "./page-5-expectations";
import { Page6Diaspora } from "./page-6-diaspora";
import { Page7Discovery } from "./page-7-discovery";

// Steps 0–6, but pages 2 and 5 are conditional. `visibleSteps()` returns
// the ordered list of steps the current applicant will see given their
// answers so the stepper and navigation match reality.
const ALL_STEPS = [0, 1, 2, 3, 4, 5, 6] as const;

function visibleSteps(answers: AnswersState): number[] {
  return ALL_STEPS.filter((s) => {
    if (s === 2) return answers.has_idea === "yes";
    if (s === 5) return answers.diaspora_link === "yes";
    return true;
  });
}

const STORAGE_KEY = "dbc:incubation-wizard:v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WizardShell({
  locale,
  funnelId,
}: {
  locale: WizardLocale;
  funnelId?: string;
}) {
  const t = useTranslations("funnelWizard");
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswersState>(INITIAL_ANSWERS);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount (locale-keyed).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${locale}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: AnswersState; step?: number };
        if (parsed.answers) setAnswers({ ...INITIAL_ANSWERS, ...parsed.answers });
        if (typeof parsed.step === "number" && parsed.step >= 0 && parsed.step <= 6) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* ignore */
    }
  }, [locale]);

  // Persist on every change (cheap, 1 key per locale).
  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}:${locale}`,
        JSON.stringify({ answers, step })
      );
    } catch {
      /* ignore */
    }
  }, [answers, step, locale]);

  const update = useCallback((patch: Partial<AnswersState>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const steps = useMemo(() => visibleSteps(answers), [answers]);
  const stepIndex = steps.indexOf(step);
  const effectiveIndex = stepIndex === -1 ? 0 : stepIndex;
  const totalVisible = steps.length;

  function validateCurrent(): string | null {
    if (step === 0) {
      if (!answers.founder_first_name.trim() || !answers.founder_last_name.trim()) return t("errors.required");
      if (!EMAIL_RE.test(answers.founder_email.trim())) return t("errors.invalidEmail");
      if (!answers.country) return t("errors.required");
      if (!answers.founder_birthday) return t("errors.required");
      // Sanity-check the birthdate: must parse, and imply an age in 14–120.
      const dob = new Date(answers.founder_birthday);
      if (Number.isNaN(dob.getTime())) return t("errors.invalidDate");
      const ageYears =
        (Date.now() - dob.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
      if (ageYears < 14 || ageYears > 120) return t("errors.invalidDate");
      return null;
    }
    if (step === 1) {
      if (!answers.profile_type) return t("errors.required");
      if (!answers.has_idea) return t("errors.required");
      return null;
    }
    if (step === 2) {
      if (!answers.idea_problem.trim() || !answers.idea_audience.trim()) return t("errors.required");
      return null;
    }
    if (step === 3) {
      if (answers.industry_sectors.length === 0) return t("errors.selectAtLeastOne");
      if (!answers.has_prior_accompaniment) return t("errors.required");
      return null;
    }
    if (step === 4) {
      if (answers.services_wanted.length === 0) return t("errors.selectAtLeastOne");
      if (!answers.why_join.trim()) return t("errors.required");
      if (!answers.diaspora_link) return t("errors.required");
      return null;
    }
    if (step === 5) {
      if (!answers.diaspora_origin_country) return t("errors.required");
      return null;
    }
    if (step === 6) {
      if (!answers.heard_about_us) return t("errors.required");
      return null;
    }
    return null;
  }

  const goNext = useCallback(() => {
    const err = validateCurrent();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const idx = steps.indexOf(step);
    const nextIdx = idx + 1;
    if (nextIdx < steps.length) {
      setStep(steps[nextIdx]!);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, step, steps]);

  const goBack = useCallback(() => {
    const idx = steps.indexOf(step);
    const prevIdx = idx - 1;
    if (prevIdx >= 0) {
      setStep(steps[prevIdx]!);
      setError(null);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, steps]);

  const jumpTo = useCallback(
    (target: number) => {
      if (steps.includes(target)) {
        setStep(target);
        setError(null);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [steps]
  );

  const scheduleAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => goNext(), 280);
  }, [goNext]);

  useEffect(
    () => () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    },
    []
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateCurrent();
    if (err) {
      setError(err);
      return;
    }
    setServerError(null);
    const fd = buildFormData(answers, locale);
    startTransition(async () => {
      const result = await submitIncubationApplication(null, fd);
      if (result.success) {
        try {
          localStorage.removeItem(`${STORAGE_KEY}:${locale}`);
        } catch {
          /* ignore */
        }
        if (funnelId) fireFunnelConversion(funnelId, locale);
        router.push(`/${locale}/services/incubation/apply/thank-you`);
      } else {
        setServerError(result.error ?? t("errors.required"));
      }
    });
  }

  const isLast = step === 6;
  const progressLabel = t("progress", {
    current: effectiveIndex + 1,
    total: totalVisible,
  });

  return (
    <form onSubmit={handleSubmit} className="pb-16">
      <FunnelStepper
        current={effectiveIndex + 1}
        total={totalVisible}
        label={progressLabel}
      />
      <div key={step} className="dbc-page-enter mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8">
        {step === 0 && (
          <Page1Identity locale={locale} answers={answers} update={update} t={t} error={error} />
        )}
        {step === 1 && (
          <Page2Profile
            answers={answers}
            update={update}
            t={t}
            onAutoAdvance={scheduleAutoAdvance}
            error={error}
          />
        )}
        {step === 2 && (
          <Page3Idea answers={answers} update={update} t={t} error={error} />
        )}
        {step === 3 && (
          <Page4Sectors
            answers={answers}
            update={update}
            t={t}
            onAutoAdvance={scheduleAutoAdvance}
            error={error}
          />
        )}
        {step === 4 && (
          <Page5Expectations answers={answers} update={update} t={t} error={error} />
        )}
        {step === 5 && (
          <Page6Diaspora
            locale={locale}
            answers={answers}
            update={update}
            t={t}
            error={error}
          />
        )}
        {step === 6 && (
          <Page7Discovery
            answers={answers}
            update={update}
            t={t}
            error={error}
            onEditStep={jumpTo}
          />
        )}

        {serverError ? (
          <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {serverError}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={goBack}
            disabled={effectiveIndex === 0 || pending}
            className="sm:min-w-[140px]"
          >
            {t("nav.back")}
          </Button>
          {isLast ? (
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="sm:min-w-[220px]"
            >
              {pending ? "…" : t("nav.submit")}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={goNext}
              disabled={pending}
              className="sm:min-w-[180px]"
            >
              {t("nav.next")}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function buildFormData(answers: AnswersState, locale: WizardLocale): FormData {
  const fd = new FormData();
  fd.set("locale", locale);
  fd.set("founder_first_name", answers.founder_first_name);
  fd.set("founder_last_name", answers.founder_last_name);
  fd.set("founder_email", answers.founder_email);
  fd.set("founder_phone", answers.founder_phone);
  fd.set("country", answers.country);
  fd.set("title", answers.title);
  fd.set("gender", answers.gender);
  fd.set("birthday", answers.founder_birthday);

  fd.set("profile_type", answers.profile_type);
  fd.set("profile_type_other", answers.profile_type_other);
  fd.set("has_idea", answers.has_idea);

  fd.set("idea_problem", answers.idea_problem);
  fd.set("idea_audience", answers.idea_audience);
  fd.set("idea_development_stage", answers.idea_development_stage);
  fd.set("idea_ambitions", answers.idea_ambitions);

  for (const s of answers.industry_sectors) fd.append("industry_sectors", s);
  fd.set("industry_sectors_other", answers.industry_sectors_other);
  fd.set("has_prior_accompaniment", answers.has_prior_accompaniment);

  for (const s of answers.services_wanted) fd.append("services_wanted", s);
  fd.set("services_wanted_other", answers.services_wanted_other);
  fd.set("why_join", answers.why_join);
  fd.set("diaspora_link", answers.diaspora_link);

  fd.set("diaspora_origin_country", answers.diaspora_origin_country);

  fd.set("heard_about_us", answers.heard_about_us);
  fd.set("heard_about_us_other", answers.heard_about_us_other);

  return fd;
}
