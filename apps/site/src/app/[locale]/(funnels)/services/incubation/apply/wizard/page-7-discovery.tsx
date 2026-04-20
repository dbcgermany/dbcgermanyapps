"use client";

import { Input } from "@dbc/ui";
import { INCUBATION_DISCOVERY_CHANNELS } from "@dbc/types";
import type { IncubationDiscoveryChannel } from "@dbc/types";
import { OptionCard } from "./option-card";
import { ReviewPanel } from "./review-panel";
import type { AnswersState } from "./types";

export function Page7Discovery({
  answers,
  update,
  t,
  error,
  onEditStep,
}: {
  answers: AnswersState;
  update: (patch: Partial<AnswersState>) => void;
  t: (key: string) => string;
  error: string | null;
  onEditStep: (stepIdx: number) => void;
}) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page7.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page7.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section aria-label={t("page7.heardAbout.label")} className="space-y-2">
        <h2 className="font-heading text-xl font-semibold">
          {t("page7.heardAbout.label")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {INCUBATION_DISCOVERY_CHANNELS.map((key) => (
            <OptionCard
              key={key}
              title={t(`page7.heardAbout.${key}`)}
              selected={answers.heard_about_us === key}
              onSelect={() =>
                update({
                  heard_about_us: key as IncubationDiscoveryChannel,
                  heard_about_us_other:
                    key === "other" ? answers.heard_about_us_other : "",
                })
              }
            />
          ))}
        </div>
        {answers.heard_about_us === "other" ? (
          <Input
            placeholder={t("page7.heardAbout.otherPlaceholder")}
            value={answers.heard_about_us_other}
            onChange={(e) => update({ heard_about_us_other: e.target.value })}
            className="mt-2"
          />
        ) : null}
      </section>

      <ReviewPanel answers={answers} t={t} onEditStep={onEditStep} />
    </div>
  );
}
