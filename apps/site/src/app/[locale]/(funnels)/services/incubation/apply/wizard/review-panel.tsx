"use client";

import type { AnswersState } from "./types";

// Last-step summary: flat two-column list of every answered question.
// Each row has an inline "Edit" button that jumps back to the owning
// step. Unanswered rows are skipped so the list stays dense.
export function ReviewPanel({
  answers,
  t,
  onEditStep,
}: {
  answers: AnswersState;
  t: (key: string) => string;
  onEditStep: (stepIdx: number) => void;
}) {
  const rows: { label: string; value: string; step: number }[] = [];

  const identity = [
    answers.founder_first_name,
    answers.founder_last_name,
  ]
    .filter(Boolean)
    .join(" ");
  if (identity) rows.push({ label: t("page1.fields.firstName"), value: identity, step: 0 });
  if (answers.founder_email) rows.push({ label: t("page1.fields.email"), value: answers.founder_email, step: 0 });
  if (answers.founder_phone) rows.push({ label: t("page1.fields.phone"), value: answers.founder_phone, step: 0 });
  if (answers.country) rows.push({ label: t("page1.fields.country"), value: answers.country, step: 0 });
  if (answers.founder_birthday) rows.push({ label: t("page1.fields.birthday"), value: answers.founder_birthday, step: 0 });

  if (answers.profile_type) {
    const label = answers.profile_type === "other" && answers.profile_type_other
      ? answers.profile_type_other
      : t(`page2.profileType.${camel(answers.profile_type)}`);
    rows.push({ label: t("page2.profileType.label"), value: label, step: 1 });
  }
  if (answers.has_idea) {
    rows.push({
      label: t("page2.hasIdea.label"),
      value: t(`page2.hasIdea.${answers.has_idea}`),
      step: 1,
    });
  }

  if (answers.has_idea === "yes") {
    if (answers.idea_problem) rows.push({ label: t("page3.fields.problem.label"), value: answers.idea_problem, step: 2 });
    if (answers.idea_audience) rows.push({ label: t("page3.fields.audience.label"), value: answers.idea_audience, step: 2 });
    if (answers.idea_development_stage) rows.push({ label: t("page3.fields.stage.label"), value: answers.idea_development_stage, step: 2 });
    if (answers.idea_ambitions) rows.push({ label: t("page3.fields.ambitions.label"), value: answers.idea_ambitions, step: 2 });
  }

  if (answers.industry_sectors.length > 0) {
    const vals = answers.industry_sectors.map((s) =>
      s === "other" && answers.industry_sectors_other
        ? answers.industry_sectors_other
        : t(`page4.sectors.${s}`)
    );
    rows.push({ label: t("page4.sectors.label"), value: vals.join(" · "), step: 3 });
  }
  if (answers.has_prior_accompaniment) {
    rows.push({
      label: t("page4.prior.label"),
      value: t(`page4.prior.${answers.has_prior_accompaniment}`),
      step: 3,
    });
  }

  if (answers.services_wanted.length > 0) {
    const vals = answers.services_wanted.map((s) =>
      s === "other" && answers.services_wanted_other
        ? answers.services_wanted_other
        : t(`page5.services.${s}.title`)
    );
    rows.push({ label: t("page5.services.label"), value: vals.join(" · "), step: 4 });
  }
  if (answers.why_join) rows.push({ label: t("page5.whyJoin.label"), value: answers.why_join, step: 4 });
  if (answers.diaspora_link) {
    rows.push({
      label: t("page5.diaspora.label"),
      value: t(`page5.diaspora.${answers.diaspora_link}`),
      step: 4,
    });
  }

  if (answers.diaspora_link === "yes" && answers.diaspora_origin_country) {
    rows.push({ label: t("page6.label"), value: answers.diaspora_origin_country, step: 5 });
  }

  return (
    <section className="rounded-2xl border border-border bg-muted/30 p-5">
      <h2 className="font-heading text-xl font-semibold">
        {t("page7.review.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("page7.review.subtitle")}
      </p>
      <ul className="mt-5 divide-y divide-border">
        {rows.map((row, i) => (
          <li key={i} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                {row.value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(row.step)}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {t("page7.review.editLabel")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
