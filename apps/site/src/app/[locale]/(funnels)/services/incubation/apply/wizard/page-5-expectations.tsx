"use client";

import { FormField, Input, Textarea } from "@dbc/ui";
import { INCUBATION_SERVICES } from "@dbc/types";
import type { IncubationService } from "@dbc/types";
import { OptionCard } from "./option-card";
import type { AnswersState } from "./types";

export function Page5Expectations({
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
  function toggleService(key: IncubationService) {
    const next = answers.services_wanted.includes(key)
      ? answers.services_wanted.filter((k) => k !== key)
      : [...answers.services_wanted, key];
    update({
      services_wanted: next,
      services_wanted_other: next.includes("other") ? answers.services_wanted_other : "",
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page5.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page5.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section aria-label={t("page5.services.label")} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {INCUBATION_SERVICES.map((key) => (
            <OptionCard
              key={key}
              title={t(`page5.services.${key}.title`)}
              description={t(`page5.services.${key}.desc`)}
              selected={answers.services_wanted.includes(key)}
              onSelect={() => toggleService(key)}
            />
          ))}
        </div>
        {answers.services_wanted.includes("other") ? (
          <Input
            placeholder={t("page5.services.otherPlaceholder")}
            value={answers.services_wanted_other}
            onChange={(e) => update({ services_wanted_other: e.target.value })}
            className="mt-2"
          />
        ) : null}
      </section>

      <FormField label={t("page5.whyJoin.label")} required>
        <Textarea
          rows={4}
          required
          placeholder={t("page5.whyJoin.placeholder")}
          value={answers.why_join}
          onChange={(e) => update({ why_join: e.target.value })}
        />
      </FormField>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            {t("page5.diaspora.label")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page5.diaspora.subtitle")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            title={t("page5.diaspora.yes")}
            selected={answers.diaspora_link === "yes"}
            onSelect={() => update({ diaspora_link: "yes" })}
          />
          <OptionCard
            title={t("page5.diaspora.no")}
            selected={answers.diaspora_link === "no"}
            onSelect={() =>
              update({ diaspora_link: "no", diaspora_origin_country: "" })
            }
          />
        </div>
      </section>
    </div>
  );
}
