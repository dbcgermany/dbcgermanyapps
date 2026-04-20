"use client";

import { Input } from "@dbc/ui";
import { INCUBATION_INDUSTRY_SECTORS } from "@dbc/types";
import type { IncubationIndustrySector } from "@dbc/types";
import { OptionCard } from "./option-card";
import type { AnswersState } from "./types";

export function Page4Sectors({
  answers,
  update,
  t,
  onAutoAdvance,
  error,
}: {
  answers: AnswersState;
  update: (patch: Partial<AnswersState>) => void;
  t: (key: string) => string;
  onAutoAdvance: () => void;
  error: string | null;
}) {
  function toggleSector(key: IncubationIndustrySector) {
    const next = answers.industry_sectors.includes(key)
      ? answers.industry_sectors.filter((k) => k !== key)
      : [...answers.industry_sectors, key];
    update({
      industry_sectors: next,
      industry_sectors_other: next.includes("other") ? answers.industry_sectors_other : "",
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page4.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page4.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section aria-label={t("page4.sectors.label")} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {INCUBATION_INDUSTRY_SECTORS.map((key) => (
            <OptionCard
              key={key}
              title={t(`page4.sectors.${key}`)}
              selected={answers.industry_sectors.includes(key)}
              onSelect={() => toggleSector(key)}
            />
          ))}
        </div>
        {answers.industry_sectors.includes("other") ? (
          <Input
            placeholder={t("page4.sectors.otherPlaceholder")}
            value={answers.industry_sectors_other}
            onChange={(e) => update({ industry_sectors_other: e.target.value })}
            className="mt-2"
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            {t("page4.prior.label")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page4.prior.subtitle")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            title={t("page4.prior.yes")}
            selected={answers.has_prior_accompaniment === "yes"}
            onSelect={() => {
              update({ has_prior_accompaniment: "yes" });
              if (answers.industry_sectors.length > 0) onAutoAdvance();
            }}
          />
          <OptionCard
            title={t("page4.prior.no")}
            selected={answers.has_prior_accompaniment === "no"}
            onSelect={() => {
              update({ has_prior_accompaniment: "no" });
              if (answers.industry_sectors.length > 0) onAutoAdvance();
            }}
          />
        </div>
      </section>
    </div>
  );
}
