"use client";

import { CountrySelect } from "@dbc/ui";
import type { WizardLocale, AnswersState } from "./types";

// Skipped entirely when diaspora_link !== "yes".
export function Page6Diaspora({
  locale,
  answers,
  update,
  t,
  error,
}: {
  locale: WizardLocale;
  answers: AnswersState;
  update: (patch: Partial<AnswersState>) => void;
  t: (key: string) => string;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page6.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page6.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("page6.label")}
        </label>
        <CountrySelect
          locale={locale}
          value={answers.diaspora_origin_country}
          onChange={(e) => update({ diaspora_origin_country: e.target.value })}
        />
      </div>
    </div>
  );
}
