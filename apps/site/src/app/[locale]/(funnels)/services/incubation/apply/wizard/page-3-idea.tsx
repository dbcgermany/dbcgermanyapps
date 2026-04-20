"use client";

import { FormField, Textarea } from "@dbc/ui";
import type { AnswersState } from "./types";

// Skipped entirely when has_idea === "no". The shell controls that routing,
// so this component can assume it's rendered only for applicants who have
// an idea to describe.
export function Page3Idea({
  answers,
  update,
  t,
  error,
}: {
  answers: AnswersState;
  update: (patch: Partial<AnswersState>) => void;
  t: (key: string) => string;
  error: string | null;
}) {
  const fields: { key: keyof Pick<AnswersState, "idea_problem" | "idea_audience" | "idea_development_stage" | "idea_ambitions">; i18nBase: string }[] = [
    { key: "idea_problem", i18nBase: "page3.fields.problem" },
    { key: "idea_audience", i18nBase: "page3.fields.audience" },
    { key: "idea_development_stage", i18nBase: "page3.fields.stage" },
    { key: "idea_ambitions", i18nBase: "page3.fields.ambitions" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page3.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page3.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {fields.map(({ key, i18nBase }) => (
        <FormField key={key} label={t(`${i18nBase}.label`)}>
          <Textarea
            rows={3}
            placeholder={t(`${i18nBase}.placeholder`)}
            value={answers[key]}
            onChange={(e) => update({ [key]: e.target.value } as Partial<AnswersState>)}
          />
        </FormField>
      ))}
    </div>
  );
}
