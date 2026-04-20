"use client";

import { Input } from "@dbc/ui";
import { INCUBATION_PROFILE_TYPES } from "@dbc/types";
import type { IncubationProfileType } from "@dbc/types";
import { OptionCard } from "./option-card";
import type { AnswersState } from "./types";

type ProfileKey = (typeof INCUBATION_PROFILE_TYPES)[number];

const PROFILE_COPY_KEYS: Record<ProfileKey, { label: string; desc: string }> = {
  project_holder: {
    label: "page2.profileType.projectHolder",
    desc: "page2.profileType.projectHolderDesc",
  },
  entrepreneur: {
    label: "page2.profileType.entrepreneur",
    desc: "page2.profileType.entrepreneurDesc",
  },
  student: {
    label: "page2.profileType.student",
    desc: "page2.profileType.studentDesc",
  },
  investor: {
    label: "page2.profileType.investor",
    desc: "page2.profileType.investorDesc",
  },
  other: {
    label: "page2.profileType.other",
    desc: "page2.profileType.otherDesc",
  },
};

export function Page2Profile({
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
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {t("page2.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page2.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <section aria-label={t("page2.profileType.label")} className="space-y-3">
        {INCUBATION_PROFILE_TYPES.map((key) => (
          <OptionCard
            key={key}
            title={t(PROFILE_COPY_KEYS[key].label)}
            description={t(PROFILE_COPY_KEYS[key].desc)}
            selected={answers.profile_type === key}
            onSelect={() => {
              update({
                profile_type: key as IncubationProfileType,
                profile_type_other:
                  key === "other" ? answers.profile_type_other : "",
              });
            }}
          />
        ))}
        {answers.profile_type === "other" ? (
          <Input
            placeholder={t("page2.profileType.otherPlaceholder")}
            value={answers.profile_type_other}
            onChange={(e) => update({ profile_type_other: e.target.value })}
            className="mt-2"
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            {t("page2.hasIdea.label")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page2.hasIdea.subtitle")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            title={t("page2.hasIdea.yes")}
            selected={answers.has_idea === "yes"}
            onSelect={() => {
              update({ has_idea: "yes" });
              if (answers.profile_type) onAutoAdvance();
            }}
          />
          <OptionCard
            title={t("page2.hasIdea.no")}
            selected={answers.has_idea === "no"}
            onSelect={() => {
              update({ has_idea: "no" });
              if (answers.profile_type) onAutoAdvance();
            }}
          />
        </div>
      </section>
    </div>
  );
}
