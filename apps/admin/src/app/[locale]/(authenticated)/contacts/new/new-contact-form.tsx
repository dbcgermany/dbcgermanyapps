"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CountrySelect, NameFields } from "@dbc/ui";
import {
  createContact,
  INVOLVEMENT_ROLES,
  type InvolvementRole,
} from "@/actions/contacts";

type EventRow = { id: string; title_en: string; starts_at: string };

type FormState = { error?: string; id?: string } | null;

export function NewContactForm({
  locale,
  events,
}: {
  locale: string;
  events: EventRow[];
}) {
  const router = useRouter();
  const t = useTranslations("admin.contacts");
  const tPerson = useTranslations("person");
  const tRole = useTranslations("admin.contacts.roles");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await createContact(formData);
      if ("error" in result) return { error: result.error };
      router.push(`/${locale}/contacts/${result.id}`);
      return { id: result.id };
    },
    null
  );

  const input =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <NameFields
        firstNameLabel={tPerson("firstName")}
        lastNameLabel={tPerson("lastName")}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t("email")}
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("phone")}</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+49…"
            className={input}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("country")}</span>
          <CountrySelect name="country" locale={locale} placeholder="—" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t("occupation")}
          </span>
          <input type="text" name="occupation" className={input} />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{t("linkToEvent")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="event_id" defaultValue="" className={input}>
            <option value="">{t("selectEvent")}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title_en}
              </option>
            ))}
          </select>
          <select name="role" defaultValue="sponsor" className={input}>
            {(INVOLVEMENT_ROLES as readonly InvolvementRole[]).map((r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          {t("adminNotes")}
        </span>
        <textarea
          name="admin_notes"
          rows={3}
          className={input}
          placeholder={t("adminNotesHint")}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
