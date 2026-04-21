"use client";

import { BirthdayField, CountrySelect, FormField, Input, NameFields } from "@dbc/ui";
import type { WizardLocale, AnswersState } from "./types";

// Page 1 — identity. The only screen that groups multiple fields under
// one heading; every later page is a single question or a tight cluster.
// Keeping identity bundled prevents 5 consecutive one-field screens that
// would feel like stalling.
export function Page1Identity({
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
          {t("page1.title")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {t("page1.subtitle")}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <NameFields
        firstNameName="founder_first_name"
        lastNameName="founder_last_name"
        firstNameLabel={t("page1.fields.firstName")}
        lastNameLabel={t("page1.fields.lastName")}
        firstName={answers.founder_first_name}
        lastName={answers.founder_last_name}
        onFirstNameChange={(v) => update({ founder_first_name: v })}
        onLastNameChange={(v) => update({ founder_last_name: v })}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("page1.fields.email")} required>
          <Input
            type="email"
            autoComplete="email"
            required
            value={answers.founder_email}
            onChange={(e) => update({ founder_email: e.target.value })}
          />
        </FormField>
        <FormField label={t("page1.fields.phone")}>
          <Input
            type="tel"
            autoComplete="tel"
            value={answers.founder_phone}
            onChange={(e) => update({ founder_phone: e.target.value })}
          />
        </FormField>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("page1.fields.country")}
          </label>
          <CountrySelect
            locale={locale}
            value={answers.country}
            onChange={(e) => update({ country: e.target.value })}
          />
        </div>
        <BirthdayField
          label={t("page1.fields.birthday")}
          value={answers.founder_birthday}
          onChange={(iso) => update({ founder_birthday: iso ?? "" })}
          required
        />
      </div>
    </div>
  );
}
